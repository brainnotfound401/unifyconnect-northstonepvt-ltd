import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Video,
  Phone,
  Presentation,
  Plus,
  Calendar,
  Users,
  Building2,
  Settings,
  LogOut,
  Copy,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import northstoneLogo from "@/assets/northstone-logo.jpeg";

const Dashboard = () => {
  const { toast } = useToast();
  const [meetingCode, setMeetingCode] = useState("");

  const quickActions = [
    {
      icon: Video,
      label: "New Meeting",
      description: "Start an instant meeting",
      gradient: "from-primary to-primary/70",
      action: () => window.location.href = "/meeting/new-" + Date.now(),
    },
    {
      icon: Calendar,
      label: "Schedule",
      description: "Plan a future meeting",
      gradient: "from-accent to-accent/70",
      action: () => toast({ title: "Schedule Meeting", description: "Meeting scheduler coming soon!" }),
    },
    {
      icon: Presentation,
      label: "Webinar",
      description: "Host a large event",
      gradient: "from-warning to-warning/70",
      action: () => toast({ title: "Start Webinar", description: "Webinar feature coming soon!" }),
    },
    {
      icon: Phone,
      label: "Voice Call",
      description: "Audio-only meeting",
      gradient: "from-success to-success/70",
      action: () => window.location.href = "/meeting/voice-" + Date.now(),
    },
  ];

  const upcomingMeetings = [
    {
      title: "Team Standup",
      time: "10:00 AM",
      date: "Today",
      participants: 8,
      type: "video",
    },
    {
      title: "Product Review",
      time: "2:30 PM",
      date: "Today",
      participants: 12,
      type: "webinar",
    },
    {
      title: "Client Call",
      time: "11:00 AM",
      date: "Tomorrow",
      participants: 4,
      type: "video",
    },
  ];

  const myGroups = [
    { name: "Engineering", members: 24, color: "bg-primary" },
    { name: "Design Team", members: 8, color: "bg-accent" },
    { name: "Marketing", members: 15, color: "bg-warning" },
  ];

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

  const generateMeetingLink = () => {
    const code = "unify-" + Math.random().toString(36).substring(2, 8);
    navigator.clipboard.writeText(`https://unify.northstone.com/${code}`);
    toast({
      title: "Link Copied!",
      description: "Meeting link copied to clipboard.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
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
              { icon: Video, label: "Meetings", active: true },
              { icon: Users, label: "Groups" },
              { icon: Building2, label: "Organization" },
              { icon: Calendar, label: "Calendar" },
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

          <div className="mt-8">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
              My Groups
            </h4>
            <div className="space-y-1">
              {myGroups.map((group) => (
                <button
                  key={group.name}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${group.color}`} />
                  <span>{group.name}</span>
                  <span className="ml-auto text-xs">{group.members}</span>
                </button>
              ))}
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors">
                <Plus className="h-4 w-4" />
                Create Group
              </button>
            </div>
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-border pt-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors">
            <Settings className="h-5 w-5" />
            Settings
          </button>
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              Welcome back! 👋
            </h1>
            <p className="text-muted-foreground">
              Start or join a meeting to connect with your team.
            </p>
          </div>

          {/* Join Meeting */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter meeting code"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
              className="w-48 bg-secondary border-border"
            />
            <Button onClick={handleJoinMeeting}>Join</Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={action.action}
              className="group p-6 rounded-2xl glass hover:glass-elevated transition-all duration-300 text-left"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <action.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="font-display font-semibold mb-1">{action.label}</h3>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
            </motion.button>
          ))}
        </div>

        {/* Meeting Link Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 p-6 rounded-2xl glass"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold mb-1">
                Generate Meeting Link
              </h3>
              <p className="text-sm text-muted-foreground">
                Create a shareable link for your next meeting
              </p>
            </div>
            <Button onClick={generateMeetingLink} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Generate & Copy Link
            </Button>
          </div>
        </motion.div>

        {/* Upcoming Meetings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">
              Upcoming Meetings
            </h2>
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {upcomingMeetings.map((meeting, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="p-4 rounded-xl glass hover:glass-elevated transition-all duration-300 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      meeting.type === "webinar"
                        ? "bg-warning/20 text-warning"
                        : "bg-primary/20 text-primary"
                    }`}
                  >
                    {meeting.type === "webinar" ? (
                      <Presentation className="h-5 w-5" />
                    ) : (
                      <Video className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{meeting.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {meeting.time}
                      </span>
                      <span>{meeting.date}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {meeting.participants}
                      </span>
                    </div>
                  </div>
                </div>
                <Button size="sm">Join</Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
