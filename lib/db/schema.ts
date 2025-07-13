import { pgTable, text, timestamp, uuid, pgEnum, serial, boolean } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const roleEnum = pgEnum("role", ["branch", "zonal_head", "admin"])
export const actionEnum = pgEnum("action", ["view", "download", "upload", "delete"])
export const changeTypeEnum = pgEnum("change_type", ["insert", "update", "delete"])

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull().default("branch"),
  zone: text("zone"),
  branch: text("branch"),
  canUpload: boolean("can_upload").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  branch: text("branch").notNull(),
  zone: text("zone").notNull(),
  year: text('year'),
  filetype: text('filetype'),
  type: text('type'),
  uploadedBy: uuid("uploaded_by")
    .references(() => users.id, { onDelete: "set null" })
    .default(null),
  r2Key: text("r2_key").notNull(),
  iv: text("iv").notNull(),
  tag: text("tag").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const accessLogs = pgTable("access_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  fileId: uuid("file_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  action: actionEnum("action").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
})

export const changeLog = pgTable("change_log", {
  id: serial("id").primaryKey(),
  documentId: uuid("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  changeType: changeTypeEnum("change_type").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  accessLogs: many(accessLogs),
}))

export const documentsRelations = relations(documents, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
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

export const verificationTokens = pgTable("verification_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// make a tabel for settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})


export const branch = pgTable("branch", {
  id: serial("id").primaryKey(),
  name: text('name').notNull().unique(),
  zone: text('zone').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
