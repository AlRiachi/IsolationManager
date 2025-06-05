import { 
  isolationPoints, 
  savedLists,
  procedureExecutions,
  pointExecutions,
  safetyMetrics,
  type IsolationPoint, 
  type InsertIsolationPoint,
  type SavedList,
  type InsertSavedList,
  type ProcedureExecution,
  type InsertProcedureExecution,
  type PointExecution,
  type InsertPointExecution,
  type SafetyMetric,
  type InsertSafetyMetric,
  type FilterOptions
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, inArray, desc, count, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Isolation Points
  getAllIsolationPoints(): Promise<IsolationPoint[]>;
  getIsolationPoint(id: number): Promise<IsolationPoint | undefined>;
  createIsolationPoint(point: InsertIsolationPoint): Promise<IsolationPoint>;
  updateIsolationPoint(id: number, point: Partial<InsertIsolationPoint>): Promise<IsolationPoint | undefined>;
  deleteIsolationPoint(id: number): Promise<boolean>;
  searchIsolationPoints(filters: FilterOptions): Promise<IsolationPoint[]>;
  
  // Saved Lists
  getAllSavedLists(): Promise<SavedList[]>;
  getSavedList(id: number): Promise<SavedList | undefined>;
  createSavedList(list: InsertSavedList): Promise<SavedList>;
  updateSavedList(id: number, list: Partial<InsertSavedList>): Promise<SavedList | undefined>;
  deleteSavedList(id: number): Promise<boolean>;

  // Procedure Executions
  getAllProcedureExecutions(): Promise<ProcedureExecution[]>;
  getProcedureExecution(id: number): Promise<ProcedureExecution | undefined>;
  createProcedureExecution(execution: InsertProcedureExecution): Promise<ProcedureExecution>;
  updateProcedureExecution(id: number, execution: Partial<InsertProcedureExecution>): Promise<ProcedureExecution | undefined>;
  deleteProcedureExecution(id: number): Promise<boolean>;

  // Point Executions
  getPointExecutionsByProcedure(procedureId: number): Promise<PointExecution[]>;
  createPointExecution(execution: InsertPointExecution): Promise<PointExecution>;
  updatePointExecution(id: number, execution: Partial<InsertPointExecution>): Promise<PointExecution | undefined>;

  // Safety Metrics
  getSafetyMetricsByProcedure(procedureId: number): Promise<SafetyMetric[]>;
  createSafetyMetric(metric: InsertSafetyMetric): Promise<SafetyMetric>;
  updateSafetyMetric(id: number, metric: Partial<InsertSafetyMetric>): Promise<SafetyMetric | undefined>;

  // Analytics & Reporting
  getExecutionStatistics(startDate?: Date, endDate?: Date): Promise<any>;
  getSafetyStatistics(startDate?: Date, endDate?: Date): Promise<any>;
  getEquipmentStatistics(): Promise<any>;
  getPerformanceMetrics(startDate?: Date, endDate?: Date): Promise<any>;
  getComplianceReport(startDate?: Date, endDate?: Date): Promise<any>;
}

export class MemStorage implements IStorage {
  private isolationPointsMap: Map<number, IsolationPoint>;
  private savedListsMap: Map<number, SavedList>;
  private currentIsolationPointId: number;
  private currentSavedListId: number;

  constructor() {
    this.isolationPointsMap = new Map();
    this.savedListsMap = new Map();
    this.currentIsolationPointId = 1;
    this.currentSavedListId = 1;
    
    // Initialize with sample data for demonstration
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const samplePoints: InsertIsolationPoint[] = [
      {
        kks: "1AAA01AA001",
        unit: "Unit 1",
        description: "Primary Coolant Pump Motor Breaker",
        type: "Electrical",
        panelKks: "1AAA01AB001",
        loadKks: "1AAA01AC001",
        isolationMethod: "Circuit Breaker",
        normalPosition: "Closed",
        isolationPosition: "Open",
        specialInstructions: "Verify zero energy state before proceeding. Requires two-person verification for safety-critical systems."
      },
      {
        kks: "1BBB02AA015",
        unit: "Unit 1",
        description: "Main Steam Isolation Valve",
        type: "Mechanical",
        panelKks: "1BBB02AB015",
        loadKks: "1BBB02AC015",
        isolationMethod: "Motor Operated Valve",
        normalPosition: "Open",
        isolationPosition: "Closed",
        specialInstructions: "Ensure steam pressure is relieved before isolation. Check valve position indicator."
      },
      {
        kks: "2CCC03AA027",
        unit: "Unit 2",
        description: "Hydraulic System Isolation",
        type: "Hydraulic",
        panelKks: "2CCC03AB027",
        loadKks: "2CCC03AC027",
        isolationMethod: "Manual Valve",
        normalPosition: "Closed",
        isolationPosition: "Open",
        specialInstructions: "Depressurize hydraulic system before valve operation. Use proper PPE."
      },
      {
        kks: "3DDD04AA042",
        unit: "Unit 3",
        description: "Compressed Air System Isolator",
        type: "Pneumatic",
        panelKks: "3DDD04AB042",
        loadKks: "3DDD04AC042",
        isolationMethod: "Manual Isolation",
        normalPosition: "Open",
        isolationPosition: "Closed",
        specialInstructions: "Verify air pressure is released downstream. Lock valve in closed position."
      },
      {
        kks: "1EEE05AA089",
        unit: "Unit 1",
        description: "Emergency Shutdown Breaker",
        type: "Electrical",
        panelKks: "1EEE05AB089",
        loadKks: "1EEE05AC089",
        isolationMethod: "Circuit Breaker",
        normalPosition: "Energized",
        isolationPosition: "De-energized",
        specialInstructions: "Critical safety system - notify control room before isolation. Test emergency backup systems."
      }
    ];

    samplePoints.forEach(point => {
      const id = this.currentIsolationPointId++;
      const isolationPoint: IsolationPoint = {
        ...point,
        id,
        panelKks: point.panelKks || null,
        loadKks: point.loadKks || null,
        isolationPosition: point.isolationPosition || null,
        specialInstructions: point.specialInstructions || null,
        createdAt: new Date()
      };
      this.isolationPointsMap.set(id, isolationPoint);
    });

    // Add sample saved lists
    const sampleLists: InsertSavedList[] = [
      {
        name: "Unit 1 Maintenance",
        description: "Routine maintenance isolation points for Unit 1",
        isolationPointIds: [1, 2, 5]
      },
      {
        name: "Emergency Shutdown",
        description: "Emergency isolation procedure for all units",
        isolationPointIds: [5, 1, 2]
      }
    ];

    sampleLists.forEach(list => {
      const id = this.currentSavedListId++;
      const savedList: SavedList = {
        ...list,
        id,
        description: list.description || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.savedListsMap.set(id, savedList);
    });
  }

  // Isolation Points methods
  async getAllIsolationPoints(): Promise<IsolationPoint[]> {
    return Array.from(this.isolationPointsMap.values());
  }

  async getIsolationPoint(id: number): Promise<IsolationPoint | undefined> {
    return this.isolationPointsMap.get(id);
  }

  async createIsolationPoint(insertPoint: InsertIsolationPoint): Promise<IsolationPoint> {
    const id = this.currentIsolationPointId++;
    const point: IsolationPoint = {
      ...insertPoint,
      id,
      panelKks: insertPoint.panelKks || null,
      loadKks: insertPoint.loadKks || null,
      isolationPosition: insertPoint.isolationPosition || null,
      specialInstructions: insertPoint.specialInstructions || null,
      createdAt: new Date()
    };
    this.isolationPointsMap.set(id, point);
    return point;
  }

  async updateIsolationPoint(id: number, updateData: Partial<InsertIsolationPoint>): Promise<IsolationPoint | undefined> {
    const existingPoint = this.isolationPointsMap.get(id);
    if (!existingPoint) return undefined;

    const updatedPoint: IsolationPoint = {
      ...existingPoint,
      ...updateData
    };
    this.isolationPointsMap.set(id, updatedPoint);
    return updatedPoint;
  }

  async deleteIsolationPoint(id: number): Promise<boolean> {
    return this.isolationPointsMap.delete(id);
  }

  async searchIsolationPoints(filters: FilterOptions): Promise<IsolationPoint[]> {
    let points = Array.from(this.isolationPointsMap.values());

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      points = points.filter(point =>
        point.kks.toLowerCase().includes(searchLower) ||
        point.description.toLowerCase().includes(searchLower) ||
        point.unit.toLowerCase().includes(searchLower) ||
        point.type.toLowerCase().includes(searchLower) ||
        point.isolationMethod.toLowerCase().includes(searchLower) ||
        (point.panelKks && point.panelKks.toLowerCase().includes(searchLower)) ||
        (point.loadKks && point.loadKks.toLowerCase().includes(searchLower)) ||
        (point.specialInstructions && point.specialInstructions.toLowerCase().includes(searchLower))
      );
    }

    if (filters.units && filters.units.length > 0) {
      points = points.filter(point => filters.units!.includes(point.unit));
    }

    if (filters.types && filters.types.length > 0) {
      points = points.filter(point => filters.types!.includes(point.type));
    }

    if (filters.methods && filters.methods.length > 0) {
      points = points.filter(point => filters.methods!.includes(point.isolationMethod));
    }

    if (filters.positions && filters.positions.length > 0) {
      points = points.filter(point => filters.positions!.includes(point.normalPosition));
    }

    return points;
  }

  // Saved Lists methods
  async getAllSavedLists(): Promise<SavedList[]> {
    return Array.from(this.savedListsMap.values());
  }

  async getSavedList(id: number): Promise<SavedList | undefined> {
    return this.savedListsMap.get(id);
  }

  async createSavedList(insertList: InsertSavedList): Promise<SavedList> {
    const id = this.currentSavedListId++;
    const list: SavedList = {
      ...insertList,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.savedListsMap.set(id, list);
    return list;
  }

  async updateSavedList(id: number, updateData: Partial<InsertSavedList>): Promise<SavedList | undefined> {
    const existingList = this.savedListsMap.get(id);
    if (!existingList) return undefined;

    const updatedList: SavedList = {
      ...existingList,
      ...updateData,
      updatedAt: new Date()
    };
    this.savedListsMap.set(id, updatedList);
    return updatedList;
  }

  async deleteSavedList(id: number): Promise<boolean> {
    return this.savedListsMap.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // Isolation Points methods
  async getAllIsolationPoints(): Promise<IsolationPoint[]> {
    return await db.select().from(isolationPoints);
  }

  async getIsolationPoint(id: number): Promise<IsolationPoint | undefined> {
    const [point] = await db.select().from(isolationPoints).where(eq(isolationPoints.id, id));
    return point || undefined;
  }

  async createIsolationPoint(insertPoint: InsertIsolationPoint): Promise<IsolationPoint> {
    const [point] = await db
      .insert(isolationPoints)
      .values(insertPoint)
      .returning();
    return point;
  }

  async updateIsolationPoint(id: number, updateData: Partial<InsertIsolationPoint>): Promise<IsolationPoint | undefined> {
    const [point] = await db
      .update(isolationPoints)
      .set(updateData)
      .where(eq(isolationPoints.id, id))
      .returning();
    return point || undefined;
  }

  async deleteIsolationPoint(id: number): Promise<boolean> {
    const result = await db
      .delete(isolationPoints)
      .where(eq(isolationPoints.id, id));
    return result.rowCount > 0;
  }

  async searchIsolationPoints(filters: FilterOptions): Promise<IsolationPoint[]> {
    let query = db.select().from(isolationPoints);
    const conditions = [];

    if (filters.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`LOWER(COALESCE(${isolationPoints.kks}, ''))`, searchTerm),
          like(sql`LOWER(COALESCE(${isolationPoints.description}, ''))`, searchTerm),
          like(sql`LOWER(COALESCE(${isolationPoints.unit}, ''))`, searchTerm),
          like(sql`LOWER(COALESCE(${isolationPoints.type}, ''))`, searchTerm),
          like(sql`LOWER(COALESCE(${isolationPoints.isolationMethod}, ''))`, searchTerm),
          like(sql`LOWER(COALESCE(${isolationPoints.panelKks}, ''))`, searchTerm),
          like(sql`LOWER(COALESCE(${isolationPoints.loadKks}, ''))`, searchTerm),
          like(sql`LOWER(COALESCE(${isolationPoints.normalPosition}, ''))`, searchTerm),
          like(sql`LOWER(COALESCE(${isolationPoints.isolationPosition}, ''))`, searchTerm),
          like(sql`LOWER(COALESCE(${isolationPoints.specialInstructions}, ''))`, searchTerm)
        )
      );
    }

    if (filters.units && filters.units.length > 0) {
      conditions.push(inArray(isolationPoints.unit, filters.units));
    }

    if (filters.types && filters.types.length > 0) {
      conditions.push(inArray(isolationPoints.type, filters.types));
    }

    if (filters.methods && filters.methods.length > 0) {
      conditions.push(inArray(isolationPoints.isolationMethod, filters.methods));
    }

    if (filters.positions && filters.positions.length > 0) {
      conditions.push(inArray(isolationPoints.normalPosition, filters.positions));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  // Saved Lists methods
  async getAllSavedLists(): Promise<SavedList[]> {
    return await db.select().from(savedLists);
  }

  async getSavedList(id: number): Promise<SavedList | undefined> {
    const [list] = await db.select().from(savedLists).where(eq(savedLists.id, id));
    return list || undefined;
  }

  async createSavedList(insertList: InsertSavedList): Promise<SavedList> {
    const [list] = await db
      .insert(savedLists)
      .values(insertList)
      .returning();
    return list;
  }

  async updateSavedList(id: number, updateData: Partial<InsertSavedList>): Promise<SavedList | undefined> {
    const [list] = await db
      .update(savedLists)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(savedLists.id, id))
      .returning();
    return list || undefined;
  }

  async deleteSavedList(id: number): Promise<boolean> {
    const result = await db
      .delete(savedLists)
      .where(eq(savedLists.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Procedure Executions methods
  async getAllProcedureExecutions(): Promise<ProcedureExecution[]> {
    return await db.select().from(procedureExecutions).orderBy(desc(procedureExecutions.executionDate));
  }

  async getProcedureExecution(id: number): Promise<ProcedureExecution | undefined> {
    const [execution] = await db.select().from(procedureExecutions).where(eq(procedureExecutions.id, id));
    return execution || undefined;
  }

  async createProcedureExecution(insertExecution: InsertProcedureExecution): Promise<ProcedureExecution> {
    const [execution] = await db
      .insert(procedureExecutions)
      .values(insertExecution)
      .returning();
    return execution;
  }

  async updateProcedureExecution(id: number, updateData: Partial<InsertProcedureExecution>): Promise<ProcedureExecution | undefined> {
    const [execution] = await db
      .update(procedureExecutions)
      .set(updateData)
      .where(eq(procedureExecutions.id, id))
      .returning();
    return execution || undefined;
  }

  async deleteProcedureExecution(id: number): Promise<boolean> {
    const result = await db
      .delete(procedureExecutions)
      .where(eq(procedureExecutions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Point Executions methods
  async getPointExecutionsByProcedure(procedureId: number): Promise<PointExecution[]> {
    return await db
      .select()
      .from(pointExecutions)
      .where(eq(pointExecutions.procedureExecutionId, procedureId))
      .orderBy(pointExecutions.executionOrder);
  }

  async createPointExecution(insertExecution: InsertPointExecution): Promise<PointExecution> {
    const [execution] = await db
      .insert(pointExecutions)
      .values(insertExecution)
      .returning();
    return execution;
  }

  async updatePointExecution(id: number, updateData: Partial<InsertPointExecution>): Promise<PointExecution | undefined> {
    const [execution] = await db
      .update(pointExecutions)
      .set(updateData)
      .where(eq(pointExecutions.id, id))
      .returning();
    return execution || undefined;
  }

  // Safety Metrics methods
  async getSafetyMetricsByProcedure(procedureId: number): Promise<SafetyMetric[]> {
    return await db
      .select()
      .from(safetyMetrics)
      .where(eq(safetyMetrics.procedureExecutionId, procedureId))
      .orderBy(desc(safetyMetrics.reportedAt));
  }

  async createSafetyMetric(insertMetric: InsertSafetyMetric): Promise<SafetyMetric> {
    const [metric] = await db
      .insert(safetyMetrics)
      .values(insertMetric)
      .returning();
    return metric;
  }

  async updateSafetyMetric(id: number, updateData: Partial<InsertSafetyMetric>): Promise<SafetyMetric | undefined> {
    const [metric] = await db
      .update(safetyMetrics)
      .set(updateData)
      .where(eq(safetyMetrics.id, id))
      .returning();
    return metric || undefined;
  }

  // Analytics & Reporting methods
  async getExecutionStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    let query = db
      .select({
        totalExecutions: count(),
        completedExecutions: sql<number>`COUNT(CASE WHEN status = 'completed' THEN 1 END)`,
        failedExecutions: sql<number>`COUNT(CASE WHEN status = 'failed' THEN 1 END)`,
        inProgressExecutions: sql<number>`COUNT(CASE WHEN status = 'in-progress' THEN 1 END)`,
        avgCompletionTime: sql<number>`AVG(EXTRACT(EPOCH FROM (end_time - start_time))/3600)`,
        totalSafetyIncidents: sql<number>`SUM(safety_incidents)`
      })
      .from(procedureExecutions);

    if (startDate) {
      query = query.where(gte(procedureExecutions.executionDate, startDate));
    }
    if (endDate) {
      query = query.where(lte(procedureExecutions.executionDate, endDate));
    }

    const [stats] = await query;
    return stats;
  }

  async getSafetyStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    let query = db
      .select({
        totalIncidents: count(),
        criticalIncidents: sql<number>`COUNT(CASE WHEN severity = 'critical' THEN 1 END)`,
        highIncidents: sql<number>`COUNT(CASE WHEN severity = 'high' THEN 1 END)`,
        mediumIncidents: sql<number>`COUNT(CASE WHEN severity = 'medium' THEN 1 END)`,
        lowIncidents: sql<number>`COUNT(CASE WHEN severity = 'low' THEN 1 END)`,
        resolvedIncidents: sql<number>`COUNT(CASE WHEN resolved_at IS NOT NULL THEN 1 END)`,
        avgResolutionTime: sql<number>`AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))/3600)`
      })
      .from(safetyMetrics);

    if (startDate) {
      query = query.where(gte(safetyMetrics.reportedAt, startDate));
    }
    if (endDate) {
      query = query.where(lte(safetyMetrics.reportedAt, endDate));
    }

    const [stats] = await query;
    return stats;
  }

  async getEquipmentStatistics(): Promise<any> {
    const stats = await db
      .select({
        unit: isolationPoints.unit,
        type: isolationPoints.type,
        isolationMethod: isolationPoints.isolationMethod,
        totalPoints: count(),
        executionCount: sql<number>`COUNT(pe.id)`,
        avgExecutionTime: sql<number>`AVG(EXTRACT(EPOCH FROM (pe.verification_time - pe.execution_time))/60)`
      })
      .from(isolationPoints)
      .leftJoin(pointExecutions, eq(isolationPoints.id, pointExecutions.isolationPointId))
      .groupBy(isolationPoints.unit, isolationPoints.type, isolationPoints.isolationMethod);

    return stats;
  }

  async getPerformanceMetrics(startDate?: Date, endDate?: Date): Promise<any> {
    let query = db
      .select({
        executorName: procedureExecutions.executedBy,
        unit: procedureExecutions.unit,
        totalExecutions: count(),
        completedExecutions: sql<number>`COUNT(CASE WHEN status = 'completed' THEN 1 END)`,
        avgCompletionTime: sql<number>`AVG(EXTRACT(EPOCH FROM (end_time - start_time))/3600)`,
        safetyIncidents: sql<number>`SUM(safety_incidents)`,
        avgPointsPerProcedure: sql<number>`AVG(total_points)`
      })
      .from(procedureExecutions)
      .groupBy(procedureExecutions.executedBy, procedureExecutions.unit);

    if (startDate) {
      query = query.where(gte(procedureExecutions.executionDate, startDate));
    }
    if (endDate) {
      query = query.where(lte(procedureExecutions.executionDate, endDate));
    }

    return await query;
  }

  async getComplianceReport(startDate?: Date, endDate?: Date): Promise<any> {
    let query = db
      .select({
        totalProcedures: count(),
        completedOnTime: sql<number>`COUNT(CASE WHEN status = 'completed' AND end_time <= start_time + INTERVAL '8 hours' THEN 1 END)`,
        proceduresWithIncidents: sql<number>`COUNT(CASE WHEN safety_incidents > 0 THEN 1 END)`,
        proceduresWithVerification: sql<number>`COUNT(CASE WHEN supervised_by IS NOT NULL THEN 1 END)`,
        avgPointCompletionRate: sql<number>`AVG(CAST(completed_points AS FLOAT) / CAST(total_points AS FLOAT) * 100)`
      })
      .from(procedureExecutions);

    if (startDate) {
      query = query.where(gte(procedureExecutions.executionDate, startDate));
    }
    if (endDate) {
      query = query.where(lte(procedureExecutions.executionDate, endDate));
    }

    const [stats] = await query;
    return stats;
  }
}

export const storage = new DatabaseStorage();
