import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/server/auth';
import { SignInForm } from './SignInForm';

export default async function AdminLoginPage() {
  if (await isAuthenticated()) redirect('/admin');

  return (
    <div className="container-page">
      <div className="rounded-card border-line bg-surface shadow-card mx-auto mt-8 max-w-sm border p-7">
        <h1 className="font-display text-2xl font-extrabold">
          Béton<span className="text-accent">Dispo</span>
        </h1>
        <p className="text-ink-muted mt-1 text-sm">Accès interne</p>
        <SignInForm />
      </div>
    </div>
  );
}
