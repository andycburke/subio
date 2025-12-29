import {
  bigint,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// This file defines the structure of your database tables using the Drizzle ORM.
//
// To modify the database schema:
// 1. Update this file with your desired changes.
// 2. Generate a new migration by running: `npm run db:generate`
//
// The generated migration file will reflect your schema changes.
// The migration is automatically applied during the next database interaction,
// so there's no need to run it manually or restart the Next.js server.
//
// Need a database for production? Check out https://www.prisma.io/?via=saasboilerplatesrc
// Tested and compatible with Next.js Boilerplate

export const organizationSchema = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeSubscriptionPriceId: text('stripe_subscription_price_id'),
    stripeSubscriptionStatus: text('stripe_subscription_status'),
    stripeSubscriptionCurrentPeriodEnd: bigint(
      'stripe_subscription_current_period_end',
      { mode: 'number' },
    ),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    stripeCustomerIdIdx: uniqueIndex('stripe_customer_id_idx').on(
      table.stripeCustomerId,
    ),
  }),
);

export const todoSchema = pgTable('todo', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: text('owner_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const projectSchema = pgTable(
  'project',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    organizationId: text('organization_id')
      .notNull()
      // FK to organization.id (text)
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),

    createdBy: text('created_by').notNull(), // likely user id (Clerk/etc.)
    name: text('name').notNull(),

    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    orgIdx: index('project_org_idx').on(table.organizationId),
    updatedIdx: index('project_org_updated_idx').on(
      table.organizationId,
      table.updatedAt,
    ),
    orgNameUnique: uniqueIndex('project_org_name_uq').on(
      table.organizationId,
      table.name,
    ),
  }),
);

export const revisionSchema = pgTable(
  'revision',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    projectId: uuid('project_id')
      .notNull()
      .references(() => projectSchema.id, { onDelete: 'cascade' }),

    createdBy: text('created_by').notNull(),
    versionLabel: text('version_label').notNull(),
    comment: text('comment'),

    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    projectIdx: index('revision_project_idx').on(table.projectId),
    latestIdx: index('revision_project_created_idx').on(
      table.projectId,
      table.createdAt,
    ),
    versionUnique: uniqueIndex('revision_project_version_uq').on(
      table.projectId,
      table.versionLabel,
    ),
  }),
);

export const projectConfigSchema = pgTable(
  'project_config',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    projectId: uuid('project_id')
      .notNull()
      .references(() => projectSchema.id, { onDelete: 'cascade' }),

    revisionId: uuid('revision_id')
      .references(() => revisionSchema.id, { onDelete: 'set null' }),

    createdBy: text('created_by').notNull(),

    data: jsonb('data').notNull(),

    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    projectIdx: index('project_config_project_idx').on(table.projectId),
    projectRevisionUq: uniqueIndex('project_config_project_revision_uq').on(
      table.projectId,
      table.revisionId,
    ),
  }),
);
