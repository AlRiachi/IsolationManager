import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertIsolationPointSchema, 
  insertSavedListSchema, 
  filterSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Isolation Points routes
  app.get("/api/isolation-points", async (req, res) => {
    try {
      const points = await storage.getAllIsolationPoints();
      res.json(points);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch isolation points" });
    }
  });

  app.get("/api/isolation-points/search", async (req, res) => {
    try {
      const filters = filterSchema.parse(req.query);
      const points = await storage.searchIsolationPoints(filters);
      res.json(points);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid filter parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to search isolation points" });
      }
    }
  });

  app.get("/api/isolation-points/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const point = await storage.getIsolationPoint(id);
      if (!point) {
        return res.status(404).json({ message: "Isolation point not found" });
      }
      res.json(point);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch isolation point" });
    }
  });

  app.post("/api/isolation-points", async (req, res) => {
    try {
      const pointData = insertIsolationPointSchema.parse(req.body);
      const point = await storage.createIsolationPoint(pointData);
      res.status(201).json(point);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid isolation point data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create isolation point" });
      }
    }
  });

  app.put("/api/isolation-points/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertIsolationPointSchema.partial().parse(req.body);
      const point = await storage.updateIsolationPoint(id, updateData);
      if (!point) {
        return res.status(404).json({ message: "Isolation point not found" });
      }
      res.json(point);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update isolation point" });
      }
    }
  });

  app.delete("/api/isolation-points/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteIsolationPoint(id);
      if (!deleted) {
        return res.status(404).json({ message: "Isolation point not found" });
      }
      res.json({ message: "Isolation point deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete isolation point" });
    }
  });

  // Saved Lists routes
  app.get("/api/saved-lists", async (req, res) => {
    try {
      const lists = await storage.getAllSavedLists();
      res.json(lists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved lists" });
    }
  });

  app.get("/api/saved-lists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const list = await storage.getSavedList(id);
      if (!list) {
        return res.status(404).json({ message: "Saved list not found" });
      }
      res.json(list);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved list" });
    }
  });

  app.post("/api/saved-lists", async (req, res) => {
    try {
      const listData = insertSavedListSchema.parse(req.body);
      const list = await storage.createSavedList(listData);
      res.status(201).json(list);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid saved list data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create saved list" });
      }
    }
  });

  app.put("/api/saved-lists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertSavedListSchema.partial().parse(req.body);
      const list = await storage.updateSavedList(id, updateData);
      if (!list) {
        return res.status(404).json({ message: "Saved list not found" });
      }
      res.json(list);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update saved list" });
      }
    }
  });

  app.delete("/api/saved-lists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSavedList(id);
      if (!deleted) {
        return res.status(404).json({ message: "Saved list not found" });
      }
      res.json({ message: "Saved list deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete saved list" });
    }
  });

  // Export functionality
  app.post("/api/export/isolation-list", async (req, res) => {
    try {
      const { isolationPointIds } = req.body;
      if (!Array.isArray(isolationPointIds)) {
        return res.status(400).json({ message: "Invalid isolation point IDs" });
      }

      const points = await storage.getAllIsolationPoints();
      const selectedPoints = points.filter(p => isolationPointIds.includes(p.id));

      // Generate CSV format for export
      const csvHeader = "KKS,Unit,Description,Type,Panel KKS,Load KKS,Method,Normal Position,Isolation Position,Special Instructions\n";
      const csvData = selectedPoints.map(p => 
        `"${p.kks}","${p.unit}","${p.description}","${p.type}","${p.panelKks || ''}","${p.loadKks || ''}","${p.isolationMethod}","${p.normalPosition}","${p.isolationPosition || ''}","${p.specialInstructions || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="isolation-points.csv"');
      res.send(csvHeader + csvData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export isolation list" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
