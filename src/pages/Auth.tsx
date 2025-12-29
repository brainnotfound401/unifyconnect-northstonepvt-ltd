import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import northstoneLogo from '@/assets/northstone-logo.jpeg';
import { z } from 'zod';

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(72),
});

const emailSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
});

type AuthMode = 'choice' | 'email-password' | 'email-otp' | 'otp-verify';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('choice');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signUp, signIn } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/account-setup');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/account-setup`,
        },
      });
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Sign in failed',
          description: error.message,
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const result = emailSchema.safeParse({ email: formData.email });
    if (!result.success) {
      setErrors({ email: result.error.errors[0].message });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to send code',
          description: error.message,
        });
      } else {
        toast({
          title: 'Verification code sent',
          description: 'Check your email for the 6-digit code.',
        });
        setAuthMode('otp-verify');
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid code',
        description: 'Please enter the 6-digit code.',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otpCode,
        type: 'email',
      });
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Verification failed',
          description: error.message,
        });
      } else {
        toast({
          title: 'Success!',
          description: 'You have been signed in.',
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isSignUp) {
        const result = signUpSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: 'destructive',
              title: 'Account exists',
              description: 'This email is already registered. Try signing in instead.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Sign up failed',
              description: error.message,
            });
          }
        } else {
          toast({
            title: 'Check your email',
            description: 'We sent you a confirmation link. Please verify your email.',
          });
        }
      } else {
        const result = signInSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Sign in failed',
            description: 'Invalid email or password. Please try again.',
          });
        }
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderAuthChoice = () => (
    <div className="space-y-4">
      {/* OAuth Providers */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 gap-3"
        onClick={() => handleOAuthSignIn('google')}
        disabled={loading}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
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
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 gap-3"
        onClick={() => handleOAuthSignIn('facebook')}
        disabled={loading}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Continue with Facebook
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 gap-3"
        onClick={() => setAuthMode('email-otp')}
      >
        <Mail className="h-5 w-5" />
        Email with Code Verification
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 gap-3"
        onClick={() => setAuthMode('email-password')}
      >
        <Lock className="h-5 w-5" />
        Email with Password
      </Button>
    </div>
  );

  const renderEmailOtp = () => (
    <div className="space-y-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setAuthMode('choice')}
        className="mb-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            className="pl-10"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <Button
        type="button"
        variant="hero"
        className="w-full"
        onClick={handleSendOtp}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block"
            />
            Sending code...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Send Verification Code
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  );

  const renderOtpVerify = () => (
    <div className="space-y-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setAuthMode('email-otp')}
        className="mb-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="text-center">
        <p className="text-muted-foreground text-sm mb-4">
          Enter the 6-digit code sent to<br />
          <span className="font-medium text-foreground">{formData.email}</span>
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={otpCode}
          onChange={setOtpCode}
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
        type="button"
        variant="hero"
        className="w-full"
        onClick={handleVerifyOtp}
        disabled={loading || otpCode.length !== 6}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block"
            />
            Verifying...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Verify & Sign In
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Didn't receive the code?{' '}
        <button
          type="button"
          onClick={handleSendOtp}
          className="text-primary hover:underline font-medium"
          disabled={loading}
        >
          Resend
        </button>
      </p>
    </div>
  );

  const renderEmailPassword = () => (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setAuthMode('choice')}
        className="mb-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {isSignUp && (
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              className="pl-10"
            />
          </div>
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            className="pl-10"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="hero"
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block"
            />
            {isSignUp ? 'Creating account...' : 'Signing in...'}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {isSignUp ? 'Create Account' : 'Sign In'}
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </Button>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrors({});
            }}
            className="text-primary hover:underline font-medium"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-secondary/30 items-center justify-center p-12">
        <div className="max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/" className="flex items-center gap-3 mb-8">
              <img
                src={northstoneLogo}
                alt="Northstone"
                className="h-14 w-14 rounded-xl object-cover"
              />
              <div className="flex flex-col">
                <span className="font-display text-3xl font-bold text-primary">
                  Unify
                </span>
                <span className="text-sm text-muted-foreground">
                  by Northstone Pvt. Ltd.
                </span>
              </div>
            </Link>
            
            <h1 className="text-4xl font-display font-bold mb-4">
              Connect, Collaborate, Communicate
            </h1>
            <p className="text-lg text-muted-foreground">
              Experience seamless video conferencing with crystal-clear audio, 
              HD video, and powerful collaboration tools for teams of any size.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-3">
              <img
                src={northstoneLogo}
                alt="Northstone"
                className="h-12 w-12 rounded-xl object-cover"
              />
              <div className="flex flex-col text-left">
                <span className="font-display text-2xl font-bold text-primary">
                  Unify
                </span>
                <span className="text-xs text-muted-foreground">
                  by Northstone Pvt. Ltd.
                </span>
              </div>
            </Link>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold">
                {authMode === 'otp-verify' 
                  ? 'Verify your email' 
                  : isSignUp && authMode === 'email-password'
                    ? 'Create your account'
                    : 'Welcome back'}
              </h2>
              <p className="text-muted-foreground mt-2">
                {authMode === 'otp-verify'
                  ? 'Enter the verification code'
                  : authMode === 'choice'
                    ? 'Choose how you want to sign in'
                    : isSignUp
                      ? 'Start your journey with Unify'
                      : 'Sign in to continue to Unify'}
              </p>
            </div>

            {authMode === 'choice' && renderAuthChoice()}
            {authMode === 'email-otp' && renderEmailOtp()}
            {authMode === 'otp-verify' && renderOtpVerify()}
            {authMode === 'email-password' && renderEmailPassword()}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
