import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { clerkClient } from '../lib/clerk.js';
import { db } from '@staffpicks/db';
import { users } from '@staffpicks/db/schema';
import { eq } from 'drizzle-orm';

export async function authRoutes(app: FastifyInstance) {
  /**
   * GET /api/auth/me
   * Returns the current user's profile, creating a DB record on first sign-in.
   */
  app.get(
    '/auth/me',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const clerkUserId = request.clerkUserId;

      // Look up existing user in our DB
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId))
        .limit(1);

      if (existingUser) {
        return reply.send({ user: existingUser });
      }

      // First sign-in — fetch from Clerk and create record
      const clerkUser = await clerkClient.users.getUser(clerkUserId);

      const primaryEmail = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ?? '';

      // Derive a username: use Clerk username or fall back to email prefix
      const baseUsername =
        clerkUser.username ??
        primaryEmail.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase();

      // Ensure username uniqueness with a short suffix if needed
      let username = baseUsername;
      const [collision] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (collision) {
        username = `${baseUsername}${Math.floor(Math.random() * 9000) + 1000}`;
      }

      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: clerkUserId,
          email: primaryEmail,
          username,
          displayName:
            [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
            username,
          avatarUrl: clerkUser.imageUrl || null,
          authProvider: clerkUser.externalAccounts[0]?.provider ?? 'email',
          onboardingCompleted: false,
        })
        .returning();

      return reply.code(201).send({ user: newUser });
    },
  );

  /**
   * PATCH /api/auth/me
   * Update the current user's profile (display name, bio, privacy, etc.)
   */
  app.patch(
    '/auth/me',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const clerkUserId = request.clerkUserId;

      const body = request.body as {
        displayName?: string;
        username?: string;
        bio?: string;
        privacyLevel?: 'public' | 'friends' | 'private';
        onboardingCompleted?: boolean;
        syncReminderTime?: string;
      };

      const [updated] = await db
        .update(users)
        .set({
          ...(body.displayName !== undefined && { displayName: body.displayName }),
          ...(body.username !== undefined && { username: body.username }),
          ...(body.bio !== undefined && { bio: body.bio }),
          ...(body.privacyLevel !== undefined && { privacyLevel: body.privacyLevel }),
          ...(body.onboardingCompleted !== undefined && {
            onboardingCompleted: body.onboardingCompleted,
          }),
          ...(body.syncReminderTime !== undefined && {
            syncReminderTime: body.syncReminderTime,
          }),
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkUserId))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send({ user: updated });
    },
  );
}
