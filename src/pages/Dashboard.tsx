import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Video,
  Calendar,
  MessageSquare,
  Plus,
  Settings,
  LogOut,
  Clock,
  Users,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import northstoneLogo from "@/assets/northstone-logo.jpeg";

const Dashboard = () => {
  const { toast } = useToast();
  const { profile, user, signOut } = useAuth();
  const [meetingCode, setMeetingCode] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userTimezone, setUserTimezone] = useState("");
  const [personalInfo, setPersonalInfo] = useState<{ fullName?: string } | null>(null);

  // Request location and get timezone
  useEffect(() => {
    const getLocationTimezone = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              setUserTimezone(timezone);
            },
            () => {
              // Fallback to system timezone if permission denied
              const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              setUserTimezone(timezone);
            }
          );
        } else {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setUserTimezone(timezone);
        }
      } catch {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(timezone);
      }
    };

    getLocationTimezone();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleStartMeeting = () => {
    const meetingId = "meet-" + Date.now();
    window.location.href = `/meeting/${meetingId}`;
  };

  const handleJoinMeeting = () => {
    if (meetingCode.trim()) {
      window.location.href = `/meeting/${meetingCode}`;
    } else {
      toast({
        title: "Enter Meeting Code",
        description: "Please enter a valid meeting code to join.",
        variant: "destructive",
      });
    }
  };

  const handleScheduleMeeting = () => {
    toast({
      title: "Schedule Meeting",
      description: "Meeting scheduler coming soon!",
    });
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-4 hidden lg:flex flex-col">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 mb-8">
          <img
            src={northstoneLogo}
            alt="Northstone"
            className="h-10 w-10 rounded-lg object-cover"
          />
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold text-primary">
              Unify
            </span>
            <span className="text-[10px] text-muted-foreground -mt-1">
              by Northstone Pvt. Ltd.
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1">
          <div className="space-y-1">
            {[
              { icon: Calendar, label: "Calendar", active: false },
              { icon: MessageSquare, label: "Chats", active: false },
              { icon: Video, label: "Meetings", active: true },
              { icon: Users, label: "Contacts", active: false },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-border pt-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors">
            <Settings className="h-5 w-5" />
            Settings
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 flex-1 p-6 lg:p-8">
        {/* Top Header with Profile */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {profile?.avatar_url ? null : (
                  <User className="h-6 w-6" />
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display text-xl font-bold">
                {profile?.full_name || personalInfo?.fullName || "Welcome"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {profile?.email || user?.email || "Personal Account"}
              </p>
            </div>
          </div>

          {/* Mobile menu button placeholder */}
          <div className="lg:hidden">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex flex-col items-center justify-center py-8">
          {/* Time and Date Display with Background */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-full max-w-md mb-10 rounded-2xl overflow-hidden"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            
            {/* Content */}
            <div className="relative p-6 text-center">
              <div className="text-4xl md:text-5xl font-display font-bold text-foreground mb-1">
                {formatTime(currentTime)}
              </div>
              <div className="text-base text-muted-foreground">
                {formatDate(currentTime)}
              </div>
              <div className="text-xs text-muted-foreground/70 mt-2 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                {userTimezone}
              </div>
            </div>
          </motion.div>

          {/* Meeting Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-8">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={handleStartMeeting}
              className="group p-6 rounded-2xl glass hover:glass-elevated transition-all duration-300 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Video className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-1">
                Start Meeting
              </h3>
              <p className="text-sm text-muted-foreground">
                Start an instant video call
              </p>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl glass text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-3">
                Join Meeting
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="bg-secondary border-border text-sm"
                />
                <Button onClick={handleJoinMeeting} size="sm">
                  Join
                </Button>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={handleScheduleMeeting}
              className="group p-6 rounded-2xl glass hover:glass-elevated transition-all duration-300 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warning to-warning/70 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-1">
                Schedule
              </h3>
              <p className="text-sm text-muted-foreground">
                Plan a future meeting
              </p>
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
