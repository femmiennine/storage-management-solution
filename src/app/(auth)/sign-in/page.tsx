import { AuthForm } from '@/components/forms/AuthForm';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AuthForm type="sign-in" />
    </div>
  );
}