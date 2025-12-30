CREATE TABLE IF NOT EXISTS "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_subscription_price_id" text,
	"stripe_subscription_status" text,
	"stripe_subscription_current_period_end" bigint,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"revision_id" uuid,
	"created_by" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"created_by" text NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"created_by" text NOT NULL,
	"version_label" text NOT NULL,
	"comment" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "todo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_config" ADD CONSTRAINT "project_config_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_config" ADD CONSTRAINT "project_config_revision_id_revision_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."revision"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project" ADD CONSTRAINT "project_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "revision" ADD CONSTRAINT "revision_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "stripe_customer_id_idx" ON "organization" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_config_project_idx" ON "project_config" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "project_config_project_revision_uq" ON "project_config" USING btree ("project_id","revision_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_org_idx" ON "project" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_org_updated_idx" ON "project" USING btree ("organization_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "project_org_name_uq" ON "project" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revision_project_idx" ON "revision" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revision_project_created_idx" ON "revision" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "revision_project_version_uq" ON "revision" USING btree ("project_id","version_label");