import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  experiencePoints: integer("experience_points").default(0), // 経験値 (XP)
  loyaltyPoints: integer("loyalty_points").default(0),       // ロイヤルティポイント
  coins: integer("coins").default(100),                      // ゲーム内コイン (初期値100)
  gems: integer("gems").default(0),                          // プレミアムジェム
  level: integer("level").default(1),                        // レベル
  rank: varchar("rank").default("ブロンズ"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stores table
export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  address: text("address"),
  qrCode: varchar("qr_code").unique().notNull(),
  experiencePerVisit: integer("experience_per_visit").default(25),
  loyaltyPerVisit: integer("loyalty_per_visit").default(50),
  coinsPerVisit: integer("coins_per_visit").default(10),
  gemsPerVisit: integer("gems_per_visit").default(1),
  storeType: varchar("store_type").default("regular"), // regular, premium, special
  createdAt: timestamp("created_at").defaultNow(),
});

// Point transactions
export const pointTransactions = pgTable("point_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  storeId: varchar("store_id").references(() => stores.id),
  experiencePoints: integer("experience_points").default(0),
  loyaltyPoints: integer("loyalty_points").default(0),
  coins: integer("coins").default(0),
  gems: integer("gems").default(0),
  type: varchar("type").notNull(), // 'checkin', 'bonus', 'redeem', 'level_up'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Store visits
export const storeVisits = pgTable("store_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  storeId: varchar("store_id").notNull().references(() => stores.id),
  experienceEarned: integer("experience_earned").default(0),
  loyaltyEarned: integer("loyalty_earned").default(0),
  coinsEarned: integer("coins_earned").default(0),
  gemsEarned: integer("gems_earned").default(0),
  levelBefore: integer("level_before").default(1),
  levelAfter: integer("level_after").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Passkey credentials
export const passkeyCredentials = pgTable("passkey_credentials", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  pointTransactions: many(pointTransactions),
  storeVisits: many(storeVisits),
  passkeyCredentials: many(passkeyCredentials),
  sentCoinTransactions: many(coinTransactions, { relationName: "sentTransactions" }),
  receivedCoinTransactions: many(coinTransactions, { relationName: "receivedTransactions" }),
}));

export const storesRelations = relations(stores, ({ many }) => ({
  pointTransactions: many(pointTransactions),
  storeVisits: many(storeVisits),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointTransactions.userId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [pointTransactions.storeId],
    references: [stores.id],
  }),
}));

export const storeVisitsRelations = relations(storeVisits, ({ one }) => ({
  user: one(users, {
    fields: [storeVisits.userId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [storeVisits.storeId],
    references: [stores.id],
  }),
}));

export const passkeyCredentialsRelations = relations(passkeyCredentials, ({ one }) => ({
  user: one(users, {
    fields: [passkeyCredentials.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
});

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertStoreVisitSchema = createInsertSchema(storeVisits).omit({
  id: true,
  createdAt: true,
});

export const insertPasskeyCredentialSchema = createInsertSchema(passkeyCredentials).omit({
  createdAt: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
}).extend({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Types
// Coin transactions table for user-to-user transfers
export const coinTransactions = pgTable("coin_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  message: varchar("message", { length: 500 }),
  status: varchar("status").notNull().default("completed"), // completed, pending, cancelled
  type: varchar("type").notNull().default("transfer"), // transfer, gift, reward
  createdAt: timestamp("created_at").defaultNow(),
});

export const coinTransactionsRelations = relations(coinTransactions, ({ one }) => ({
  fromUser: one(users, {
    fields: [coinTransactions.fromUserId],
    references: [users.id],
    relationName: "sentTransactions",
  }),
  toUser: one(users, {
    fields: [coinTransactions.toUserId],
    references: [users.id],
    relationName: "receivedTransactions",
  }),
}));



export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type InsertCoinTransaction = typeof coinTransactions.$inferInsert;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;
export type StoreVisit = typeof storeVisits.$inferSelect;
export type InsertStoreVisit = z.infer<typeof insertStoreVisitSchema>;
export type PasskeyCredential = typeof passkeyCredentials.$inferSelect;
export type InsertPasskeyCredential = z.infer<typeof insertPasskeyCredentialSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
