import { 
  isolationPoints, 
  savedLists, 
  type IsolationPoint, 
  type InsertIsolationPoint,
  type SavedList,
  type InsertSavedList,
  type FilterOptions
} from "@shared/schema";

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

export const storage = new MemStorage();
