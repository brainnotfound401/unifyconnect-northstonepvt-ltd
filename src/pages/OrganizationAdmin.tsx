import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Users, Settings, Copy, Check, X, ChevronRight,
  UserPlus, LogOut, ArrowLeft, Trash2
} from 'lucide-react';
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
  join_code: string;
}

interface Member {
  id: string;
  user_id: string;
  role: 'admin' | 'member' | 'pending';
  joined_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
}

interface JoinRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
  answers: {
    question: string;
    answer: string;
  }[];
}

const OrganizationAdmin = () => {
  const [tab, setTab] = useState<'members' | 'requests' | 'settings'>('members');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrganization();
    }
  }, [user]);

  const fetchOrganization = async () => {
    if (!user) return;

    try {
      // Find org where user is owner
      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!org) {
        navigate('/dashboard');
        return;
      }

      setOrganization(org);
      await Promise.all([
        fetchMembers(org.id),
        fetchRequests(org.id),
      ]);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (orgId: string) => {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        profiles:user_id (full_name, email)
      `)
      .eq('organization_id', orgId)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
      return;
    }

    setMembers((data as any) || []);
  };

  const fetchRequests = async (orgId: string) => {
    const { data: requestsData, error } = await supabase
      .from('join_requests')
      .select(`
        id,
        user_id,
        status,
        created_at,
        profiles:user_id (full_name, email)
      `)
      .eq('organization_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return;
    }

    // Fetch answers for each request
    const requestsWithAnswers = await Promise.all(
      (requestsData || []).map(async (req: any) => {
        const { data: answers } = await supabase
          .from('question_answers')
          .select(`
            answer,
            organization_questions:question_id (question)
          `)
          .eq('join_request_id', req.id);

        return {
          ...req,
          answers: (answers || []).map((a: any) => ({
            question: a.organization_questions?.question,
            answer: a.answer,
          })),
        };
      })
    );

    setRequests(requestsWithAnswers);
  };

  const copyJoinCode = () => {
    if (!organization) return;
    navigator.clipboard.writeText(organization.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Join code copied to clipboard.',
    });
  };

  const handleApproveRequest = async (request: JoinRequest) => {
    if (!organization) return;

    try {
      // Update request status
      await supabase
        .from('join_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);

      // Add as member
      await supabase.from('organization_members').insert({
        organization_id: organization.id,
        user_id: request.user_id,
        role: 'member',
      });

      toast({
        title: 'Request approved',
        description: `${request.profiles?.full_name || request.profiles?.email} has been added to the organization.`,
      });

      await Promise.all([
        fetchMembers(organization.id),
        fetchRequests(organization.id),
      ]);
      setSelectedRequest(null);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    }
  };

  const handleRejectRequest = async (request: JoinRequest) => {
    try {
      await supabase
        .from('join_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);

      toast({
        title: 'Request rejected',
        description: `Join request has been rejected.`,
      });

      if (organization) {
        await fetchRequests(organization.id);
      }
      setSelectedRequest(null);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    }
  };

  const handleRemoveMember = async (member: Member) => {
    if (!organization) return;

    try {
      await supabase
        .from('organization_members')
        .delete()
        .eq('id', member.id);

      toast({
        title: 'Member removed',
        description: `${member.profiles?.full_name || member.profiles?.email} has been removed.`,
      });

      await fetchMembers(organization.id);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    }
  };

  if (authLoading || loading) {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <img
                src={northstoneLogo}
                alt="Northstone"
                className="h-10 w-10 rounded-lg object-cover"
              />
              <div>
                <h1 className="font-display text-lg font-bold">{organization?.name}</h1>
                <p className="text-xs text-muted-foreground">Organization Admin</p>
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Join Code Card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Organization Join Code</h3>
              <p className="text-sm text-muted-foreground">
                Share this code with people you want to invite
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-muted rounded-lg font-mono text-lg font-bold tracking-wider">
                {organization?.join_code}
              </div>
              <Button variant="outline" size="icon" onClick={copyJoinCode}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === 'members' ? 'default' : 'ghost'}
            onClick={() => setTab('members')}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Members ({members.length})
          </Button>
          <Button
            variant={tab === 'requests' ? 'default' : 'ghost'}
            onClick={() => setTab('requests')}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Requests ({requests.length})
          </Button>
          <Button
            variant={tab === 'settings' ? 'default' : 'ghost'}
            onClick={() => setTab('settings')}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>

        {/* Content */}
        {tab === 'members' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {members.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No members yet. Share your join code to invite people.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {(member.profiles?.full_name || member.profiles?.email)?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.profiles?.full_name || 'No name'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.profiles?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        member.role === 'admin' 
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {member.role}
                      </span>
                      {member.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'requests' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Pending Requests</h3>
              </div>
              {requests.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {requests.map((request) => (
                    <button
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className={`w-full p-4 flex items-center justify-between hover:bg-muted/50 text-left ${
                        selectedRequest?.id === request.id ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-primary">
                            {(request.profiles?.full_name || request.profiles?.email)?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {request.profiles?.full_name || 'No name'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.profiles?.email}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Request Details */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {selectedRequest ? (
                <>
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold">Request Details</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">
                        {selectedRequest.profiles?.full_name || 'No name'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedRequest.profiles?.email}</p>
                    </div>

                    {selectedRequest.answers.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-border">
                        <p className="text-sm font-medium">Answers</p>
                        {selectedRequest.answers.map((a, i) => (
                          <div key={i} className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm text-muted-foreground mb-1">
                              {a.question}
                            </p>
                            <p className="text-sm">{a.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="hero"
                        className="flex-1"
                        onClick={() => handleApproveRequest(selectedRequest)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleRejectRequest(selectedRequest)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Select a request to view details
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Organization Settings</h3>
            <p className="text-muted-foreground">
              Settings management coming soon...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationAdmin;
