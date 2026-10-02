import { redirect } from 'next/navigation';

/**
 * Root "/" redirects to /dashboard.
 * The dashboard layout guard handles the auth check.
 */
export default function Home() {
  redirect('/dashboard');
}
