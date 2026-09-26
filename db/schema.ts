import {integer,sqliteTable,text,primaryKey} from 'drizzle-orm/sqlite-core';
export const financialProfiles=sqliteTable('financial_profiles',{userId:text('user_id').primaryKey(),data:text('data').notNull(),revision:integer('revision').notNull().default(0),updatedAt:text('updated_at').notNull()});
export const runwaySnapshots=sqliteTable('runway_snapshots',{userId:text('user_id').notNull(),date:text('date').notNull(),runway:integer('runway').notNull(),balance:integer('balance').notNull(),safe:integer('safe').notNull()},t=>[primaryKey({columns:[t.userId,t.date]})]);
export const auditEvents=sqliteTable('audit_events',{id:text('id').primaryKey(),userId:text('user_id').notNull(),action:text('action').notNull(),createdAt:text('created_at').notNull()});

export const setupDrafts=sqliteTable('setup_drafts',{userId:text('user_id').primaryKey(),data:text('data').notNull(),revision:integer('revision').notNull().default(1),updatedAt:text('updated_at').notNull()});
export const emailRecipients=sqliteTable('email_recipients',{userId:text('user_id').primaryKey(),email:text('email').notNull(),enabled:integer('enabled').notNull().default(0)});
export const emailDeliveries=sqliteTable('email_deliveries',{id:text('id').primaryKey(),userId:text('user_id').notNull(),status:text('status').notNull(),createdAt:text('created_at').notNull(),payload:text('payload').notNull(),providerId:text('provider_id')});
