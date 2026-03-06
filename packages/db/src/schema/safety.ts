import {
  pgTable,
  serial,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

// ─── Consent Records ──────────────────────────────────────────────────────────
// Granular per-feature consent tracking. Required for COPPA/GDPR compliance
// and to satisfy App Store privacy guidelines.

export const consentRecords = pgTable(
  'consent_records',
  {
    id: serial('id').primaryKey(),
    user_id: uuid('user_id').notNull(),
    // consent_type examples: screenshot_processing | camera_access | mic_access |
    //   push_notifications | youtube_import | instagram_import | tiktok_import |
    //   netflix_import | twitter_import | clip_upload | social_sharing
    consent_type: text('consent_type').notNull(),
    granted: boolean('granted').notNull(),
    granted_at: timestamp('granted_at', { withTimezone: true }),
    revoked_at: timestamp('revoked_at', { withTimezone: true }),
    consent_version: text('consent_version').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('consent_records_user_idx').on(t.user_id),
    userTypIdx: index('consent_records_user_type_idx').on(t.user_id, t.consent_type),
    userFk: foreignKey({ columns: [t.user_id], foreignColumns: [users.id] }),
  })
);

// ─── Content Reports ──────────────────────────────────────────────────────────
// User-submitted moderation reports for any user-generated content item.

export const contentReports = pgTable(
  'content_reports',
  {
    id: serial('id').primaryKey(),
    reporter_user_id: uuid('reporter_user_id').notNull(),
    // target_type: watch_entry | clip | comment | patron_question | patron_answer | collection
    target_type: text('target_type').notNull(),
    target_id: serial('target_id').notNull(),
    // category: spam | harassment | hate_speech | sexual_content | copyright |
    //   spoiler_abuse | impersonation | other
    category: text('category').notNull(),
    description: text('description'),
    // status: pending | reviewed | actioned | dismissed
    status: text('status').notNull().default('pending'),
    // action_taken: content_removed | warning_sent | user_suspended | user_banned | no_action
    action_taken: text('action_taken'),
    reviewed_by: text('reviewed_by'),   // admin user id (text, not FK)
    reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    reporterIdx: index('content_reports_reporter_idx').on(t.reporter_user_id),
    statusIdx: index('content_reports_status_idx').on(t.status),
    targetIdx: index('content_reports_target_idx').on(t.target_type, t.target_id),
    reporterFk: foreignKey({ columns: [t.reporter_user_id], foreignColumns: [users.id] }),
  })
);

export type DbConsentRecord = typeof consentRecords.$inferSelect;
export type DbConsentRecordInsert = typeof consentRecords.$inferInsert;
export type DbContentReport = typeof contentReports.$inferSelect;
