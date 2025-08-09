CREATE TABLE "announcements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) DEFAULT 'info' NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"store_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp,
	"image_url" varchar,
	"action_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "favorite_stores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"store_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_store" UNIQUE("user_id","store_id")
);
--> statement-breakpoint
CREATE TABLE "nft_collection" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"image_url" varchar,
	"category" varchar DEFAULT 'event' NOT NULL,
	"rarity" varchar DEFAULT 'common' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"type" varchar DEFAULT 'info',
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_nfts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"nft_id" varchar NOT NULL,
	"obtained_at" timestamp DEFAULT now(),
	"obtained_reason" varchar,
	"metadata" text
);
--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "image_url" varchar;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "latitude" varchar;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "longitude" varchar;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "phone_number" varchar;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "website" varchar;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "business_hours" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "instagram_url" varchar;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "twitter_url" varchar;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "facebook_url" varchar;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "line_url" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nickname" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_id" varchar;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_stores" ADD CONSTRAINT "favorite_stores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_stores" ADD CONSTRAINT "favorite_stores_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_nfts" ADD CONSTRAINT "user_nfts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_nfts" ADD CONSTRAINT "user_nfts_nft_id_nft_collection_id_fk" FOREIGN KEY ("nft_id") REFERENCES "public"."nft_collection"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_user_id_unique" UNIQUE("user_id");