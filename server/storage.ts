import {
  users,
  stores,
  pointTransactions,
  storeVisits,
  passkeyCredentials,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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

  async updateUserProfile(userId: string, profileData: { firstName?: string; lastName?: string }): Promise<User> {
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
}

export const storage = new DatabaseStorage();
