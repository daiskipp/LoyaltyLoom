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
  firstName: varchar("first_name"), // Keep for Replit Auth compatibility
  lastName: varchar("last_name"),   // Keep for Replit Auth compatibility
  nickname: varchar("nickname"),    // User's chosen display name
  userId: varchar("user_id").unique(), // User's chosen alphanumeric ID
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
  addressBookEntries: many(addressBook, { relationName: "addressBookEntries" }),
  nfts: many(userNfts),
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
  nickname: true,
  userId: true,
}).extend({
  nickname: z.string().min(1, "ニックネームを入力してください").max(30, "ニックネームは30文字以内で入力してください"),
  userId: z.string()
    .min(3, "ユーザーIDは3文字以上で入力してください")
    .max(20, "ユーザーIDは20文字以内で入力してください")
    .regex(/^[a-zA-Z0-9_]+$/, "ユーザーIDは英数字とアンダースコアのみ使用できます"),
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

// Address book for coin transfers
export const addressBook = pgTable("address_book", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  recipientUserId: varchar("recipient_user_id").notNull().references(() => users.id),
  nickname: varchar("nickname", { length: 100 }).notNull(),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NFT collection
export const nftCollection = pgTable("nft_collection", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  category: varchar("category").notNull().default("event"), // event, levelup, achievement, special
  rarity: varchar("rarity").notNull().default("common"), // common, rare, epic, legendary
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User NFT ownership
export const userNfts = pgTable("user_nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  nftId: varchar("nft_id").notNull().references(() => nftCollection.id),
  obtainedAt: timestamp("obtained_at").defaultNow(),
  obtainedReason: varchar("obtained_reason"), // "level_up", "event_participation", "achievement", etc.
  metadata: text("metadata"), // JSON string for additional data
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

export const addressBookRelations = relations(addressBook, ({ one }) => ({
  user: one(users, {
    fields: [addressBook.userId],
    references: [users.id],
    relationName: "addressBookEntries",
  }),
  recipient: one(users, {
    fields: [addressBook.recipientUserId],
    references: [users.id],
    relationName: "addressBookRecipient",
  }),
}));

export const nftCollectionRelations = relations(nftCollection, ({ many }) => ({
  userNfts: many(userNfts),
}));

export const userNftsRelations = relations(userNfts, ({ one }) => ({
  user: one(users, {
    fields: [userNfts.userId],
    references: [users.id],
  }),
  nft: one(nftCollection, {
    fields: [userNfts.nftId],
    references: [nftCollection.id],
  }),
}));



export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type InsertCoinTransaction = typeof coinTransactions.$inferInsert;
export type AddressBookEntry = typeof addressBook.$inferSelect;
export type InsertAddressBookEntry = typeof addressBook.$inferInsert;
export type NftCollection = typeof nftCollection.$inferSelect;
export type InsertNftCollection = typeof nftCollection.$inferInsert;
export type UserNft = typeof userNfts.$inferSelect;
export type InsertUserNft = typeof userNfts.$inferInsert;
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
