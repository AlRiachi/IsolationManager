import { db } from "./db";
import { isolationPoints, savedLists } from "@shared/schema";

const sampleIsolationPoints = [
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
  },
  {
    kks: "2FFF06AA123",
    unit: "Unit 2",
    description: "Feedwater Pump Discharge Valve",
    type: "Mechanical",
    panelKks: "2FFF06AB123",
    loadKks: "2FFF06AC123",
    isolationMethod: "Motor Operated Valve",
    normalPosition: "Open",
    isolationPosition: "Closed",
    specialInstructions: "Coordinate with operations before isolation. Monitor water level indicators."
  },
  {
    kks: "3GGG07AA156",
    unit: "Unit 3",
    description: "Cooling Water Intake Isolation",
    type: "Hydraulic",
    panelKks: "3GGG07AB156",
    loadKks: "3GGG07AC156",
    isolationMethod: "Manual Valve",
    normalPosition: "Open",
    isolationPosition: "Closed",
    specialInstructions: "Ensure alternative cooling path is available before isolation."
  },
  {
    kks: "1HHH08AA201",
    unit: "Unit 1",
    description: "Instrument Air Supply Isolation",
    type: "Pneumatic",
    panelKks: "1HHH08AB201",
    loadKks: "1HHH08AC201",
    isolationMethod: "Manual Isolation",
    normalPosition: "Open",
    isolationPosition: "Closed",
    specialInstructions: "Critical for control systems - coordinate with control room operations."
  }
];

const sampleSavedLists = [
  {
    name: "Unit 1 Maintenance",
    description: "Routine maintenance isolation points for Unit 1",
    isolationPointIds: [1, 2, 5]
  },
  {
    name: "Emergency Shutdown Procedure",
    description: "Emergency isolation procedure for all units",
    isolationPointIds: [5, 1, 2, 8]
  },
  {
    name: "Cooling System Isolation",
    description: "Isolation points for cooling system maintenance",
    isolationPointIds: [3, 6, 7]
  }
];

async function seedDatabase() {
  try {
    console.log("Seeding database with sample data...");
    
    // Insert isolation points
    const insertedPoints = await db
      .insert(isolationPoints)
      .values(sampleIsolationPoints)
      .returning();
    
    console.log(`Inserted ${insertedPoints.length} isolation points`);
    
    // Insert saved lists
    const insertedLists = await db
      .insert(savedLists)
      .values(sampleSavedLists)
      .returning();
    
    console.log(`Inserted ${insertedLists.length} saved lists`);
    console.log("Database seeding completed successfully!");
    
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function if this file is executed directly
seedDatabase();

export { seedDatabase };