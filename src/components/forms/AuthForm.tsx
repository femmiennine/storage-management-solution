"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createAccount, loginUser, getCurrentUser } from '@/lib/actions/user.actions';

const authFormSchema = (type: 'sign-in' | 'sign-up') => {
  return z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    ...(type === 'sign-up' && {
      fullName: z.string().min(2, 'Name must be at least 2 characters'),
    }),
  });
};

interface AuthFormProps {
  type: 'sign-in' | 'sign-up';
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const formSchema = authFormSchema(type);
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(type === 'sign-up' && { fullName: '' }),
    },
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          router.push('/dashboard');
        }
      } catch (error) {
        // User not logged in, continue
      }
    };
    checkUser();
  }, [router]);

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setError('');

    try {
      if (type === 'sign-up' && 'fullName' in data) {
        await createAccount({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
        });
      } else {
        await loginUser({
          email: data.email,
          password: data.password,
        });
      }
      
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">
          {type === 'sign-in' ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {type === 'sign-in'
            ? 'Sign in to your account to continue'
            : 'Get started with your free account'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {type === 'sign-up' && (
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {type === 'sign-in' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              <>{type === 'sign-in' ? 'Sign in' : 'Sign up'}</>
            )}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        {type === 'sign-in' ? (
          <>
            Don't have an account?{' '}
            <Link href="/sign-up" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}