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
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      if (error.message && error.message.includes('既に使用されています')) {
        return res.status(400).json({ message: error.message });
      }
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

  // Get single store by ID
  app.get('/api/stores/:id', isAuthenticated, async (req, res) => {
    try {
      const storeId = req.params.id;
      const stores = await storage.getStores();
      const store = stores.find(s => s.id === storeId);
      
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      res.json(store);
    } catch (error) {
      console.error("Error fetching store:", error);
      res.status(500).json({ message: "Failed to fetch store" });
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
      
      const experienceEarned = store.experiencePerVisit || 25;
      const loyaltyEarned = store.loyaltyPerVisit || 50;
      const coinsEarned = store.coinsPerVisit || 10;
      const gemsEarned = store.gemsPerVisit || 1;
      
      // Get user's current level for tracking
      const currentUser = await storage.getUser(userId);
      const levelBefore = currentUser?.level || 1;
      
      // Update user points
      const updatedUser = await storage.updateUserPoints(userId, {
        experience: experienceEarned,
        loyalty: loyaltyEarned,
        coins: coinsEarned,
        gems: gemsEarned,
      });
      
      const levelAfter = updatedUser.level || 1;
      const leveledUp = levelAfter > levelBefore;
      
      // Create store visit
      const visit = await storage.createStoreVisit({
        userId,
        storeId: store.id,
        experienceEarned,
        loyaltyEarned,
        coinsEarned,
        gemsEarned,
        levelBefore,
        levelAfter,
      });
      
      // Create point transaction
      const transaction = await storage.createPointTransaction({
        userId,
        storeId: store.id,
        experiencePoints: experienceEarned,
        loyaltyPoints: loyaltyEarned,
        coins: coinsEarned,
        gems: gemsEarned,
        type: 'checkin',
        description: `${store.name}でのチェックイン`,
      });
      
      res.json({
        visit,
        transaction,
        user: updatedUser,
        rewards: {
          experience: experienceEarned,
          loyalty: loyaltyEarned,
          coins: coinsEarned,
          gems: gemsEarned,
        },
        leveledUp,
        levelBefore,
        levelAfter,
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
        rewards: {
          experience: t.experiencePoints || 0,
          loyalty: t.loyaltyPoints || 0,
          coins: t.coins || 0,
          gems: t.gems || 0,
        },
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
        // Create RPG-style demo stores
        const demoStores = [
          {
            name: "カフェ・ドリーム",
            address: "東京都渋谷区1-1-1",
            qrCode: "test-store-qr-code-123",
            experiencePerVisit: 25,
            loyaltyPerVisit: 50,
            coinsPerVisit: 10,
            gemsPerVisit: 1,
            storeType: "regular",
          },
          {
            name: "ブックストア本の森",
            address: "東京都新宿区2-2-2", 
            qrCode: "bookstore-qr-456",
            experiencePerVisit: 30,
            loyaltyPerVisit: 40,
            coinsPerVisit: 15,
            gemsPerVisit: 1,
            storeType: "premium",
          },
          {
            name: "レストラン味楽",
            address: "東京都港区3-3-3",
            qrCode: "restaurant-qr-789",
            experiencePerVisit: 50,
            loyaltyPerVisit: 100,
            coinsPerVisit: 25,
            gemsPerVisit: 3,
            storeType: "special",
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

  // Store QR code generation
  app.get("/api/stores/:id/qr", isAuthenticated, async (req, res) => {
    try {
      const stores = await storage.getStores();
      const store = stores.find(s => s.id === req.params.id);
      
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      const qrCode = await QRCode.toDataURL(store.qrCode);
      res.json({ qrCode, storeName: store.name });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Coin transfer routes
  app.get("/api/coins/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getCoinTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching coin transactions:", error);
      res.status(500).json({ message: "Failed to fetch coin transactions" });
    }
  });

  app.post("/api/coins/transfer", isAuthenticated, async (req: any, res) => {
    try {
      const fromUserId = req.user.claims.sub;
      const { toUserId, amount, message } = req.body;

      if (!toUserId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid transfer data" });
      }

      const transaction = await storage.transferCoins(fromUserId, toUserId, amount, message);
      
      // Auto-add to address book if not exists
      try {
        const existingEntry = await storage.findAddressBookEntry(fromUserId, toUserId);
        if (!existingEntry) {
          const recipientUser = await storage.getUser(toUserId);
          if (recipientUser) {
            const nickname = recipientUser.firstName || recipientUser.email || toUserId;
            await storage.addToAddressBook({
              userId: fromUserId,
              recipientUserId: toUserId,
              nickname,
              isFavorite: false,
            });
          }
        }
      } catch (addressBookError) {
        // Don't fail the transfer if address book update fails
        console.log("Failed to auto-add to address book:", addressBookError);
      }
      
      res.json({
        success: true,
        transaction,
        message: `${amount}コインを送信しました`,
      });
    } catch (error) {
      console.error("Error transferring coins:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Transfer failed" });
    }
  });

  app.get("/api/coins/balance", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const balance = await storage.getCoinBalance(userId);
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching coin balance:", error);
      res.status(500).json({ message: "Failed to fetch coin balance" });
    }
  });

  // Address book routes
  app.get("/api/address-book", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const addressBook = await storage.getAddressBook(userId);
      res.json(addressBook);
    } catch (error) {
      console.error("Error fetching address book:", error);
      res.status(500).json({ message: "Failed to fetch address book" });
    }
  });

  app.post("/api/address-book", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { recipientUserId, nickname, isFavorite } = req.body;

      if (!recipientUserId || !nickname) {
        return res.status(400).json({ message: "Recipient ID and nickname are required" });
      }

      const entry = await storage.addToAddressBook({
        userId,
        recipientUserId,
        nickname,
        isFavorite: isFavorite || false,
      });

      res.json({
        success: true,
        entry,
        message: "アドレス帳に追加しました",
      });
    } catch (error) {
      console.error("Error adding to address book:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to add address book entry" });
    }
  });

  app.put("/api/address-book/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { nickname, isFavorite } = req.body;

      const entry = await storage.updateAddressBookEntry(id, {
        nickname,
        isFavorite,
      });

      res.json({
        success: true,
        entry,
        message: "アドレス帳を更新しました",
      });
    } catch (error) {
      console.error("Error updating address book entry:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update address book entry" });
    }
  });

  app.delete("/api/address-book/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromAddressBook(id);
      res.json({
        success: true,
        message: "アドレス帳から削除しました",
      });
    } catch (error) {
      console.error("Error removing from address book:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to remove from address book" });
    }
  });

  // NFT routes
  app.get("/api/nfts/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userNfts = await storage.getUserNfts(userId);
      res.json(userNfts);
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
      res.status(500).json({ message: "Failed to fetch NFTs" });
    }
  });

  app.get("/api/nfts", isAuthenticated, async (req: any, res) => {
    try {
      const nfts = await storage.getAllNfts();
      res.json(nfts);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      res.status(500).json({ message: "Failed to fetch NFTs" });
    }
  });

  app.post("/api/nfts", isAuthenticated, async (req: any, res) => {
    try {
      const { name, description, imageUrl, category, rarity } = req.body;

      if (!name) {
        return res.status(400).json({ message: "NFT name is required" });
      }

      const nft = await storage.createNft({
        name,
        description,
        imageUrl,
        category: category || "event",
        rarity: rarity || "common",
      });

      res.json({
        success: true,
        nft,
        message: "NFTを作成しました",
      });
    } catch (error) {
      console.error("Error creating NFT:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create NFT" });
    }
  });

  app.post("/api/nfts/:id/award", isAuthenticated, async (req: any, res) => {
    try {
      const { id: nftId } = req.params;
      const { reason, metadata } = req.body;
      const userId = req.user.claims.sub;

      const userNft = await storage.awardNftToUser(userId, nftId, reason, metadata);

      res.json({
        success: true,
        userNft,
        message: "NFTを獲得しました！",
      });
    } catch (error) {
      console.error("Error awarding NFT:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to award NFT" });
    }
  });

  // Announcements endpoints
  app.get('/api/announcements', isAuthenticated, async (req, res) => {
    try {
      const { storeId } = req.query;
      if (storeId) {
        const announcements = await storage.getAnnouncementsByStore(storeId as string);
        res.json(announcements);
      } else {
        const announcements = await storage.getActiveAnnouncements();
        res.json(announcements);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Get filtered announcements for authenticated user (global + favorite stores)
  app.get("/api/announcements/filtered", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const announcements = await storage.getAnnouncementsForUser(userId);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching filtered announcements:", error);
      res.status(500).json({ message: "Failed to fetch filtered announcements" });
    }
  });

  // Get user's favorite stores
  app.get("/api/favorite-stores", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favoriteStores = await storage.getFavoriteStores(userId);
      res.json(favoriteStores);
    } catch (error) {
      console.error("Error fetching favorite stores:", error);
      res.status(500).json({ message: "Failed to fetch favorite stores" });
    }
  });

  // Add a store to favorites
  app.post("/api/favorite-stores", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storeId } = req.body;
      
      if (!storeId) {
        return res.status(400).json({ message: "Store ID is required" });
      }

      const favoriteStore = await storage.addFavoriteStore(userId, storeId);
      res.json(favoriteStore);
    } catch (error) {
      console.error("Error adding favorite store:", error);
      res.status(500).json({ message: "Failed to add favorite store" });
    }
  });

  // Remove a store from favorites
  app.delete("/api/favorite-stores/:storeId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storeId } = req.params;

      await storage.removeFavoriteStore(userId, storeId);
      res.json({ message: "Store removed from favorites" });
    } catch (error) {
      console.error("Error removing favorite store:", error);
      res.status(500).json({ message: "Failed to remove favorite store" });
    }
  });

  // Check if a store is favorited
  app.get("/api/favorite-stores/:storeId/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storeId } = req.params;

      const isFavorite = await storage.isFavoriteStore(userId, storeId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite store:", error);
      res.status(500).json({ message: "Failed to check favorite store" });
    }
  });

  app.post('/api/announcements', isAuthenticated, async (req, res) => {
    try {
      const announcement = await storage.createAnnouncement(req.body);
      res.json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  // Initialize demo announcements
  app.post('/api/init-announcements', isAuthenticated, async (req, res) => {
    try {
      const demoAnnouncements = [
        {
          title: "🎉 特別キャンペーン開催中！",
          content: "今月限定でポイント2倍キャンペーンを実施中です。この機会にぜひご利用ください！",
          type: "promotion",
          priority: 5,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        {
          title: "📱 新機能リリースのお知らせ",
          content: "NFTコレクション機能が追加されました。イベント参加でレアなNFTを獲得しよう！",
          type: "info",
          priority: 3,
        },
        {
          title: "🏪 新店舗オープン",
          content: "渋谷店が新規オープンしました。オープン記念として初回来店でボーナスポイントプレゼント！",
          type: "event",
          priority: 4,
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        },
        {
          title: "⚠️ システムメンテナンスのお知らせ",
          content: "本日23:00〜翌1:00の間、システムメンテナンスを行います。ご利用いただけない時間がございます。",
          type: "urgent",
          priority: 5,
          startDate: new Date(),
          endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        }
      ];

      const created = [];
      for (const announcementData of demoAnnouncements) {
        const announcement = await storage.createAnnouncement(announcementData);
        created.push(announcement);
      }

      res.json({
        success: true,
        count: created.length,
        announcements: created,
        message: `${created.length}件のお知らせを作成しました`,
      });
    } catch (error) {
      console.error("Error creating demo announcements:", error);
      res.status(500).json({ message: "Failed to create demo announcements" });
    }
  });

  // Notifications endpoints
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread notification count" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      await storage.markNotificationAsRead(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
