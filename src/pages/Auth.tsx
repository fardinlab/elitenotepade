import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { z } from 'zod';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthView = 'login' | 'signup' | 'forgot' | 'verification' | 'reset-sent';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  
  const { user, signIn, signUp, signInWithGoogle, resetPassword, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check if this is a password reset callback
    if (searchParams.get('reset') === 'true') {
      // User has clicked password reset link - they can now set new password
      // For Supabase, this is handled automatically via the auth state
    }
  }, [searchParams]);

  const validateEmail = (): boolean => {
    try {
      emailSchema.parse(email);
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
        return false;
      }
    }
    return false;
  };

  const validateForm = (): boolean => {
    if (!validateEmail()) return false;
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
        return false;
      }
    }
    
    return true;
  };

  const getErrorMessage = (errorMessage: string): string => {
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (errorMessage.includes('Email not confirmed')) {
      return 'Please verify your email before logging in. Check your inbox.';
    }
    if (errorMessage.includes('User already registered')) {
      return 'This email is already registered. Please login instead.';
    }
    if (errorMessage.includes('Password should be')) {
      return 'Password must be at least 6 characters long.';
    }
    if (errorMessage.includes('rate limit')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    return errorMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (view === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(getErrorMessage(error.message));
        }
      } else if (view === 'signup') {
        const { error, needsVerification } = await signUp(email, password);
        if (error) {
          setError(getErrorMessage(error.message));
        } else if (needsVerification) {
          setView('verification');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateEmail()) return;
    
    setLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(getErrorMessage(error.message));
      } else {
        setView('reset-sent');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(getErrorMessage(error.message));
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error } = await verifyOtp(email, otpCode);
      if (error) {
        setError(getErrorMessage(error.message));
      } else {
        toast.success('Email verified successfully!');
        setView('login');
        setOtpCode('');
        setPassword('');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendLoading(true);

    try {
      const { error } = await resendOtp(email);
      if (error) {
        setError(getErrorMessage(error.message));
      } else {
        toast.success('Verification code resent! Check your inbox.');
        setOtpCode('');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Verification OTP view
  if (view === 'verification') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-2xl glass-card text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Verify Your Email</h2>
          <p className="text-muted-foreground">
            We've sent a 6-digit code to <span className="text-primary font-medium">{email}</span>
          </p>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* OTP Input */}
          <div className="flex justify-center">
            <InputOTP
              value={otpCode}
              onChange={setOtpCode}
              maxLength={6}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerifyOtp}
            disabled={loading || otpCode.length !== 6}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Verify Email'
            )}
          </Button>

          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {resendLoading ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                'Resend code'
              )}
            </button>
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              setView('login');
              setEmail('');
              setPassword('');
              setOtpCode('');
              setError('');
            }}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  // Password reset sent view
  if (view === 'reset-sent') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-2xl glass-card text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Check Your Email</h2>
          <p className="text-muted-foreground">
            We've sent a password reset link to <span className="text-primary font-medium">{email}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Click the link in the email to reset your password. The link will expire in 24 hours.
          </p>
          <Button
            onClick={() => {
              setView('login');
              setEmail('');
            }}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Back to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  // Forgot password view
  if (view === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-2xl glass-card space-y-6"
        >
          {/* Back button */}
          <button
            onClick={() => {
              setView('login');
              setError('');
            }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>

          {/* Logo */}
          <div className="flex justify-center">
            <img
              src={logo}
              alt="Logo"
              className="h-16 w-16 rounded-xl object-cover"
            />
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
            <p className="text-muted-foreground text-sm">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-input border-border focus:border-primary"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Main login/signup view
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl glass-card space-y-6"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src={logo}
            alt="Logo"
            className="h-16 w-16 rounded-xl object-cover"
          />
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {view === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {view === 'login'
              ? 'Sign in to access your dashboard'
              : 'Sign up to get started'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full bg-background border-border hover:bg-muted"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-input border-border focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              {view === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setView('forgot');
                    setError('');
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-input border-border focus:border-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : view === 'login' ? (
              'Sign In'
            ) : (
              'Sign Up'
            )}
          </Button>
        </form>

        {/* Toggle */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setView(view === 'login' ? 'signup' : 'login');
              setError('');
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {view === 'login' ? (
              <>Don't have an account? <span className="text-primary font-medium">Sign up</span></>
            ) : (
              <>Already have an account? <span className="text-primary font-medium">Sign in</span></>
            )}
          </button>
        </div>

        {view === 'signup' && (
          <p className="text-xs text-muted-foreground text-center">
            Email verification is required before you can log in.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;
