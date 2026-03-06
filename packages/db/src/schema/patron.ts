import {
  pgTable,
  serial,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { content } from './content.js';

// ─── Patron Questions ─────────────────────────────────────────────────────────
// "I saw something on Netflix once with a red couch — what was it?"
// Users post vague content queries; the community (and AI) help solve them.

export const patronQuestions = pgTable(
  'patron_questions',
  {
    id: serial('id').primaryKey(),
    asker_user_id: uuid('asker_user_id').notNull(),
    query_text: text('query_text').notNull(),
    hints: jsonb('hints').$type<Record<string, unknown>>(),           // platform, era, genre hints
    ai_rejected_matches: jsonb('ai_rejected_matches').$type<string[]>(), // content IDs AI ruled out
    // status: open | solved | expired
    status: text('status').notNull().default('open'),
    solved_by_user_id: uuid('solved_by_user_id'),
    solved_content_id: uuid('solved_content_id'),
    // visibility: friends | extended | public
    visibility: text('visibility').notNull().default('friends'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    solved_at: timestamp('solved_at', { withTimezone: true }),
    expires_at: timestamp('expires_at', { withTimezone: true }),
  },
  (t) => ({
    askerIdx: index('patron_questions_asker_idx').on(t.asker_user_id),
    statusIdx: index('patron_questions_status_idx').on(t.status),
    askerFk: foreignKey({ columns: [t.asker_user_id], foreignColumns: [users.id] }),
    solvedByFk: foreignKey({ columns: [t.solved_by_user_id], foreignColumns: [users.id] }),
    solvedContentFk: foreignKey({ columns: [t.solved_content_id], foreignColumns: [content.id] }),
  })
);

// ─── Patron Answers ───────────────────────────────────────────────────────────
// Community-submitted candidate answers to patron questions.

export const patronAnswers = pgTable(
  'patron_answers',
  {
    id: serial('id').primaryKey(),
    question_id: serial('question_id').notNull(),
    answerer_user_id: uuid('answerer_user_id').notNull(),
    content_id: uuid('content_id').notNull(),
    note: text('note'),
    // status: pending | accepted | rejected | close_but_no
    status: text('status').notNull().default('pending'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    questionIdx: index('patron_answers_question_idx').on(t.question_id),
    answererIdx: index('patron_answers_answerer_idx').on(t.answerer_user_id),
    questionFk: foreignKey({ columns: [t.question_id], foreignColumns: [patronQuestions.id] }),
    answererFk: foreignKey({ columns: [t.answerer_user_id], foreignColumns: [users.id] }),
    contentFk: foreignKey({ columns: [t.content_id], foreignColumns: [content.id] }),
  })
);

export type DbPatronQuestion = typeof patronQuestions.$inferSelect;
export type DbPatronQuestionInsert = typeof patronQuestions.$inferInsert;
export type DbPatronAnswer = typeof patronAnswers.$inferSelect;
