import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Plus,
  Send,
  ArrowLeft,
  UserPlus,
  Check,
  X,
  Search,
  MessageSquare,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  created_at: string;
  other_user?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const Chat = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchPendingRequests();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConnection) {
      fetchMessages(selectedConnection.id);
      
      // Subscribe to realtime messages
      const channel = supabase
        .channel(`messages-${selectedConnection.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `connection_id=eq.${selectedConnection.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConnection]);

  const fetchConnections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching connections:', error);
      return;
    }

    // Fetch profile info for each connection
    const connectionsWithProfiles = await Promise.all(
      (data || []).map(async (conn) => {
        const otherUserId = conn.requester_id === user.id ? conn.recipient_id : conn.requester_id;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .eq('id', otherUserId)
          .maybeSingle();
        
        return { ...conn, other_user: profileData };
      })
    );

    setConnections(connectionsWithProfiles);
  };

  const fetchPendingRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('status', 'pending')
      .eq('recipient_id', user.id);

    if (error) {
      console.error('Error fetching pending requests:', error);
      return;
    }

    const requestsWithProfiles = await Promise.all(
      (data || []).map(async (conn) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .eq('id', conn.requester_id)
          .maybeSingle();
        
        return { ...conn, other_user: profileData };
      })
    );

    setPendingRequests(requestsWithProfiles);
  };

  const fetchMessages = async (connectionId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const handleSendConnectionRequest = async () => {
    if (!user || !searchEmail.trim()) return;

    // Find user by email
    const { data: targetProfile, error: searchError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', searchEmail.trim().toLowerCase())
      .maybeSingle();

    if (searchError || !targetProfile) {
      toast({
        title: "User Not Found",
        description: "No user found with that email address.",
        variant: "destructive",
      });
      return;
    }

    if (targetProfile.id === user.id) {
      toast({
        title: "Invalid Request",
        description: "You cannot send a request to yourself.",
        variant: "destructive",
      });
      return;
    }

    // Check if connection already exists
    const { data: existingConn } = await supabase
      .from('connections')
      .select('id, status')
      .or(`and(requester_id.eq.${user.id},recipient_id.eq.${targetProfile.id}),and(requester_id.eq.${targetProfile.id},recipient_id.eq.${user.id})`)
      .maybeSingle();

    if (existingConn) {
      toast({
        title: "Connection Exists",
        description: existingConn.status === 'pending' ? "A request is already pending." : "You are already connected.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('connections')
      .insert({
        requester_id: user.id,
        recipient_id: targetProfile.id,
      });

    if (error) {
      console.error('Error sending request:', error);
      toast({
        title: "Error",
        description: "Failed to send connection request.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Request Sent",
      description: `Connection request sent to ${searchEmail}`,
    });
    setSearchEmail("");
    setIsAddDialogOpen(false);
  };

  const handleAcceptRequest = async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId);

    if (error) {
      console.error('Error accepting request:', error);
      return;
    }

    toast({ title: "Request Accepted" });
    fetchConnections();
    fetchPendingRequests();
  };

  const handleRejectRequest = async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'rejected' })
      .eq('id', connectionId);

    if (error) {
      console.error('Error rejecting request:', error);
      return;
    }

    toast({ title: "Request Rejected" });
    fetchPendingRequests();
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConnection || !newMessage.trim()) return;

    setIsSending(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        connection_id: selectedConnection.id,
        sender_id: user.id,
        content: newMessage.trim(),
      });

    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }

    setNewMessage("");
    setIsSending(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <Link to="/auth">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Chats</span>
          </Link>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Connection</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="email" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">By Email</TabsTrigger>
                  <TabsTrigger value="requests">Requests ({pendingRequests.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="email" className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter email address"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      type="email"
                    />
                    <Button onClick={handleSendConnectionRequest}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="requests" className="mt-4">
                  <ScrollArea className="h-64">
                    {pendingRequests.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No pending requests</p>
                    ) : (
                      <div className="space-y-2">
                        {pendingRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={request.other_user?.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(request.other_user?.full_name || null)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{request.other_user?.full_name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{request.other_user?.email}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleAcceptRequest(request.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleRejectRequest(request.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1">
          {connections.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No connections yet</p>
              <p className="text-sm mt-1">Add someone to start chatting</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {connections.map((conn) => (
                <button
                  key={conn.id}
                  onClick={() => setSelectedConnection(conn)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    selectedConnection?.id === conn.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary"
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conn.other_user?.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(conn.other_user?.full_name || null)}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium text-sm">{conn.other_user?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{conn.other_user?.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        {selectedConnection ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConnection.other_user?.avatar_url || undefined} />
                <AvatarFallback>{getInitials(selectedConnection.other_user?.full_name || null)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedConnection.other_user?.full_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{selectedConnection.other_user?.email}</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          msg.sender_id === user.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.sender_id === user.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a conversation</p>
              <p className="text-sm">or add a new connection to start chatting</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Chat;
