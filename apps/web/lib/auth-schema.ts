import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const authUsers = sqliteTable("user", {
	email: text("email").notNull(),
	id: text("id").primaryKey(),
	name: text("name").notNull(),
});
