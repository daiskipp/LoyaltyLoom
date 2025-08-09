import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPointTransactionSchema, insertStoreVisitSchema, updateUserProfileSchema } from "@shared/schema";
import QRCode from "qrcode";
import crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const validationResult = updateUserProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid profile data",
          errors: validationResult.error.errors 
        });
      }
      
      const updatedUser = await storage.updateUserProfile(userId, validationResult.data);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Store routes
  app.get('/api/stores', isAuthenticated, async (req, res) => {
    try {
      const stores = await storage.getStores();
      res.json(stores);
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.post('/api/stores', isAuthenticated, async (req, res) => {
    try {
      const { name, address, pointsPerVisit } = req.body;
      const qrCode = crypto.randomBytes(16).toString('hex');
      
      const store = await storage.createStore({
        name,
        address,
        qrCode,
        pointsPerVisit: pointsPerVisit || 50,
      });
      
      res.json(store);
    } catch (error) {
      console.error("Error creating store:", error);
      res.status(500).json({ message: "Failed to create store" });
    }
  });

  // QR Code generation
  app.get('/api/stores/:storeId/qr', isAuthenticated, async (req, res) => {
    try {
      const { storeId } = req.params;
      const stores = await storage.getStores();
      const store = stores.find(s => s.id === storeId);
      
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      const qrCodeDataURL = await QRCode.toDataURL(store.qrCode);
      res.json({ qrCode: qrCodeDataURL });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Check-in routes
  app.post('/api/checkin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { qrCode } = req.body;
      
      if (!qrCode) {
        return res.status(400).json({ message: "QR code is required" });
      }
      
      const store = await storage.getStoreByQrCode(qrCode);
      if (!store) {
        return res.status(404).json({ message: "Invalid QR code" });
      }
      
      const pointsEarned = store.pointsPerVisit || 50;
      
      // Create store visit
      const visit = await storage.createStoreVisit({
        userId,
        storeId: store.id,
        pointsEarned,
      });
      
      // Create point transaction
      const transaction = await storage.createPointTransaction({
        userId,
        storeId: store.id,
        points: pointsEarned,
        type: 'checkin',
        description: `${store.name}でのチェックイン`,
      });
      
      // Update user points
      const updatedUser = await storage.updateUserPoints(userId, pointsEarned);
      
      res.json({
        visit,
        transaction,
        user: updatedUser,
        pointsEarned,
        storeName: store.name,
      });
    } catch (error) {
      console.error("Error during check-in:", error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  // Point transaction routes
  app.get('/api/point-transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getPointTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching point transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Store visit routes
  app.get('/api/store-visits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const visits = await storage.getStoreVisits(userId);
      res.json(visits);
    } catch (error) {
      console.error("Error fetching store visits:", error);
      res.status(500).json({ message: "Failed to fetch visits" });
    }
  });

  // Combined activity feed
  app.get('/api/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [transactions, visits] = await Promise.all([
        storage.getPointTransactions(userId),
        storage.getStoreVisits(userId),
      ]);
      
      // Get store information for activities
      const stores = await storage.getStores();
      const storeMap = new Map(stores.map(s => [s.id, s]));
      
      const activities = transactions.map(t => ({
        id: t.id,
        type: 'transaction',
        storeName: t.storeId ? storeMap.get(t.storeId)?.name : null,
        description: t.description,
        points: t.points,
        createdAt: t.createdAt,
      }));
      
      // Sort by date, most recent first
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(activities.slice(0, 20)); // Return last 20 activities
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Initialize demo store if none exist
  app.post('/api/init-demo', isAuthenticated, async (req, res) => {
    try {
      const stores = await storage.getStores();
      if (stores.length === 0) {
        // Create demo stores
        const demoStores = [
          {
            name: "カフェ・ドリーム",
            address: "東京都渋谷区1-1-1",
            qrCode: "test-store-qr-code-123",
            pointsPerVisit: 50,
          },
          {
            name: "ブックストア本の森",
            address: "東京都新宿区2-2-2", 
            qrCode: "bookstore-qr-456",
            pointsPerVisit: 30,
          },
          {
            name: "レストラン味楽",
            address: "東京都港区3-3-3",
            qrCode: "restaurant-qr-789",
            pointsPerVisit: 100,
          }
        ];
        
        for (const storeData of demoStores) {
          await storage.createStore(storeData);
        }
        
        res.json({ message: "Demo stores created successfully", count: demoStores.length });
      } else {
        res.json({ message: "Stores already exist", count: stores.length });
      }
    } catch (error) {
      console.error("Error initializing demo stores:", error);
      res.status(500).json({ message: "Failed to initialize demo stores" });
    }
  });

  // Get all stores
  app.get("/api/stores", isAuthenticated, async (req: any, res) => {
    try {
      const stores = await storage.getStores();
      res.json(stores);
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
