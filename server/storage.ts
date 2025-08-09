import {
  users,
  stores,
  pointTransactions,
  storeVisits,
  passkeyCredentials,
  coinTransactions,
  addressBook,
  nftCollection,
  userNfts,
  type User,
  type UpsertUser,
  type Store,
  type InsertStore,
  type PointTransaction,
  type InsertPointTransaction,
  type StoreVisit,
  type InsertStoreVisit,
  type PasskeyCredential,
  type InsertPasskeyCredential,
  type CoinTransaction,
  type InsertCoinTransaction,
  type AddressBookEntry,
  type InsertAddressBookEntry,
  type NftCollection,
  type InsertNftCollection,
  type UserNft,
  type InsertUserNft,
  announcements,
  favoriteStores,
  type Announcement,
  type InsertAnnouncement,
  type FavoriteStore,
  type InsertFavoriteStore,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ne, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPoints(userId: string, pointsReward: { 
    experience?: number; 
    loyalty?: number; 
    coins?: number; 
    gems?: number; 
  }): Promise<User>;
  updateUserProfile(userId: string, profileData: { firstName?: string; lastName?: string }): Promise<User>;
  
  // Store operations
  getStores(): Promise<Store[]>;
  getStoreByQrCode(qrCode: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  
  // Point transaction operations
  getPointTransactions(userId: string): Promise<PointTransaction[]>;
  createPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction>;
  
  // Store visit operations
  getStoreVisits(userId: string): Promise<StoreVisit[]>;
  createStoreVisit(visit: InsertStoreVisit): Promise<StoreVisit>;
  
  // Passkey operations
  getPasskeyCredentials(userId: string): Promise<PasskeyCredential[]>;
  getPasskeyCredential(id: string): Promise<PasskeyCredential | undefined>;
  createPasskeyCredential(credential: InsertPasskeyCredential): Promise<PasskeyCredential>;
  updatePasskeyCounter(id: string, counter: number): Promise<void>;
  
  // Coin transaction operations
  getCoinTransactions(userId: string): Promise<CoinTransaction[]>;
  createCoinTransaction(transaction: InsertCoinTransaction): Promise<CoinTransaction>;
  transferCoins(fromUserId: string, toUserId: string, amount: number, message?: string): Promise<CoinTransaction>;
  getCoinBalance(userId: string): Promise<number>;
  
  // Address book operations
  getAddressBook(userId: string): Promise<AddressBookEntry[]>;
  addToAddressBook(entry: InsertAddressBookEntry): Promise<AddressBookEntry>;
  updateAddressBookEntry(id: string, updates: Partial<InsertAddressBookEntry>): Promise<AddressBookEntry>;
  removeFromAddressBook(id: string): Promise<void>;
  findAddressBookEntry(userId: string, recipientId: string): Promise<AddressBookEntry | undefined>;
  
  // NFT operations
  getUserNfts(userId: string): Promise<(UserNft & { nft: NftCollection })[]>;
  getAllNfts(): Promise<NftCollection[]>;
  createNft(nft: InsertNftCollection): Promise<NftCollection>;
  awardNftToUser(userId: string, nftId: string, reason?: string, metadata?: any): Promise<UserNft>;
  getUserNftCount(userId: string): Promise<number>;

  // Announcement operations
  getActiveAnnouncements(): Promise<Announcement[]>;
  getAnnouncementsForUser(userId: string): Promise<Announcement[]>;
  createAnnouncement(announcementData: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, announcementData: Partial<InsertAnnouncement>): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<void>;

  // Favorite store operations
  getFavoriteStores(userId: string): Promise<(FavoriteStore & { store: { id: string; name: string; }})[]>;
  addFavoriteStore(userId: string, storeId: string): Promise<FavoriteStore>;
  removeFavoriteStore(userId: string, storeId: string): Promise<void>;
  isFavoriteStore(userId: string, storeId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPoints(userId: string, pointsReward: { 
    experience?: number; 
    loyalty?: number; 
    coins?: number; 
    gems?: number; 
  }): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const newExperience = (user.experiencePoints || 0) + (pointsReward.experience || 0);
    const newLoyalty = (user.loyaltyPoints || 0) + (pointsReward.loyalty || 0);
    const newCoins = (user.coins || 0) + (pointsReward.coins || 0);
    const newGems = (user.gems || 0) + (pointsReward.gems || 0);
    
    // Calculate level (100 XP per level)
    const newLevel = Math.floor(newExperience / 100) + 1;
    
    // Calculate rank based on loyalty points
    let newRank = "ブロンズ";
    if (newLoyalty >= 10000) newRank = "プラチナ";
    else if (newLoyalty >= 5000) newRank = "ゴールド"; 
    else if (newLoyalty >= 1000) newRank = "シルバー";
    
    const [updatedUser] = await db
      .update(users)
      .set({
        experiencePoints: newExperience,
        loyaltyPoints: newLoyalty,
        coins: newCoins,
        gems: newGems,
        level: newLevel,
        rank: newRank,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async updateUserProfile(userId: string, profileData: { nickname?: string; userId?: string }): Promise<User> {
    // Check if userId is already taken by another user
    if (profileData.userId) {
      const existingUser = await db
        .select()
        .from(users)
        .where(and(
          eq(users.userId, profileData.userId),
          ne(users.id, userId)
        ));
      
      if (existingUser.length > 0) {
        throw new Error('このユーザーIDは既に使用されています');
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({ 
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) throw new Error('User not found');
    return updatedUser;
  }

  // Store operations
  async getStores(): Promise<Store[]> {
    return await db.select().from(stores);
  }

  async getStoreByQrCode(qrCode: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.qrCode, qrCode));
    return store;
  }

  async createStore(storeData: InsertStore): Promise<Store> {
    const [store] = await db.insert(stores).values(storeData).returning();
    return store;
  }

  // Point transaction operations
  async getPointTransactions(userId: string): Promise<PointTransaction[]> {
    return await db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(desc(pointTransactions.createdAt))
      .limit(50);
  }

  async createPointTransaction(transactionData: InsertPointTransaction): Promise<PointTransaction> {
    const [transaction] = await db
      .insert(pointTransactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  // Store visit operations
  async getStoreVisits(userId: string): Promise<StoreVisit[]> {
    return await db
      .select()
      .from(storeVisits)
      .where(eq(storeVisits.userId, userId))
      .orderBy(desc(storeVisits.createdAt))
      .limit(50);
  }

  async createStoreVisit(visitData: InsertStoreVisit): Promise<StoreVisit> {
    const [visit] = await db.insert(storeVisits).values(visitData).returning();
    return visit;
  }

  // Passkey operations
  async getPasskeyCredentials(userId: string): Promise<PasskeyCredential[]> {
    return await db
      .select()
      .from(passkeyCredentials)
      .where(eq(passkeyCredentials.userId, userId));
  }

  async getPasskeyCredential(id: string): Promise<PasskeyCredential | undefined> {
    const [credential] = await db
      .select()
      .from(passkeyCredentials)
      .where(eq(passkeyCredentials.id, id));
    return credential;
  }

  async createPasskeyCredential(credentialData: InsertPasskeyCredential): Promise<PasskeyCredential> {
    const [credential] = await db
      .insert(passkeyCredentials)
      .values(credentialData)
      .returning();
    return credential;
  }

  async updatePasskeyCounter(id: string, counter: number): Promise<void> {
    await db
      .update(passkeyCredentials)
      .set({ counter })
      .where(eq(passkeyCredentials.id, id));
  }
  
  // Coin transaction operations
  async getCoinTransactions(userId: string): Promise<CoinTransaction[]> {
    return await db
      .select()
      .from(coinTransactions)
      .where(
        and(
          eq(coinTransactions.toUserId, userId),
          eq(coinTransactions.status, "completed")
        )
      )
      .orderBy(desc(coinTransactions.createdAt))
      .limit(50);
  }

  async createCoinTransaction(transactionData: InsertCoinTransaction): Promise<CoinTransaction> {
    const [transaction] = await db
      .insert(coinTransactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async transferCoins(fromUserId: string, toUserId: string, amount: number, message?: string): Promise<CoinTransaction> {
    // Check if sender has enough coins
    const fromUser = await this.getUser(fromUserId);
    if (!fromUser || (fromUser.coins || 0) < amount) {
      throw new Error('コインが不足しています');
    }

    // Check if recipient exists
    const toUser = await this.getUser(toUserId);
    if (!toUser) {
      throw new Error('送信先のユーザーが見つかりません');
    }

    // Deduct coins from sender
    await db
      .update(users)
      .set({ coins: (fromUser.coins || 0) - amount })
      .where(eq(users.id, fromUserId));

    // Add coins to recipient
    await db
      .update(users)
      .set({ coins: (toUser.coins || 0) + amount })
      .where(eq(users.id, toUserId));

    // Create transaction record
    const transaction = await this.createCoinTransaction({
      fromUserId,
      toUserId,
      amount,
      message,
      status: "completed",
      type: "transfer",
    });

    return transaction;
  }

  async getCoinBalance(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user?.coins || 0;
  }

  // Address book operations
  async getAddressBook(userId: string): Promise<AddressBookEntry[]> {
    return await db
      .select()
      .from(addressBook)
      .where(eq(addressBook.userId, userId))
      .orderBy(desc(addressBook.isFavorite), desc(addressBook.createdAt));
  }

  async addToAddressBook(entryData: InsertAddressBookEntry): Promise<AddressBookEntry> {
    // Check if entry already exists
    const existing = await this.findAddressBookEntry(entryData.userId!, entryData.recipientUserId!);
    if (existing) {
      throw new Error('このユーザーは既にアドレス帳に登録されています');
    }

    const [entry] = await db
      .insert(addressBook)
      .values(entryData)
      .returning();
    return entry;
  }

  async updateAddressBookEntry(id: string, updates: Partial<InsertAddressBookEntry>): Promise<AddressBookEntry> {
    const [entry] = await db
      .update(addressBook)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(addressBook.id, id))
      .returning();
    return entry;
  }

  async removeFromAddressBook(id: string): Promise<void> {
    await db
      .delete(addressBook)
      .where(eq(addressBook.id, id));
  }

  async findAddressBookEntry(userId: string, recipientId: string): Promise<AddressBookEntry | undefined> {
    const [entry] = await db
      .select()
      .from(addressBook)
      .where(
        and(
          eq(addressBook.userId, userId),
          eq(addressBook.recipientUserId, recipientId)
        )
      );
    return entry;
  }

  // NFT operations
  async getUserNfts(userId: string): Promise<(UserNft & { nft: NftCollection })[]> {
    const results = await db
      .select({
        id: userNfts.id,
        userId: userNfts.userId,
        nftId: userNfts.nftId,
        obtainedAt: userNfts.obtainedAt,
        obtainedReason: userNfts.obtainedReason,
        metadata: userNfts.metadata,
        nft: {
          id: nftCollection.id,
          name: nftCollection.name,
          description: nftCollection.description,
          imageUrl: nftCollection.imageUrl,
          category: nftCollection.category,
          rarity: nftCollection.rarity,
          isActive: nftCollection.isActive,
          createdAt: nftCollection.createdAt,
        }
      })
      .from(userNfts)
      .innerJoin(nftCollection, eq(userNfts.nftId, nftCollection.id))
      .where(eq(userNfts.userId, userId))
      .orderBy(desc(userNfts.obtainedAt));

    return results.map(result => ({
      id: result.id,
      userId: result.userId,
      nftId: result.nftId,
      obtainedAt: result.obtainedAt,
      obtainedReason: result.obtainedReason,
      metadata: result.metadata,
      nft: result.nft
    }));
  }

  async getAllNfts(): Promise<NftCollection[]> {
    return await db
      .select()
      .from(nftCollection)
      .where(eq(nftCollection.isActive, true))
      .orderBy(desc(nftCollection.createdAt));
  }

  async createNft(nftData: InsertNftCollection): Promise<NftCollection> {
    const [nft] = await db
      .insert(nftCollection)
      .values(nftData)
      .returning();
    return nft;
  }

  async awardNftToUser(userId: string, nftId: string, reason?: string, metadata?: any): Promise<UserNft> {
    const [userNft] = await db
      .insert(userNfts)
      .values({
        userId,
        nftId,
        obtainedReason: reason,
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .returning();
    return userNft;
  }

  async getUserNftCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(userNfts)
      .where(eq(userNfts.userId, userId));
    return result[0]?.count || 0;
  }

  // Announcement operations
  async getActiveAnnouncements(): Promise<Announcement[]> {
    const now = new Date();
    return await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.isActive, true),
          sql`(${announcements.endDate} IS NULL OR ${announcements.endDate} > ${now})`
        )
      )
      .orderBy(desc(announcements.priority), desc(announcements.createdAt));
  }

  async createAnnouncement(announcementData: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db
      .insert(announcements)
      .values(announcementData)
      .returning();
    return announcement;
  }

  async updateAnnouncement(id: string, announcementData: Partial<InsertAnnouncement>): Promise<Announcement> {
    const [announcement] = await db
      .update(announcements)
      .set({
        ...announcementData,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();
    return announcement;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await db
      .delete(announcements)
      .where(eq(announcements.id, id));
  }

  async getAnnouncementsForUser(userId: string): Promise<Announcement[]> {
    // Get user's favorite stores
    const favoriteStoreIds = await db
      .select({ storeId: favoriteStores.storeId })
      .from(favoriteStores)
      .where(eq(favoriteStores.userId, userId));

    const favoriteStoreIdList = favoriteStoreIds.map(fs => fs.storeId);

    const now = new Date();
    return await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.isActive, true),
          sql`(${announcements.endDate} IS NULL OR ${announcements.endDate} > ${now})`,
          favoriteStoreIdList.length > 0 
            ? sql`(${announcements.storeId} IS NULL OR ${announcements.storeId} = ANY(ARRAY[${favoriteStoreIdList.map(id => `'${id}'`).join(',')}]))`
            : sql`${announcements.storeId} IS NULL`
        )
      )
      .orderBy(desc(announcements.priority), desc(announcements.createdAt));
  }

  async getAnnouncementsByStore(storeId: string): Promise<Announcement[]> {
    const now = new Date();
    return await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.isActive, true),
          eq(announcements.storeId, storeId),
          sql`(${announcements.endDate} IS NULL OR ${announcements.endDate} > ${now})`
        )
      )
      .orderBy(desc(announcements.priority), desc(announcements.createdAt));
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    return result[0]?.count || 0;
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        isRead: true,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        isRead: true,
        updatedAt: new Date()
      })
      .where(eq(notifications.userId, userId));
  }

  // Favorite store operations
  async getFavoriteStores(userId: string): Promise<(FavoriteStore & { store: { id: string; name: string; }})[]> {
    const results = await db
      .select({
        id: favoriteStores.id,
        userId: favoriteStores.userId,
        storeId: favoriteStores.storeId,
        createdAt: favoriteStores.createdAt,
        store: {
          id: stores.id,
          name: stores.name,
        }
      })
      .from(favoriteStores)
      .innerJoin(stores, eq(favoriteStores.storeId, stores.id))
      .where(eq(favoriteStores.userId, userId))
      .orderBy(desc(favoriteStores.createdAt));

    return results;
  }

  async addFavoriteStore(userId: string, storeId: string): Promise<FavoriteStore> {
    const [favoriteStore] = await db
      .insert(favoriteStores)
      .values({
        userId,
        storeId,
      })
      .onConflictDoNothing()
      .returning();
    return favoriteStore;
  }

  async removeFavoriteStore(userId: string, storeId: string): Promise<void> {
    await db
      .delete(favoriteStores)
      .where(
        and(
          eq(favoriteStores.userId, userId),
          eq(favoriteStores.storeId, storeId)
        )
      );
  }

  async isFavoriteStore(userId: string, storeId: string): Promise<boolean> {
    const result = await db
      .select({ id: favoriteStores.id })
      .from(favoriteStores)
      .where(
        and(
          eq(favoriteStores.userId, userId),
          eq(favoriteStores.storeId, storeId)
        )
      );
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
