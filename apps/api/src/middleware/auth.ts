import type { FastifyRequest, FastifyReply } from 'fastify';
import { createClerkClient } from '@clerk/backend';

declare module 'fastify' {
  interface FastifyRequest {
    clerkUserId: string;
    clerkUser?: {
      id: string;
      emailAddress: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string;
      username: string | null;
    };
  }
}

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Fastify preHandler hook — verifies Clerk JWT and populates request.clerkUserId
 * Throws 401 if token is missing or invalid.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = extractToken(request);

  if (!token) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header',
    });
  }

  try {
    const { sub } = await clerk.verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    if (!sub) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid token subject' });
    }

    request.clerkUserId = sub;
  } catch (err) {
    request.log.warn({ err }, 'Clerk token verification failed');
    return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

/**
 * Optional auth — populates request.clerkUserId if a valid token is present,
 * but does NOT block unauthenticated requests.
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const token = extractToken(request);
  if (!token) return;

  try {
    const { sub } = await clerk.verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    if (sub) request.clerkUserId = sub;
  } catch {
    // silently skip invalid tokens
  }
}
