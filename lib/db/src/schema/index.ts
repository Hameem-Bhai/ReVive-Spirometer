import { pgTable, serial, text, integer, doublePrecision, timestamp, jsonb } from "drizzle-orm/pg-core";

// 1. Users Table
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  age: integer("age"),
  sex: text("sex"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;

// 2. Spirometry Test Sessions Table
export const testsTable = pgTable("tests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  overallStatus: text("overall_status").notNull(), // 'green' | 'yellow' | 'red'
  summary: text("summary").notNull(),
  recommendations: jsonb("recommendations").$type<string[]>().notNull(),
  disclaimer: text("disclaimer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Test = typeof testsTable.$inferSelect;
export type InsertTest = typeof testsTable.$inferInsert;

// 3. Exhalation Test Rounds Table (saving raw pressure arrays)
export const roundsTable = pgTable("rounds", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").references(() => testsTable.id, { onDelete: "cascade" }).notNull(),
  roundNumber: integer("round_number").notNull(),
  peakPressure: doublePrecision("peak_pressure").notNull(),
  avgPressure: doublePrecision("avg_pressure").notNull(),
  minPressure: doublePrecision("min_pressure").notNull(),
  maxPressure: doublePrecision("max_pressure").notNull(),
  durationSeconds: doublePrecision("duration_seconds").notNull(),
  rawReadings: jsonb("raw_readings").$type<number[]>().notNull(),
});

export type Round = typeof roundsTable.$inferSelect;
export type InsertRound = typeof roundsTable.$inferInsert;