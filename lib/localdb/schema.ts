// localdb/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"

export const roleEnumValues = ["branch", "zonal_head", "admin"] as const
export const actionEnumValues = ["view", "download", "upload", "delete"] as const
export const changeTypeEnumValues = ["insert", "update", "delete"] as const

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: roleEnumValues }).notNull().default("branch"),
  zone: text("zone"),
  branch: text("branch"),
  canUpload: integer("can_upload", { mode: 'boolean' }).default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(), // Added for better sync tracking
})

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  branch: text("branch").notNull(),
  zone: text("zone").notNull(),
  year: text('year'),
  filetype: text('filetype'),
  type: text('type'),
  uploadedBy: text("uploaded_by"),
  r2Key: text("r2_key").notNull(),
  iv: text("iv").notNull(),
  tag: text("tag").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

export const accessLogs = sqliteTable("access_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  fileId: text("file_id").notNull(),
  action: text("action", { enum: actionEnumValues }).notNull(),
  timestamp: text("timestamp").notNull(),
})

export const changeLog = sqliteTable("change_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentId: text("document_id").notNull(),
  changeType: text("change_type", { enum: changeTypeEnumValues }).notNull(),
  changedAt: text("changed_at").notNull(),
})

export const verificationTokens = sqliteTable("verification_tokens", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull(),
  expires: text("expires").notNull(),
  createdAt: text("created_at").notNull(),
})

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

export const branch = sqliteTable('branch', {
  id: integer("id").primaryKey(), // Changed to match main DB
  name: text('name').notNull().unique(),
  zone: text('zone').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// Enhanced sync metadata table
export const syncMetadata = sqliteTable("sync_metadata", {
  tableName: text("table_name").primaryKey(),
  lastSync: text("last_sync").notNull(),
  lastChangeId: integer("last_change_id"), // For tracking change_log increments
})

// Relations remain the same as in your original schema

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  accessLogs: many(accessLogs),
}))

export const documentsRelations = relations(documents, ({ many }) => ({
  accessLogs: many(accessLogs),
  changeLogs: many(changeLog),
}))

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  user: one(users, {
    fields: [accessLogs.userId],
    references: [users.id],
  }),
  file: one(documents, {
    fields: [accessLogs.fileId],
    references: [documents.id],
  }),
}))

export const changeLogRelations = relations(changeLog, ({ one }) => ({
  document: one(documents, {
    fields: [changeLog.documentId],
    references: [documents.id],
  }),
}))

