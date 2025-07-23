import { sqliteTable, text, integer, } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"

export const roleEnum = ["branch", "zonal_head", "admin"] as const
export const actionEnum = ["view", "download", "upload", "delete"] as const
export const changeTypeEnum = ["insert", "update", "delete"] as const

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  role: text("role", { enum: roleEnum }).notNull().default("branch"),
  zone: text("zone"),
  branch: text("branch"),
  canUpload: integer("can_upload", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
})

// DOCUMENTS
export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  branch: text("branch").notNull(),
  zone: text("zone").notNull(),
  year: text("year"),
  filetype: text("filetype"),
  type: text("type"),
  uploadedBy: integer("uploaded_by").references(() => users.id, {
    onDelete: "set null",
  }),
  r2Key: text("r2_key").notNull(),
  iv: text("iv").notNull(),
  tag: text("tag").notNull(),
  uploadedAt: text("uploaded_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
})

// ACCESS LOGS
export const accessLogs = sqliteTable("access_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  fileId: integer("file_id")
    .references(() => documents.id, { onDelete: "set null" }),
  action: text("action", { enum: actionEnum }).notNull(),
  timestamp: text("timestamp").default("CURRENT_TIMESTAMP").notNull(),
});


// CHANGE LOG
export const changeLog = sqliteTable("change_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableName: text("table_name").notNull(),
  recordId: integer("record_id").notNull(),
  changeType: text("change_type", { enum: changeTypeEnum }).notNull(),
  changedAt: text("changed_at").default("CURRENT_TIMESTAMP").notNull(),
  changedBy: integer("changed_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

export const loginSessions = sqliteTable("login_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  loginAt: text("login_at").default("CURRENT_TIMESTAMP").notNull(),
})


// RELATIONS
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



// VERIFICATION TOKENS
export const verificationTokens = sqliteTable("verification_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  token: text("token").notNull(),
  expires: text("expires").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
})

// SETTINGS TABLE
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
})

// BRANCH TABLE
export const branch = sqliteTable("branch", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  zone: text("zone").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
})

export const doctype = sqliteTable('doctype', {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text('type').notNull().unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})