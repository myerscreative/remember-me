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
        // Redirect directly to reset-password page which handles the code exchange client-side
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          formData.email,
          {
            redirectTo: `${window.location.origin}/reset-password`,
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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-lg shadow-lg p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">ReMember Me</h1>
            <p className="text-text-secondary">
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
              <Label htmlFor="email" className="text-sm font-medium text-text-secondary">
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
                <Label htmlFor="password" className="text-sm font-medium text-text-secondary">
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
                  <p className="mt-1 text-xs text-text-tertiary">
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
              {isLoading && !isSignUp && !isResetPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isResetPassword ? "Sending reset link..." : isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                isResetPassword ? "Send Reset Link" : isSignUp ? "Sign Up" : "Sign In"
              )}
            </Button>

            {!isResetPassword && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border-strong" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-surface px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 border-border-strong hover:bg-subtle"
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        const supabase = createClient();
                        const { error } = await supabase.auth.signInWithOAuth({
                          provider: 'google',
                          options: {
                            redirectTo: `${window.location.origin}/auth/callback`,
                          },
                        });
                        if (error) throw error;
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "An error occurred with Google Sign In");
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 border-border-strong hover:bg-subtle"
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        const supabase = createClient();
                        const { error } = await supabase.auth.signInWithOAuth({
                          provider: 'azure',
                          options: {
                            redirectTo: `${window.location.origin}/auth/callback`,
                            scopes: 'openid profile email offline_access Calendars.Read'
                          },
                        });
                        if (error) throw error;
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "An error occurred with Microsoft Sign In");
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/>
                    </svg>
                    Microsoft
                  </Button>
                </div>
              </>
            )}
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
          <Link href="/" className="text-sm text-text-secondary hover:text-text-primary">
            ← Back to app
          </Link>
        </div>

        {/* Dev Login Button - ONLY VISIBLE IN DEVELOPMENT */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 pt-4 border-t border-border-default text-center">
            <p className="text-xs text-text-tertiary mb-2 uppercase tracking-wide font-semibold">Development Only</p>
            <Button
              type="button"
              variant="secondary"
              className="w-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
              onClick={async () => {
                 try {
                  setIsLoading(true);
                  const supabase = createClient();
                  const devEmail = "dev@example.com";
                  const devPassword = "password123";

                  // Attempt sign in
                  const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email: devEmail,
                    password: devPassword,
                  });

                  if (signInError) {
                    // If sign in fails, try sign up
                    if (process.env.NODE_ENV === 'development') console.log("Dev sign in failed, attempting sign up...", signInError);
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                      email: devEmail,
                      password: devPassword,
                    });
                    
                    if (signUpError) {
                       throw signUpError;
                    }
                    
                    if (signUpData.user) {
                       // Login after sign up
                       router.push(redirect);
                       router.refresh();
                    }
                  } else if (data.user) {
                    router.push(redirect);
                    router.refresh();
                  }
                 } catch (err) {
                   setError(err instanceof Error ? err.message : "Dev login failed");
                   setIsLoading(false);
                 }
              }}
              disabled={isLoading}
            >
              🚀 Quick Dev Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

