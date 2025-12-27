import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MessageSquare,
  Users,
  Phone,
  MoreVertical,
  Hand,
  Smile,
  Copy,
  Settings,
  Grid3X3,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import northstoneLogo from "@/assets/northstone-logo.jpeg";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
}

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Mock participants
  const [participants] = useState<Participant[]>([
    { id: "1", name: "You", avatar: "Y", isMuted: false, isVideoOff: false, isSpeaking: false },
    { id: "2", name: "Alex Chen", avatar: "A", isMuted: true, isVideoOff: false, isSpeaking: true },
    { id: "3", name: "Sarah Miller", avatar: "S", isMuted: false, isVideoOff: true, isSpeaking: false },
    { id: "4", name: "John Davis", avatar: "J", isMuted: false, isVideoOff: false, isSpeaking: false },
    { id: "5", name: "Emma Wilson", avatar: "E", isMuted: true, isVideoOff: false, isSpeaking: false },
    { id: "6", name: "Mike Brown", avatar: "M", isMuted: false, isVideoOff: true, isSpeaking: false },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(`https://unify.northstone.com/meeting/${meetingId}`);
    toast({
      title: "Link Copied!",
      description: "Meeting link copied to clipboard.",
    });
  };

  const leaveMeeting = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img
            src={northstoneLogo}
            alt="Northstone"
            className="h-8 w-8 rounded-lg object-cover"
          />
          <div className="hidden sm:block">
            <span className="font-display font-semibold text-primary">Unify</span>
            <span className="text-muted-foreground text-sm ml-2">|</span>
            <span className="text-sm text-muted-foreground ml-2">
              Meeting: {meetingId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {formatTime(elapsedTime)}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={copyMeetingLink}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="h-full grid grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr">
            {participants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-xl overflow-hidden bg-surface ${
                  participant.isSpeaking ? "ring-2 ring-primary" : ""
                }`}
              >
                {participant.isVideoOff ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-2xl md:text-3xl font-semibold text-muted-foreground">
                        {participant.avatar}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-elevated flex items-center justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-2xl md:text-3xl font-semibold text-muted-foreground">
                        {participant.avatar}
                      </span>
                    </div>
                  </div>
                )}

                {/* Participant Info */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {participant.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {participant.isMuted && (
                        <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                          <MicOff className="h-3 w-3 text-destructive" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Speaking Indicator */}
                {participant.isSpeaking && (
                  <div className="absolute top-2 right-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scaleY: [1, 1.5, 1] }}
                          transition={{
                            duration: 0.4,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                          className="w-1 h-3 bg-primary rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Side Panel */}
        {(showChat || showParticipants) && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border bg-card overflow-hidden"
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-border">
                <h3 className="font-display font-semibold">
                  {showChat ? "Chat" : "Participants"}
                </h3>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                {showParticipants && (
                  <div className="space-y-2">
                    {participants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium">{p.avatar}</span>
                        </div>
                        <span className="text-sm flex-1">{p.name}</span>
                        {p.isMuted && <MicOff className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    ))}
                  </div>
                )}
                {showChat && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Chat messages will appear here
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </div>

      {/* Bottom Controls */}
      <footer className="h-20 bg-card border-t border-border flex items-center justify-center px-4">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mic */}
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="icon-lg"
            onClick={() => setIsMuted(!isMuted)}
            className="rounded-full"
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          {/* Camera */}
          <Button
            variant={isVideoOff ? "destructive" : "secondary"}
            size="icon-lg"
            onClick={() => setIsVideoOff(!isVideoOff)}
            className="rounded-full"
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>

          {/* Screen Share */}
          <Button
            variant={isScreenSharing ? "default" : "secondary"}
            size="icon-lg"
            onClick={() => {
              setIsScreenSharing(!isScreenSharing);
              toast({
                title: isScreenSharing ? "Stopped Sharing" : "Sharing Screen",
                description: isScreenSharing
                  ? "You stopped sharing your screen"
                  : "You are now sharing your screen",
              });
            }}
            className="rounded-full hidden md:flex"
          >
            <Monitor className="h-5 w-5" />
          </Button>

          {/* Raise Hand */}
          <Button
            variant="secondary"
            size="icon-lg"
            onClick={() => toast({ title: "Hand Raised", description: "You raised your hand" })}
            className="rounded-full hidden md:flex"
          >
            <Hand className="h-5 w-5" />
          </Button>

          {/* Reactions */}
          <Button
            variant="secondary"
            size="icon-lg"
            className="rounded-full hidden md:flex"
          >
            <Smile className="h-5 w-5" />
          </Button>

          {/* Chat */}
          <Button
            variant={showChat ? "default" : "secondary"}
            size="icon-lg"
            onClick={() => {
              setShowChat(!showChat);
              setShowParticipants(false);
            }}
            className="rounded-full"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          {/* Participants */}
          <Button
            variant={showParticipants ? "default" : "secondary"}
            size="icon-lg"
            onClick={() => {
              setShowParticipants(!showParticipants);
              setShowChat(false);
            }}
            className="rounded-full"
          >
            <Users className="h-5 w-5" />
          </Button>

          {/* More */}
          <Button variant="secondary" size="icon-lg" className="rounded-full md:hidden">
            <MoreVertical className="h-5 w-5" />
          </Button>

          {/* Leave */}
          <Button
            variant="destructive"
            size="lg"
            onClick={leaveMeeting}
            className="rounded-full ml-2"
          >
            <Phone className="h-5 w-5 rotate-[135deg]" />
            <span className="ml-2 hidden md:inline">Leave</span>
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default MeetingRoom;
