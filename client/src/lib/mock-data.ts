import type { IsolationPoint, SavedList } from "@shared/schema";

export const mockIsolationPoints: IsolationPoint[] = [
  {
    id: 1,
    kks: "1AAA01AA001",
    unit: "Unit 1",
    description: "Primary Coolant Pump Motor Breaker",
    type: "Electrical",
    panelKks: "1AAA01AB001",
    loadKks: "1AAA01AC001",
    isolationMethod: "Circuit Breaker",
    normalPosition: "Closed",
    isolationPosition: "Open",
    specialInstructions: "Verify zero energy state before proceeding. Requires two-person verification for safety-critical systems.",
    createdAt: new Date("2024-01-01T10:00:00Z")
  },
  {
    id: 2,
    kks: "1BBB02AA015",
    unit: "Unit 1",
    description: "Main Steam Isolation Valve",
    type: "Mechanical",
    panelKks: "1BBB02AB015",
    loadKks: "1BBB02AC015",
    isolationMethod: "Motor Operated Valve",
    normalPosition: "Open",
    isolationPosition: "Closed",
    specialInstructions: "Ensure steam pressure is relieved before isolation. Check valve position indicator.",
    createdAt: new Date("2024-01-01T10:15:00Z")
  },
  {
    id: 3,
    kks: "2CCC03AA027",
    unit: "Unit 2",
    description: "Hydraulic System Isolation",
    type: "Hydraulic",
    panelKks: "2CCC03AB027",
    loadKks: "2CCC03AC027",
    isolationMethod: "Manual Valve",
    normalPosition: "Closed",
    isolationPosition: "Open",
    specialInstructions: "Depressurize hydraulic system before valve operation. Use proper PPE.",
    createdAt: new Date("2024-01-01T10:30:00Z")
  },
  {
    id: 4,
    kks: "3DDD04AA042",
    unit: "Unit 3",
    description: "Compressed Air System Isolator",
    type: "Pneumatic",
    panelKks: "3DDD04AB042",
    loadKks: "3DDD04AC042",
    isolationMethod: "Manual Isolation",
    normalPosition: "Open",
    isolationPosition: "Closed",
    specialInstructions: "Verify air pressure is released downstream. Lock valve in closed position.",
    createdAt: new Date("2024-01-01T10:45:00Z")
  },
  {
    id: 5,
    kks: "1EEE05AA089",
    unit: "Unit 1",
    description: "Emergency Shutdown Breaker",
    type: "Electrical",
    panelKks: "1EEE05AB089",
    loadKks: "1EEE05AC089",
    isolationMethod: "Circuit Breaker",
    normalPosition: "Energized",
    isolationPosition: "De-energized",
    specialInstructions: "Critical safety system - notify control room before isolation. Test emergency backup systems.",
    createdAt: new Date("2024-01-01T11:00:00Z")
  }
];

export const mockSavedLists: SavedList[] = [
  {
    id: 1,
    name: "Unit 1 Maintenance",
    description: "Routine maintenance isolation points for Unit 1",
    isolationPointIds: [1, 2, 5],
    createdAt: new Date("2024-01-02T09:00:00Z"),
    updatedAt: new Date("2024-01-02T09:00:00Z")
  },
  {
    id: 2,
    name: "Emergency Shutdown",
    description: "Emergency isolation procedure for all units",
    isolationPointIds: [5, 1, 2],
    createdAt: new Date("2024-01-02T14:30:00Z"),
    updatedAt: new Date("2024-01-02T14:30:00Z")
  }
];
