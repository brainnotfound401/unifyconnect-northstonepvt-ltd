import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import northstoneLogo from '@/assets/northstone-logo.jpeg';
import { z } from 'zod';

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
});

const CreateOrganization = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [questions, setQuestions] = useState<string[]>(['']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, refreshProfile } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    if (questions.length < 5) {
      setQuestions([...questions, '']);
    }
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions.length ? newQuestions : ['']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setErrors({});
    setLoading(true);

    try {
      const result = organizationSchema.safeParse(formData);
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

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          description: formData.description || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add owner as admin member
      await supabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'admin',
      });

      // Add custom questions
      const validQuestions = questions.filter(q => q.trim());
      if (validQuestions.length > 0) {
        await supabase.from('organization_questions').insert(
          validQuestions.map((question, index) => ({
            organization_id: org.id,
            question,
            order_index: index,
          }))
        );
      }

      // Update profile to organization_admin
      await supabase
        .from('profiles')
        .update({ account_type: 'organization_admin' })
        .eq('id', user.id);

      await refreshProfile();

      toast({
        title: 'Organization created!',
        description: `Your organization "${formData.name}" is ready. Share your join code: ${org.join_code}`,
      });

      navigate('/dashboard');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to create organization',
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
        className="w-full max-w-xl"
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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Create Organization</h1>
              <p className="text-sm text-muted-foreground">
                Set up your team workspace
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Acme Inc."
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Tell us about your organization..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Join Request Questions (Optional)</Label>
                <span className="text-xs text-muted-foreground">
                  {questions.filter(q => q.trim()).length}/5
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Add custom questions for people requesting to join your organization.
              </p>
              
              {questions.map((question, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Question ${index + 1}`}
                    value={question}
                    onChange={(e) => handleQuestionChange(index, e.target.value)}
                  />
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(index)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              
              {questions.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
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
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Organization
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateOrganization;
