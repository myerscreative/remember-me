"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push(redirect);
      }
    };
    checkAuth();
  }, [router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      if (isResetPassword) {
        // Send password reset email
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          formData.email,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
          }
        );

        if (resetError) {
          throw resetError;
        }

        setSuccessMessage("Password reset email sent! Check your inbox.");
        setIsLoading(false);
        return;
      }

      if (isSignUp) {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          // Provide more helpful error messages
          if (signUpError.message.includes("Invalid API key") || signUpError.message.includes("fetch")) {
            throw new Error("Supabase connection failed. Please check your .env.local file has valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
          }
          throw signUpError;
        }

        if (data.user) {
          // Check if email confirmation is required
          // If email_confirmed_at is null, user needs to confirm email
          if (data.user.email_confirmed_at) {
            // Email already confirmed, log them in
            router.push(redirect);
            router.refresh();
          } else {
            // Email confirmation required
            setError("Please check your email to confirm your account. After confirming, you can sign in.");
          }
        } else {
          throw new Error("Failed to create account");
        }
      } else {
        // Sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          // Provide more helpful error messages
          if (signInError.message.includes("Invalid API key") || signInError.message.includes("fetch")) {
            throw new Error("Supabase connection failed. Please check your .env.local file has valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
          }
          throw signInError;
        }

        if (data.user) {
          router.push(redirect);
          router.refresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">ReMember Me</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isResetPassword ? "Reset your password" : isSignUp ? "Create your account" : "Welcome back"}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="mt-1 h-11"
                disabled={isLoading}
              />
            </div>

            {!isResetPassword && (
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="mt-1 h-11"
                  disabled={isLoading}
                  minLength={6}
                />
                {isSignUp && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Password must be at least 6 characters
                  </p>
                )}
                {!isSignUp && (
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetPassword(true);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isResetPassword ? "Sending reset link..." : isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                isResetPassword ? "Send Reset Link" : isSignUp ? "Sign Up" : "Sign In"
              )}
            </Button>
          </form>

          {/* Toggle Sign Up/Sign In/Reset Password */}
          <div className="mt-6 text-center space-y-2">
            {isResetPassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsResetPassword(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                ← Back to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            )}
          </div>
        </div>

        {/* Back to app link */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
            ← Back to app
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

