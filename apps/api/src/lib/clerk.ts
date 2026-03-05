import { createClerkClient } from '@clerk/backend';

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required');
}

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export type ClerkUser = {
  id: string;
  emailAddress: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  username: string | null;
};
