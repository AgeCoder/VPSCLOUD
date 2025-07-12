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
  createdAt: text("created_at").notNull(),
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

export const syncMetadata = sqliteTable("sync_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
})

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

// make a tabel for settings
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

// branchs

export const branch = sqliteTable('branch', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  zone: text('zone').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})