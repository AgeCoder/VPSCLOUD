// sync.service.ts (updated with change log based deletions)
import { eq, and, gt, inArray } from "drizzle-orm";
import { db } from "../db";
import {
    users as serverUsers,
    documents as serverDocuments,
    branch as serverBranch,
    changeLog as serverChangeLog,
    settings as serverSettings,
    accessLogs as serverAccessLogs
} from "../db/schema";
import {
    users as localUsers,
    documents as localDocuments,
    branch as localBranch,
    settings as localSettings,
    accessLogs as localAccessLogs,
    syncMetadata
} from "../localdb/schema";
import { dblocal } from "../localdb";

export class SyncService {
    private user: User;

    constructor(user: User) {
        this.user = user;
    }
    async syncAll(options: { fullSync?: boolean; tables?: string[] } = {}): Promise<{
        status: 'success' | 'error';
        results?: Record<string, TableSyncResult>;
        message?: string;
        timestamp: string;
    }> {
        try {
            const results: Record<string, TableSyncResult> = {};

            const tablesToSync = options.tables || ['users', 'branch', 'documents', 'settings', 'accessLogs'];

            for (const table of tablesToSync) {
                switch (table) {
                    case 'users':
                        results.users = await this.syncUsers(options.fullSync);
                        break;
                    case 'branch':
                        results.branch = await this.syncBranch(options.fullSync);
                        break;
                    case 'documents':
                        results.documents = await this.syncDocuments(options.fullSync);
                        break;
                    case 'settings':
                        results.settings = await this.syncSettings(options.fullSync);
                        break;
                    case 'accessLogs':
                        results.accessLogs = await this.syncAccessLogs(options.fullSync);
                        break;
                    default:
                        console.warn(`Unknown table to sync: ${table}`);
                        break;
                }
            }

            return {
                status: 'success',
                results,
                timestamp: new Date().toISOString(),
            };
        } catch (err) {
            console.error("Sync error:", err);
            return {
                status: 'error',
                message: err instanceof Error ? err.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };
        }
    }

    private async getLastSync(tableName: string): Promise<{ lastSync: string; lastChangeId?: number }> {
        const now = new Date();
        const result = await dblocal
            .select()
            .from(syncMetadata)
            .where(eq(syncMetadata.tableName, tableName))
            .get();

        const lastSync = result?.lastSync && new Date(result.lastSync) < now
            ? result.lastSync
            : now.toISOString();
        console.log(`[getLastSync] table: ${tableName}, lastSync: ${lastSync}`);
        return {
            lastSync,
            lastChangeId: result?.lastChangeId ?? 0,
        };
    }


    private async updateLastSync(tableName: string, lastChangeId?: number): Promise<void> {
        await dblocal
            .insert(syncMetadata)
            .values({
                tableName,
                lastSync: new Date().toISOString(),
                lastChangeId
            })
            .onConflictDoUpdate({
                target: syncMetadata.tableName,
                set: {
                    lastSync: new Date().toISOString(),
                    lastChangeId
                }
            });
    }

    private async getDeletedIds(table: string, lastSync: string): Promise<number[]> {
        const deleted = await db
            .select()
            .from(serverChangeLog)
            .where(and(
                eq(serverChangeLog.tableName, table),
                eq(serverChangeLog.changeType, 'delete'),
                gt(serverChangeLog.changedAt, new Date(lastSync).toISOString())
            ));

        return deleted.map(d => d.recordId);
    }

    async syncUsers(fullSync = false): Promise<TableSyncResult> {
        const { lastSync } = await this.getLastSync('users');
        const baseConditions = [];

        if (this.user.role === 'branch') {
            baseConditions.push(eq(serverUsers.branch, String(this.user.branch)));
        } else if (this.user.role === 'zonal_head') {
            baseConditions.push(eq(serverUsers.zone, String(this.user.zone)));
        }

        const serverData = await db
            .select()
            .from(serverUsers)
            .where(
                fullSync
                    ? baseConditions.length ? and(...baseConditions) : undefined
                    : and(...baseConditions, gt(serverUsers.updatedAt, new Date(lastSync).toISOString()))
            );

        const deletedIds = await this.getDeletedIds('users', lastSync);
        if (deletedIds.length > 0) {
            await dblocal.delete(localUsers).where(inArray(localUsers.id, deletedIds));
        }

        const localIds = (await dblocal.select({ id: localUsers.id }).from(localUsers).all()).map(row => row.id);
        const toUpsert = serverData.filter(row => !localIds.includes(row.id) || fullSync);

        const added: typeof toUpsert = [];
        const updated: typeof toUpsert = [];

        for (const row of toUpsert) {
            if (localIds.includes(row.id)) updated.push(row);
            else added.push(row);
            await dblocal.insert(localUsers).values(row).onConflictDoUpdate({
                target: localUsers.id,
                set: {
                    email: row.email,
                    role: row.role,
                    zone: row.zone || null,
                    branch: row.branch || null,
                    updatedAt: String(row.updatedAt)
                }
            });
        }

        await this.updateLastSync('users');
        console.log('users synced');

        return {
            table: 'users',
            added: added.length,
            updated: updated.length,
            deleted: deletedIds.length,
            total: serverData.length
        };
    }
    async syncSettings(fullSync = false): Promise<TableSyncResult> {
        const { lastSync } = await this.getLastSync('settings');

        // Fetch server records
        const serverData = await db
            .select()
            .from(serverSettings)
            .where(
                fullSync
                    ? undefined
                    : gt(serverSettings.updatedAt, new Date(lastSync).toISOString())
            );

        // Handle deletions from change log
        const deletedIds = await this.getDeletedIds('settings', lastSync);
        if (deletedIds.length > 0) {
            await dblocal
                .delete(localSettings)
                .where(inArray(localSettings.key, deletedIds.map(String))); // Assuming `key` is string
        }

        // Upsert records
        for (const row of serverData) {
            await dblocal
                .insert(localSettings)
                .values({
                    key: row.key,
                    value: row.value,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                })
                .onConflictDoUpdate({
                    target: localSettings.key,
                    set: {
                        value: row.value,
                        updatedAt: row.updatedAt,
                    },
                });
        }

        await this.updateLastSync('settings');
        console.log('settings synced');
        return {
            table: 'settings',
            added: serverData.length,
            updated: 0,
            deleted: deletedIds.length,
            total: serverData.length,
        };
    }

    async syncAccessLogs(fullSync = false): Promise<TableSyncResult> {
        const { lastSync } = await this.getLastSync('accessLogs');

        // Access condition for documents
        const docAccessCondition =
            this.user.role === 'branch'
                ? eq(serverDocuments.branch, String(this.user.branch))
                : this.user.role === 'zonal_head'
                    ? eq(serverDocuments.zone, String(this.user.zone))
                    : undefined;

        const accessibleDocs = await db
            .select({ id: serverDocuments.id })
            .from(serverDocuments)
            .where(docAccessCondition);

        const docIds = accessibleDocs.map(d => d.id);

        if (docIds.length === 0) {
            console.log('No accessible document IDs for access log sync.');
            return {
                table: 'accessLogs',
                added: 0,
                updated: 0,
                deleted: 0,
                total: 0,
            };
        }

        // Build where condition safely
        const conditions = [inArray(serverAccessLogs.fileId, docIds)];
        if (!fullSync) {
            conditions.push(gt(serverAccessLogs.timestamp, new Date(lastSync).toISOString()));
        }

        const serverData = await db
            .select()
            .from(serverAccessLogs)
            .where(and(...conditions));

        // DO NOT delete any accessLogs even if associated document is deleted

        // Get local IDs
        const localIds = (
            await dblocal.select({ id: localAccessLogs.id }).from(localAccessLogs).all()
        ).map(row => row.id);

        const toUpsert = serverData.filter(row => !localIds.includes(row.id) || fullSync);

        for (const row of toUpsert) {
            await dblocal
                .insert(localAccessLogs)
                .values({
                    id: row.id,
                    userId: row.userId,
                    fileId: row.fileId ?? null, // Optional: if file is deleted, can set this null on server
                    action: row.action,
                    timestamp: row.timestamp,
                })
                .onConflictDoUpdate({
                    target: localAccessLogs.id,
                    set: {
                        userId: row.userId,
                        fileId: row.fileId ?? null,
                        action: row.action,
                        timestamp: row.timestamp,
                    },
                });
        }

        await this.updateLastSync('accessLogs');

        console.log('accessLogs synced');

        return {
            table: 'accessLogs',
            added: toUpsert.length,
            updated: 0,
            deleted: 0, // no deletions
            total: serverData.length,
        };
    }




    async syncDocuments(fullSync = false): Promise<TableSyncResult> {
        const { lastSync } = await this.getLastSync('documents');
        const baseConditions = [];

        if (this.user.role === 'branch') {
            baseConditions.push(eq(serverDocuments.branch, String(this.user.branch)));
        } else if (this.user.role === 'zonal_head') {
            baseConditions.push(eq(serverDocuments.zone, String(this.user.zone)));
        }

        const serverData = await db
            .select()
            .from(serverDocuments)
            .where(
                fullSync
                    ? baseConditions.length ? and(...baseConditions) : undefined
                    : and(...baseConditions, gt(serverDocuments.updatedAt, new Date(lastSync).toISOString()))
            );

        const deletedIds = await this.getDeletedIds('documents', lastSync);
        if (deletedIds.length > 0) {
            await dblocal.delete(localDocuments).where(inArray(localDocuments.id, deletedIds));
        }

        const localIds = (await dblocal.select({ id: localDocuments.id }).from(localDocuments).all()).map(row => row.id);
        const toUpsert = serverData.filter(row => !localIds.includes(row.id) || fullSync);

        for (const row of toUpsert) {
            await dblocal.insert(localDocuments).values(row).onConflictDoUpdate({
                target: localDocuments.id,
                set: {
                    filename: row.filename,
                    originalFilename: row.originalFilename,
                    branch: row.branch,
                    zone: row.zone,
                    year: row.year || null,
                    filetype: row.filetype || null,
                    type: row.type || null,
                    uploadedBy: row.uploadedBy || null,
                    r2Key: row.r2Key,
                    iv: row.iv,
                    tag: row.tag,
                    updatedAt: row.updatedAt
                }
            });
        }

        await this.updateLastSync('documents');
        console.log('documents synced');

        return {
            table: 'documents',
            added: toUpsert.length,
            updated: 0,
            deleted: deletedIds.length,
            total: serverData.length
        };
    }

    async syncBranch(fullSync = false): Promise<TableSyncResult> {
        const { lastSync } = await this.getLastSync('branch');

        const serverData = await db
            .select()
            .from(serverBranch)
            .where(
                fullSync
                    ? undefined
                    : this.user.role === 'zonal_head'
                        ? and(
                            eq(serverBranch.zone, String(this.user.zone)),
                            gt(serverBranch.updatedAt, new Date(lastSync).toISOString())
                        )
                        : gt(serverBranch.updatedAt, new Date(lastSync).toISOString())
            )

        const deletedIds = await this.getDeletedIds('branch', lastSync);
        if (deletedIds.length > 0) {
            await dblocal.delete(localBranch).where(inArray(localBranch.id, deletedIds));
        }

        const localIds = (await dblocal.select({ id: localBranch.id }).from(localBranch).all()).map(row => row.id);
        const toUpsert = serverData.filter(row => !localIds.includes(row.id) || fullSync);

        for (const row of toUpsert) {
            await dblocal.insert(localBranch).values(row).onConflictDoUpdate({
                target: localBranch.id,
                set: {
                    name: row.name,
                    zone: row.zone,
                    updatedAt: row.updatedAt
                }
            });
        }

        await this.updateLastSync('branch');
        console.log('branch synced');

        return {
            table: 'branch',
            added: toUpsert.length,
            updated: 0,
            deleted: deletedIds.length,
            total: serverData.length
        };
    }
}

interface User {
    email: string;
    role: string;
    branch?: string;
    zone?: string;
}

interface TableSyncResult {
    table: string;
    added: number;
    updated: number;
    deleted: number;
    total: number;
}
