import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const isolationPoints = pgTable("isolation_points", {
  id: serial("id").primaryKey(),
  kks: text("kks").notNull().unique(),
  unit: text("unit").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // Electrical, Mechanical, Hydraulic, Pneumatic
  panelKks: text("panel_kks"),
  loadKks: text("load_kks"),
  isolationMethod: text("isolation_method").notNull(),
  normalPosition: text("normal_position").notNull(),
  isolationPosition: text("isolation_position"),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedLists = pgTable("saved_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isolationPointIds: jsonb("isolation_point_ids").$type<number[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIsolationPointSchema = createInsertSchema(isolationPoints).omit({
  id: true,
  createdAt: true,
});

export const insertSavedListSchema = createInsertSchema(savedLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIsolationPoint = z.infer<typeof insertIsolationPointSchema>;
export type IsolationPoint = typeof isolationPoints.$inferSelect;
export type InsertSavedList = z.infer<typeof insertSavedListSchema>;
export type SavedList = typeof savedLists.$inferSelect;

// Filter types
export const filterSchema = z.object({
  search: z.string().optional(),
  units: z.array(z.string()).optional(),
  types: z.array(z.string()).optional(),
  methods: z.array(z.string()).optional(),
  positions: z.array(z.string()).optional(),
});

export type FilterOptions = z.infer<typeof filterSchema>;
