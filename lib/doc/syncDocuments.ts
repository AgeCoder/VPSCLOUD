
// sync.service.ts
import { eq, and, gt, inArray, or } from "drizzle-orm";
import { db } from "../db";
import {
    users as serverUsers,
    documents as serverDocuments,
    branch as serverBranch,
    changeLog as serverChangeLog,
    settings as serverSettings,
    accessLogs as serverAccessLogs,
    doctype as serverDoctype,
} from "../db/schema";
import {
    users as localUsers,
    documents as localDocuments,
    branch as localBranch,
    settings as localSettings,
    accessLogs as localAccessLogs,
    doctype as localDoctype,
    syncMetadata
} from "../localdb/schema";
import { dblocal } from "../localdb";

export class SyncService {
    private user: User;
    private logger = {
        info: (msg: string, meta?: object) => console.log(JSON.stringify({ msg, ...meta })),
        error: (msg: string, err?: Error) => console.error(JSON.stringify({
            msg,
            error: err?.message,
            stack: err?.stack
        }))
    };
    private syncLocks: Map<string, Promise<any>> = new Map();

    constructor(user: User) {
        this.user = user;
    }

    async syncAll(options: { fullSync?: boolean; tables?: string[] } = {}): Promise<{
        status: 'success' | 'partial' | 'error';
        results?: Record<string, TableSyncResult>;
        message?: string;
        timestamp: string;
    }> {
        const lockKey = `${this.user.email}-sync`;
        if (this.syncLocks.has(lockKey)) {
            return {
                status: 'error',
                message: 'Sync already in progress',
                timestamp: new Date().toISOString()
            };
        }

        const syncPromise = this._syncAll(options).finally(() => {
            this.syncLocks.delete(lockKey);
        });

        this.syncLocks.set(lockKey, syncPromise);
        return syncPromise;
    }

    private async _syncAll(options: { fullSync?: boolean; tables?: string[] } = {}): Promise<{
        status: 'success' | 'partial' | 'error';
        results?: Record<string, TableSyncResult>;
        message?: string;
        timestamp: string;
    }> {
        try {
            const results: Record<string, TableSyncResult> = {};
            let hasErrors = false;

            // Check if this is the first sync (no metadata exists)
            const hasMetadata = (await dblocal.select().from(syncMetadata).limit(1).all()).length > 0;
            const forceFullSync = !hasMetadata || options.fullSync;
            console.log(
                `${hasMetadata} Syncing all tables. Full sync: ${forceFullSync}. Tables: ${options.tables?.join(', ') || 'all'}`
            );

            const tablesToSync = options.tables || ['users', 'branch', 'documents', 'settings', 'accessLogs', 'doctype'];

            for (const table of tablesToSync) {
                try {
                    switch (table) {
                        case 'users':
                            results.users = await this.syncUsers(forceFullSync);
                            break;
                        case 'branch':
                            results.branch = await this.syncBranch(forceFullSync);
                            break;
                        case 'documents':
                            results.documents = await this.syncDocuments(forceFullSync);
                            break;
                        case 'settings':
                            results.settings = await this.syncSettings(forceFullSync);
                            break;
                        case 'accessLogs':
                            results.accessLogs = await this.syncAccessLogs(forceFullSync);
                            break;
                        case 'doctype':
                            results.doctype = await this.syncDocType(forceFullSync);
                            break;
                        default:
                            this.logger.error(`Unknown table to sync: ${table}`);
                            break;
                    }
                } catch (err) {
                    hasErrors = true;
                    results[table] = {
                        table: '',
                        added: 0,
                        updated: 0,
                        deleted: 0,
                        total: 0,
                        status: 'error',
                        message: err instanceof Error ? err.message : 'Unknown error',
                    };
                    this.logger.error(`Sync failed for table ${table}`, err as Error);
                }
            }

            return {
                status: hasErrors ? 'partial' : 'success',
                results,
                timestamp: new Date().toISOString(),
            };
        } catch (err) {
            this.logger.error("Sync error:", err as Error);
            return {
                status: 'error',
                message: err instanceof Error ? err.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };
        }
    }

    async syncDocType(fullSync = false): Promise<TableSyncResult> {
        try {
            const { lastSync, lastChangeId } = await this.getLastSync('doctype');

            const serverData = await db
                .select()
                .from(serverDoctype)
                .where(
                    fullSync
                        ? undefined
                        : gt(serverDoctype.updatedAt, new Date(lastSync).toISOString())
                );

            const deletedIds = await this.getDeletedIds('doctype', lastSync, Number(lastChangeId));
            if (deletedIds.length > 0) {
                await this.batchDelete(localDoctype, deletedIds);
            }

            const localIds = (await dblocal.select({ id: localDoctype.id }).from(localDoctype).all()).map(row => row.id);
            const toUpsert = serverData.filter(row => !localIds.includes(row.id) || fullSync);

            let added = 0;
            let updated = 0;

            for (const row of toUpsert) {
                if (localIds.includes(row.id)) {
                    updated++;
                } else {
                    added++;
                }

                await dblocal.insert(localDoctype).values(row).onConflictDoUpdate({
                    target: localDoctype.id,
                    set: {
                        type: row.type,
                        updatedAt: row.updatedAt
                    }
                });
            }

            const highestChangeId = serverData.reduce((max, row) => Math.max(Number(max), row.id), lastChangeId);
            await this.updateLastSync('doctype', highestChangeId);

            this.logger.info('DocType sync completed', { added, updated, deleted: deletedIds.length });

            return {
                table: 'doctype',
                added,
                updated,
                deleted: deletedIds.length,
                total: serverData.length
            };
        } catch (err) {
            this.logger.error('Failed to sync doctype', err as Error);
            throw err;
        }
    }

    private async getLastSync(tableName: string): Promise<{ lastSync: string; lastChangeId?: number }> {
        const result = await dblocal
            .select()
            .from(syncMetadata)
            .where(eq(syncMetadata.tableName, tableName))
            .get();

        // If no sync metadata exists, return a very old date to force full sync
        if (!result) {
            return {
                lastSync: '1970-01-01T00:00:00.000Z', // Very old date
                lastChangeId: 0
            };
        }

        return {
            lastSync: result.lastSync,
            lastChangeId: result.lastChangeId ?? 0
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

    private async getDeletedIds(table: string, lastSync: string, lastChangeId: number): Promise<number[]> {
        const deleted = await db
            .select()
            .from(serverChangeLog)
            .where(and(
                eq(serverChangeLog.tableName, table),
                eq(serverChangeLog.changeType, 'delete'),
                or(
                    gt(serverChangeLog.changedAt, new Date(lastSync).toISOString()),
                    gt(serverChangeLog.id, lastChangeId)
                )
            ))

        return deleted.map(d => d.recordId);
    }

    private async batchDelete(table: any, ids: number[], batchSize = 500): Promise<void> {
        for (let i = 0; i < ids.length; i += batchSize) {
            const chunk = ids.slice(i, i + batchSize);
            await dblocal.delete(table).where(inArray(table.id, chunk));
        }
    }

    async syncUsers(fullSync = false): Promise<TableSyncResult> {
        try {
            const { lastSync, lastChangeId } = await this.getLastSync('users');
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

            const deletedIds = await this.getDeletedIds('users', lastSync, Number(lastChangeId));
            if (deletedIds.length > 0) {
                await this.batchDelete(localUsers, deletedIds);
            }

            const localIds = (await dblocal.select({ id: localUsers.id }).from(localUsers).all()).map(row => row.id);
            const toUpsert = serverData.filter(row => !localIds.includes(row.id) || fullSync);

            let added = 0;
            let updated = 0;

            for (const row of toUpsert) {
                if (localIds.includes(row.id)) {
                    updated++;
                } else {
                    added++;
                }

                await dblocal.insert(localUsers).values(row).onConflictDoUpdate({
                    target: localUsers.id,
                    set: {
                        email: row.email,
                        role: row.role,
                        zone: row.zone || null,
                        branch: row.branch || null,
                        canUpload: row.canUpload,
                        updatedAt: row.updatedAt
                    }
                });
            }

            const highestChangeId = serverData.reduce((max, row) => Math.max(Number(max), row.id), lastChangeId);
            await this.updateLastSync('users', highestChangeId);

            this.logger.info('Users sync completed', { added, updated, deleted: deletedIds.length });

            return {
                table: 'users',
                added,
                updated,
                deleted: deletedIds.length,
                total: serverData.length
            };
        } catch (err) {
            this.logger.error('Failed to sync users', err as Error);
            throw err;
        }
    }

    async syncDocuments(fullSync = false): Promise<TableSyncResult> {
        try {
            const { lastSync, lastChangeId } = await this.getLastSync('documents');
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

            const deletedIds = await this.getDeletedIds('documents', lastSync, Number(lastChangeId));
            if (deletedIds.length > 0) {
                await this.batchDelete(localDocuments, deletedIds);
            }

            const localIds = (await dblocal.select({ id: localDocuments.id }).from(localDocuments).all()).map(row => row.id);
            const toUpsert = serverData.filter(row => !localIds.includes(row.id) || fullSync);

            let added = 0;
            let updated = 0;

            for (const row of toUpsert) {
                if (localIds.includes(row.id)) {
                    updated++;
                } else {
                    added++;
                }

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

            const highestChangeId = serverData.reduce((max, row) => Math.max(Number(max), row.id), lastChangeId);
            await this.updateLastSync('documents', highestChangeId);

            this.logger.info('Documents sync completed', { added, updated, deleted: deletedIds.length });

            return {
                table: 'documents',
                added,
                updated,
                deleted: deletedIds.length,
                total: serverData.length
            };
        } catch (err) {
            this.logger.error('Failed to sync documents', err as Error);
            throw err;
        }
    }

    async syncBranch(fullSync = false): Promise<TableSyncResult> {
        try {
            const { lastSync, lastChangeId } = await this.getLastSync('branch');

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
                );

            const deletedIds = await this.getDeletedIds('branch', lastSync, Number(lastChangeId));
            if (deletedIds.length > 0) {
                await this.batchDelete(localBranch, deletedIds);
            }

            const localIds = (await dblocal.select({ id: localBranch.id }).from(localBranch).all()).map(row => row.id);
            const toUpsert = serverData.filter(row => !localIds.includes(row.id) || fullSync);

            let added = 0;
            let updated = 0;

            for (const row of toUpsert) {
                if (localIds.includes(row.id)) {
                    updated++;
                } else {
                    added++;
                }

                await dblocal.insert(localBranch).values(row).onConflictDoUpdate({
                    target: localBranch.id,
                    set: {
                        name: row.name,
                        zone: row.zone,
                        updatedAt: row.updatedAt
                    }
                });
            }

            const highestChangeId = serverData.reduce((max, row) => Math.max(Number(max), row.id), lastChangeId);
            await this.updateLastSync('branch', highestChangeId);

            this.logger.info('Branch sync completed', { added, updated, deleted: deletedIds.length });

            return {
                table: 'branch',
                added,
                updated,
                deleted: deletedIds.length,
                total: serverData.length
            };
        } catch (err) {
            this.logger.error('Failed to sync branch', err as Error);
            throw err;
        }
    }

    async syncSettings(fullSync = false): Promise<TableSyncResult> {
        try {
            const { lastSync, lastChangeId } = await this.getLastSync('settings');

            const serverData = await db
                .select()
                .from(serverSettings)
                .where(
                    fullSync
                        ? undefined
                        : gt(serverSettings.updatedAt, new Date(lastSync).toISOString())
                );

            const deletedIds = await this.getDeletedIds('settings', lastSync, Number(lastChangeId));
            if (deletedIds.length > 0) {
                await this.batchDelete(localSettings, deletedIds.map(id => id));
            }

            let added = 0;
            let updated = 0;

            for (const row of serverData) {
                const exists = await dblocal
                    .select()
                    .from(localSettings)
                    .where(eq(localSettings.id, row.id))
                    .get();

                if (exists) {
                    updated++;
                } else {
                    added++;
                }

                await dblocal
                    .insert(localSettings)
                    .values({
                        id: row.id,
                        key: row.key,
                        value: row.value,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt,
                    })
                    .onConflictDoUpdate({
                        target: localSettings.id,
                        set: {
                            key: row.key,
                            value: row.value,
                            updatedAt: row.updatedAt,
                        },
                    });
            }

            const highestChangeId = serverData.reduce((max, row) => Math.max(Number(max), row.id), lastChangeId);
            await this.updateLastSync('settings', highestChangeId);

            this.logger.info('Settings sync completed', { added, updated, deleted: deletedIds.length });

            return {
                table: 'settings',
                added,
                updated,
                deleted: deletedIds.length,
                total: serverData.length,
            };
        } catch (err) {
            this.logger.error('Failed to sync settings', err as Error);
            throw err;
        }
    }

    async syncAccessLogs(fullSync = false): Promise<TableSyncResult> {
        try {
            const { lastSync } = await this.getLastSync('accessLogs');

            // Get accessible document IDs
            const docAccessCondition = this.user.role === 'branch'
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
                this.logger.info('No accessible documents for access logs sync');
                return {
                    table: 'accessLogs',
                    added: 0,
                    updated: 0,
                    deleted: 0,
                    total: 0,
                };
            }

            // Build conditions
            const conditions = [inArray(serverAccessLogs.fileId, docIds)];
            if (!fullSync) {
                conditions.push(gt(serverAccessLogs.timestamp, new Date(lastSync).toISOString()));
            }

            const serverData = await db
                .select()
                .from(serverAccessLogs)
                .where(and(...conditions));

            // Get local IDs
            const localIds = (
                await dblocal.select({ id: localAccessLogs.id }).from(localAccessLogs).all()
            ).map(row => row.id);

            const toUpsert = serverData.filter(row => !localIds.includes(row.id) || fullSync);

            let added = 0;
            for (const row of toUpsert) {
                added++;
                await dblocal
                    .insert(localAccessLogs)
                    .values({
                        id: row.id,
                        userId: row.userId,
                        fileId: row.fileId ?? null,
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

            this.logger.info('Access logs sync completed', { added, total: serverData.length });

            return {
                table: 'accessLogs',
                added,
                updated: 0,
                deleted: 0,
                total: serverData.length,
            };
        } catch (err) {
            this.logger.error('Failed to sync access logs', err as Error);
            throw err;
        }
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
    status?: 'success' | 'error';
    message?: string;
}