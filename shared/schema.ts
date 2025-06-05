import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const isolationPoints = pgTable("isolation_points", {
  id: serial("id").primaryKey(),
  kks: text("kks"),
  unit: text("unit"),
  description: text("description"),
  type: text("type"), // Electrical, Mechanical, Hydraulic, Pneumatic
  panelKks: text("panel_kks"),
  loadKks: text("load_kks"),
  isolationMethod: text("isolation_method"),
  normalPosition: text("normal_position"),
  isolationPosition: text("isolation_position"),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedLists = pgTable("saved_lists", {
  id: serial("id").primaryKey(),
  name: text("name"),
  description: text("description"),
  isolationPointIds: jsonb("isolation_point_ids").$type<number[]>(),
  jsaNumber: text("jsa_number"),
  workOrder: text("work_order"),
  jobDescription: text("job_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const procedureExecutions = pgTable("procedure_executions", {
  id: serial("id").primaryKey(),
  savedListId: integer("saved_list_id").references(() => savedLists.id),
  executionDate: timestamp("execution_date"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  status: text("status"), // "in-progress", "completed", "failed", "cancelled"
  executedBy: text("executed_by"),
  supervisedBy: text("supervised_by"),
  unit: text("unit"),
  workOrderNumber: text("work_order_number"),
  totalPoints: integer("total_points"),
  completedPoints: integer("completed_points").default(0),
  safetyIncidents: integer("safety_incidents").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pointExecutions = pgTable("point_executions", {
  id: serial("id").primaryKey(),
  procedureExecutionId: integer("procedure_execution_id").references(() => procedureExecutions.id),
  isolationPointId: integer("isolation_point_id").references(() => isolationPoints.id),
  executionOrder: integer("execution_order"),
  isolationMethod: text("isolation_method"),
  executionTime: timestamp("execution_time"),
  executedBy: text("executed_by"),
  verifiedBy: text("verified_by"),
  verificationTime: timestamp("verification_time"),
  status: text("status"), // "pending", "isolated", "verified", "failed"
  actualPosition: text("actual_position"),
  lockApplied: boolean("lock_applied").default(false),
  tagApplied: boolean("tag_applied").default(false),
  issues: text("issues"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const safetyMetrics = pgTable("safety_metrics", {
  id: serial("id").primaryKey(),
  procedureExecutionId: integer("procedure_execution_id").references(() => procedureExecutions.id),
  metricType: text("metric_type"), // "near_miss", "safety_observation", "incident", "compliance_check"
  severity: text("severity"), // "low", "medium", "high", "critical"
  description: text("description"),
  correctionAction: text("correction_action"),
  reportedBy: text("reported_by"),
  reportedAt: timestamp("reported_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
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

export const insertProcedureExecutionSchema = createInsertSchema(procedureExecutions).omit({
  id: true,
  createdAt: true,
});

export const insertPointExecutionSchema = createInsertSchema(pointExecutions).omit({
  id: true,
  createdAt: true,
});

export const insertSafetyMetricSchema = createInsertSchema(safetyMetrics).omit({
  id: true,
  createdAt: true,
});

export type InsertIsolationPoint = z.infer<typeof insertIsolationPointSchema>;
export type IsolationPoint = typeof isolationPoints.$inferSelect;
export type InsertSavedList = z.infer<typeof insertSavedListSchema>;
export type SavedList = typeof savedLists.$inferSelect;
export type InsertProcedureExecution = z.infer<typeof insertProcedureExecutionSchema>;
export type ProcedureExecution = typeof procedureExecutions.$inferSelect;
export type InsertPointExecution = z.infer<typeof insertPointExecutionSchema>;
export type PointExecution = typeof pointExecutions.$inferSelect;
export type InsertSafetyMetric = z.infer<typeof insertSafetyMetricSchema>;
export type SafetyMetric = typeof safetyMetrics.$inferSelect;

// Filter types
export const filterSchema = z.object({
  search: z.string().optional(),
  units: z.array(z.string()).optional(),
  types: z.array(z.string()).optional(),
  methods: z.array(z.string()).optional(),
  positions: z.array(z.string()).optional(),
});

export type FilterOptions = z.infer<typeof filterSchema>;
