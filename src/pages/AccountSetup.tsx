import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import northstoneLogo from '@/assets/northstone-logo.jpeg';

const AccountSetup = () => {
  const [selectedType, setSelectedType] = useState<'personal' | 'organization' | null>(null);
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // If user already has a completed profile, redirect to dashboard
    if (profile?.account_type === 'organization_admin') {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  const handleContinue = async () => {
    if (!user || !selectedType) return;

    if (selectedType === 'personal') {
      // Update profile to personal type and navigate to dashboard
      await supabase
        .from('profiles')
        .update({ account_type: 'personal' })
        .eq('id', user.id);
      
      await refreshProfile();
      navigate('/dashboard');
    } else if (selectedType === 'organization') {
      navigate('/create-organization');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
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
          </div>
          <h1 className="text-3xl font-display font-bold">
            Welcome, {profile?.full_name || 'there'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            How would you like to use Unify?
          </p>
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedType('personal')}
            className={`p-6 rounded-2xl border-2 text-left transition-all ${
              selectedType === 'personal'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Personal Account</h3>
            <p className="text-sm text-muted-foreground">
              Use Unify for personal meetings, small team calls, and individual use.
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedType('organization')}
            className={`p-6 rounded-2xl border-2 text-left transition-all ${
              selectedType === 'organization'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Create Organization</h3>
            <p className="text-sm text-muted-foreground">
              Set up a workspace for your company or team with admin controls.
            </p>
          </motion.button>
        </div>

        {/* Continue Button */}
        <Button
          variant="hero"
          className="w-full mb-4"
          disabled={!selectedType}
          onClick={handleContinue}
        >
          <span className="flex items-center gap-2">
            Continue
            <ArrowRight className="h-4 w-4" />
          </span>
        </Button>

      </motion.div>
    </div>
  );
};

export default AccountSetup;
