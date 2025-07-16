// sync.service.ts
import { eq, and, gt, inArray, notInArray, lte, isNull } from "drizzle-orm";
import { db } from "./db";
import {
    users as serverUsers,
    documents as serverDocuments,
    accessLogs as serverAccessLogs,
    changeLog as serverChangeLog,
    verificationTokens as serverVerificationTokens,
    settings as serverSettings,
    branch as serverBranch
} from "./db/schema";
import {
    users as localUsers,
    documents as localDocuments,
    accessLogs as localAccessLogs,
    changeLog as localChangeLog,
    verificationTokens as localVerificationTokens,
    settings as localSettings,
    branch as localBranch,
    syncMetadata
} from "./localdb/schema";
import { dblocal } from "./localdb";

type User = {
    email: string
    role: string
    branch?: string
    zone?: string
}

type SyncOptions = {
    fullSync?: boolean;
    tables?: string[];
};

export class SyncService {
    private user: User;

    constructor(user: User) {
        this.user = user;
    }

    async syncAll(options: SyncOptions = {}): Promise<SyncResult> {
        try {
            const results: Record<string, TableSyncResult> = {};

            // Determine which tables to sync
            const tablesToSync = options.tables || [
                'users', 'documents', 'accessLogs', 'changeLog',
                'verificationTokens', 'settings', 'branch'
            ];

            // Sync each table
            for (const table of tablesToSync) {
                switch (table) {
                    case 'users':
                        results.users = await this.syncUsers(options.fullSync);
                        break;
                    case 'documents':
                        results.documents = await this.syncDocuments(options.fullSync);
                        break;
                    case 'accessLogs':
                        results.accessLogs = await this.syncAccessLogs(options.fullSync);
                        break;
                    case 'changeLog':
                        results.changeLog = await this.syncChangeLog(options.fullSync);
                        break;
                    case 'verificationTokens':
                        results.verificationTokens = await this.syncVerificationTokens(options.fullSync);
                        break;
                    case 'settings':
                        results.settings = await this.syncSettings(options.fullSync);
                        break;
                    case 'branch':
                        results.branch = await this.syncBranch(options.fullSync);
                        break;
                }
            }

            return {
                status: 'success',
                results,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Sync error:', error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : 'Sync failed',
                timestamp: new Date().toISOString()
            };
        }
    }

    private async getLastSync(tableName: string): Promise<{ lastSync: string; lastChangeId?: number }> {
        const result = await dblocal
            .select()
            .from(syncMetadata)
            .where(eq(syncMetadata.tableName, tableName))
            .get();

        return {
            lastSync: result?.lastSync || new Date().toISOString(),
            lastChangeId: result?.lastChangeId ?? 0
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

    private async syncUsers(fullSync = false): Promise<TableSyncResult> {
        const { lastSync } = await this.getLastSync('users');
        const baseConditions = [];

        // Role-based filtering
        if (this.user.role === 'branch') {
            baseConditions.push(eq(serverUsers.branch, String(this.user.branch)));
        } else if (this.user.role === 'zonal_head') {
            baseConditions.push(eq(serverUsers.zone, String(this.user.zone)));
        }

        // Get server data
        const serverData = await db
            .select()
            .from(serverUsers)
            .where(
                fullSync
                    ? baseConditions.length ? and(...baseConditions) : undefined
                    : and(...baseConditions, gt(serverUsers.updatedAt, new Date(lastSync).toISOString()))
            );

        // Get local IDs for comparison
        const localIds = (await dblocal.select({ id: localUsers.id }).from(localUsers).all())
            .map(row => row.id);

        const serverIds = serverData.map(row => row.id);

        // Identify records to delete (exist locally but not on server)
        const toDelete = localIds.filter(id => !serverIds.includes(id));
        if (toDelete.length > 0) {
            await dblocal
                .delete(localUsers)
                .where(inArray(localUsers.id, toDelete));
        }

        // Process upserts
        const toUpsert = serverData.filter(row =>
            !localIds.includes(row.id) ||
            fullSync // Always upsert in full sync mode
        );

        for (const row of toUpsert) {
            await dblocal
                .insert(localUsers)
                .values({
                    id: row.id,
                    email: row.email,
                    role: row.role,
                    zone: row.zone || null,
                    branch: row.branch || null,
                    createdAt: row.createdAt,
                    updatedAt: String(row.updatedAt)
                })
                .onConflictDoUpdate({
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

        return {
            table: 'users',
            added: toUpsert.length,
            updated: 0, // We don't track updates separately in this simple approach
            deleted: toDelete.length,
            total: serverData.length
        };
    }

    private async syncDocuments(fullSync = false): Promise<TableSyncResult> {
        const { lastSync } = await this.getLastSync('documents');
        const baseConditions = [];

        // Role-based filtering
        if (this.user.role === 'branch') {
            baseConditions.push(eq(serverDocuments.branch, String(this.user.branch)));
        } else if (this.user.role === 'zonal_head') {
            baseConditions.push(eq(serverDocuments.zone, String(this.user.zone)));
        }

        // Get server data
        const serverData = await db
            .select()
            .from(serverDocuments)
            .where(
                fullSync
                    ? baseConditions.length ? and(...baseConditions) : undefined
                    : and(...baseConditions, gt(serverDocuments.updatedAt, new Date(lastSync).toISOString()))
            );

        // Get local IDs for comparison
        const localIds = (await dblocal.select({ id: localDocuments.id }).from(localDocuments).all())
            .map(row => row.id);

        const serverIds = serverData.map(row => row.id);

        // Identify records to delete
        const toDelete = localIds.filter(id => !serverIds.includes(id));
        if (toDelete.length > 0) {
            await dblocal
                .delete(localDocuments)
                .where(inArray(localDocuments.id, toDelete));
        }

        // Process upserts
        const toUpsert = serverData.filter(row =>
            !localIds.includes(row.id) ||
            fullSync // Always upsert in full sync mode
        );

        for (const row of toUpsert) {
            await dblocal
                .insert(localDocuments)
                .values({
                    id: row.id,
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
                    uploadedAt: row.uploadedAt,
                    updatedAt: row.updatedAt
                })
                .onConflictDoUpdate({
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

        return {
            table: 'documents',
            added: toUpsert.length,
            updated: 0,
            deleted: toDelete.length,
            total: serverData.length
        };
    }

    private async syncAccessLogs(fullSync = false): Promise<TableSyncResult> {
        const { lastSync } = await this.getLastSync('accessLogs');

        // For access logs, we'll sync only logs related to documents the user has access to
        const accessibleDocs = await db
            .select({ id: serverDocuments.id })
            .from(serverDocuments)
            .where(
                this.user.role === 'branch'
                    ? eq(serverDocuments.branch, String(this.user.branch))
                    : this.user.role === 'zonal_head'
                        ? eq(serverDocuments.zone, String(this.user.zone))
                        : undefined
            );

        const docIds = accessibleDocs.map(d => d.id);

        // Get server data
        const serverData = await db
            .select()
            .from(serverAccessLogs)
            .where(
                and(
                    inArray(serverAccessLogs.fileId, accessibleDocs.map(d => d.id)),
                    fullSync ? undefined : gt(serverAccessLogs.timestamp, new Date(lastSync).toISOString())
                ))

        // Get local IDs for comparison
        const localIds = (await dblocal.select({ id: localAccessLogs.id }).from(localAccessLogs).all())
            .map(row => row.id);

        const serverIds = serverData.map(row => row.id);

        // Identify records to delete
        const toDelete = localIds.filter(id => !serverIds.includes(id));
        if (toDelete.length > 0) {
            await dblocal
                .delete(localAccessLogs)
                .where(inArray(localAccessLogs.id, toDelete));
        }

        // Process upserts
        const toUpsert = serverData.filter(row =>
            !localIds.includes(row.id) ||
            fullSync
        );

        for (const row of toUpsert) {
            await dblocal
                .insert(localAccessLogs)
                .values({
                    id: row.id,
                    userId: row.userId,
                    fileId: row.fileId,
                    action: row.action,
                    timestamp: row.timestamp
                })
                .onConflictDoUpdate({
                    target: localAccessLogs.id,
                    set: {
                        userId: row.userId,
                        fileId: row.fileId,
                        action: row.action,
                        timestamp: row.timestamp
                    }
                });
        }

        await this.updateLastSync('accessLogs');

        return {
            table: 'accessLogs',
            added: toUpsert.length,
            updated: 0,
            deleted: toDelete.length,
            total: serverData.length
        };
    }

    private async syncChangeLog(fullSync = false): Promise<TableSyncResult> {
        const { lastSync, lastChangeId } = await this.getLastSync('changeLog');

        // Get accessible document IDs
        const accessibleDocs = await db
            .select({ id: serverDocuments.id })
            .from(serverDocuments)
            .where(
                this.user.role === 'branch'
                    ? eq(serverDocuments.branch, String(this.user.branch))
                    : this.user.role === 'zonal_head'
                        ? eq(serverDocuments.zone, String(this.user.zone))
                        : undefined
            );

        // Get server data
        const serverData = await db
            .select()
            .from(serverChangeLog)
            .where(
                and(
                    inArray(serverChangeLog.documentId, accessibleDocs.map(d => d.id)),
                    fullSync
                        ? undefined
                        : lastChangeId
                            ? gt(serverChangeLog.id, lastChangeId)
                            : gt(serverChangeLog.changedAt, new Date(lastSync).toISOString())
                )
            );

        // Process inserts (change log is append-only, no updates or deletes)
        for (const row of serverData) {
            await dblocal
                .insert(localChangeLog)
                .values({
                    id: row.id,
                    documentId: row.documentId,
                    changeType: row.changeType,
                    changedAt: row.changedAt
                })
                .onConflictDoNothing();
        }

        // Update last sync with the highest change log ID
        const maxId = serverData.reduce((max, row) => Math.max(max, row.id), lastChangeId || 0);
        await this.updateLastSync('changeLog', maxId);

        return {
            table: 'changeLog',
            added: serverData.length,
            updated: 0,
            deleted: 0,
            total: serverData.length
        };
    }

    private async syncVerificationTokens(fullSync = false): Promise<TableSyncResult> {
        const { lastSync } = await this.getLastSync('verificationTokens');

        // Verification tokens are only needed for the current user
        const serverData = await db
            .select()
            .from(serverVerificationTokens)
            .where(
                and(
                    eq(serverVerificationTokens.email, this.user.email),
                    fullSync ? undefined : gt(serverVerificationTokens.createdAt, new Date(lastSync).toISOString())
                )
            );

        // Get local IDs for comparison
        const localIds = (await dblocal.select({ id: localVerificationTokens.id }).from(localVerificationTokens).all())
            .map(row => row.id);

        const serverIds = serverData.map(row => row.id);

        // Identify records to delete
        const toDelete = localIds.filter(id => !serverIds.includes(id));
        if (toDelete.length > 0) {
            await dblocal
                .delete(localVerificationTokens)
                .where(inArray(localVerificationTokens.id, toDelete));
        }

        // Process upserts
        const toUpsert = serverData.filter(row =>
            !localIds.includes(row.id) ||
            fullSync
        );

        for (const row of toUpsert) {
            await dblocal
                .insert(localVerificationTokens)
                .values({
                    id: row.id,
                    email: row.email,
                    token: row.token,
                    expires: row.expires,
                    createdAt: row.createdAt
                })
                .onConflictDoUpdate({
                    target: localVerificationTokens.id,
                    set: {
                        email: row.email,
                        token: row.token,
                        expires: row.expires,
                        createdAt: row.createdAt
                    }
                });
        }

        await this.updateLastSync('verificationTokens');

        return {
            table: 'verificationTokens',
            added: toUpsert.length,
            updated: 0,
            deleted: toDelete.length,
            total: serverData.length
        };
    }

    private async syncSettings(fullSync = false): Promise<TableSyncResult> {
        const { lastSync } = await this.getLastSync('settings');

        // Get server data
        const serverData = await db
            .select()
            .from(serverSettings)
            .where(
                fullSync ? undefined : gt(serverSettings.updatedAt, new Date(lastSync).toISOString())
            );

        // Process upserts (settings don't need to be deleted)
        for (const row of serverData) {
            await dblocal
                .insert(localSettings)
                .values({
                    key: row.key,
                    value: row.value,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt
                })
                .onConflictDoUpdate({
                    target: localSettings.key,
                    set: {
                        value: row.value,
                        updatedAt: row.updatedAt
                    }
                });
        }

        await this.updateLastSync('settings');

        return {
            table: 'settings',
            added: serverData.length,
            updated: 0,
            deleted: 0,
            total: serverData.length
        };
    }

    private async syncBranch(fullSync = false): Promise<TableSyncResult> {
        const { lastSync } = await this.getLastSync('branch');

        // Get server data
        const serverData = await db
            .select()
            .from(serverBranch)
            .where(
                fullSync
                    ? undefined
                    : this.user.role === 'zonal_head'
                        ?
                        eq(serverBranch.zone, String(this.user.zone))
                        : gt(serverBranch.updatedAt, new Date(lastSync).toISOString())
            );

        // Get local IDs for comparison
        const localIds = (await dblocal.select({ id: localBranch.id }).from(localBranch).all())
            .map(row => row.id);

        const serverIds = serverData.map(row => row.id);

        // Identify records to delete
        const toDelete = localIds.filter(id => !serverIds.includes(id));
        if (toDelete.length > 0) {
            await dblocal
                .delete(localBranch)
                .where(inArray(localBranch.id, toDelete));
        }

        // Process upserts
        const toUpsert = serverData.filter(row =>
            !localIds.includes(row.id) ||
            fullSync
        );

        for (const row of toUpsert) {
            await dblocal
                .insert(localBranch)
                .values({
                    id: row.id,
                    name: row.name,
                    zone: row.zone,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt
                })
                .onConflictDoUpdate({
                    target: localBranch.id,
                    set: {
                        name: row.name,
                        zone: row.zone,
                        updatedAt: row.updatedAt
                    }
                });
        }

        await this.updateLastSync('branch');

        return {
            table: 'branch',
            added: toUpsert.length,
            updated: 0,
            deleted: toDelete.length,
            total: serverData.length
        };
    }
}

// Types
interface TableSyncResult {
    table: string;
    added: number;
    updated: number;
    deleted: number;
    total: number;
}

interface SyncResult {
    status: 'success' | 'error';
    results?: Record<string, TableSyncResult>;
    message?: string;
    timestamp: string;
}