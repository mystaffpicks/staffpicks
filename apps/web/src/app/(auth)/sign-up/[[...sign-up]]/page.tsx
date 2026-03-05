import { SignUp } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
};

export default function SignUpPage() {
  return <SignUp />;
}
