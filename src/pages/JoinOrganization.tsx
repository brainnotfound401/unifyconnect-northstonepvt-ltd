import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRight, Search, Building2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import northstoneLogo from '@/assets/northstone-logo.jpeg';

interface Organization {
  id: string;
  name: string;
  description: string | null;
}

interface Question {
  id: string;
  question: string;
  is_required: boolean;
}

const JoinOrganization = () => {
  const [step, setStep] = useState<'code' | 'questions' | 'success'>('code');
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleFindOrganization = async () => {
    if (!joinCode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Enter a code',
        description: 'Please enter an organization join code.',
      });
      return;
    }

    setLoading(true);

    try {
      // Find organization by join code
      const { data: org, error } = await supabase
        .from('organizations')
        .select('id, name, description')
        .eq('join_code', joinCode.toUpperCase().trim())
        .maybeSingle();

      if (error) throw error;

      if (!org) {
        toast({
          variant: 'destructive',
          title: 'Not found',
          description: 'No organization found with this code. Please check and try again.',
        });
        setLoading(false);
        return;
      }

      // Check if user already has a pending request or is a member
      const { data: existingRequest } = await supabase
        .from('join_requests')
        .select('status')
        .eq('organization_id', org.id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast({
            variant: 'destructive',
            title: 'Request pending',
            description: 'You already have a pending request to join this organization.',
          });
          setLoading(false);
          return;
        } else if (existingRequest.status === 'approved') {
          toast({
            title: 'Already a member',
            description: 'You are already a member of this organization.',
          });
          navigate('/dashboard');
          return;
        }
      }

      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', org.id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: 'Already a member',
          description: 'You are already a member of this organization.',
        });
        navigate('/dashboard');
        return;
      }

      setOrganization(org);

      // Get custom questions
      const { data: orgQuestions } = await supabase
        .from('organization_questions')
        .select('id, question, is_required')
        .eq('organization_id', org.id)
        .order('order_index');

      setQuestions(orgQuestions || []);
      setStep('questions');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to find organization',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!user || !organization) return;

    // Validate required questions
    const unansweredRequired = questions.filter(
      q => q.is_required && !answers[q.id]?.trim()
    );

    if (unansweredRequired.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Required questions',
        description: 'Please answer all required questions.',
      });
      return;
    }

    setLoading(true);

    try {
      // Create join request
      const { data: request, error: requestError } = await supabase
        .from('join_requests')
        .insert({
          organization_id: organization.id,
          user_id: user.id,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Save answers
      const answersToInsert = Object.entries(answers)
        .filter(([_, value]) => value.trim())
        .map(([questionId, answer]) => ({
          join_request_id: request.id,
          question_id: questionId,
          answer: answer.trim(),
        }));

      if (answersToInsert.length > 0) {
        const { error: answersError } = await supabase
          .from('question_answers')
          .insert(answersToInsert);

        if (answersError) throw answersError;
      }

      setStep('success');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to submit request',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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
        className="w-full max-w-md"
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
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {step === 'code' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold">Join Organization</h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your organization code
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="joinCode">Organization Code</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="joinCode"
                      placeholder="Enter code (e.g., ABC12345)"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="pl-10 uppercase"
                      maxLength={8}
                    />
                  </div>
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  disabled={loading || !joinCode.trim()}
                  onClick={handleFindOrganization}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block"
                      />
                      Searching...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Find Organization
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/account-setup')}
                >
                  Back
                </Button>
              </div>
            </>
          )}

          {step === 'questions' && organization && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold">{organization.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {questions.length > 0 ? 'Answer the questions below' : 'Request to join'}
                  </p>
                </div>
              </div>

              {organization.description && (
                <p className="text-sm text-muted-foreground mb-6 p-3 bg-muted/50 rounded-lg">
                  {organization.description}
                </p>
              )}

              <div className="space-y-5">
                {questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <Label>
                      {q.question}
                      {q.is_required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Textarea
                      placeholder="Your answer..."
                      value={answers[q.id] || ''}
                      onChange={(e) =>
                        setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))
                      }
                      rows={3}
                    />
                  </div>
                ))}

                {questions.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Click below to send a join request to the organization admin.
                  </p>
                )}

                <Button
                  variant="hero"
                  className="w-full"
                  disabled={loading}
                  onClick={handleSubmitRequest}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block"
                      />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Submit Request
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep('code');
                    setOrganization(null);
                    setQuestions([]);
                    setAnswers({});
                  }}
                >
                  Back
                </Button>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="h-8 w-8 text-green-500" />
              </motion.div>
              
              <h2 className="text-xl font-display font-bold mb-2">Request Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Your request to join <strong>{organization?.name}</strong> has been sent. 
                You'll be notified once an admin approves your request.
              </p>

              <Button
                variant="hero"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default JoinOrganization;
