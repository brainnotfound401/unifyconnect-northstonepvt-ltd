import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Phone,
  MoreVertical,
  Hand,
  Smile,
  Copy,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMediaStream } from "@/hooks/useMediaStream";
import { useScreenShare } from "@/hooks/useScreenShare";
import { VideoPlayer } from "@/components/VideoPlayer";
import northstoneLogo from "@/assets/northstone-logo.jpeg";

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [userName, setUserName] = useState("You");
  const [handRaised, setHandRaised] = useState(false);

  const {
    stream,
    isAudioEnabled,
    isVideoEnabled,
    startStream,
    stopStream,
    toggleAudio,
    toggleVideo,
  } = useMediaStream();

  const {
    screenStream,
    isSharing,
    startScreenShare,
    stopScreenShare,
  } = useScreenShare();

  // Initialize media on mount
  useEffect(() => {
    const init = async () => {
      const storedName = sessionStorage.getItem('userName');
      if (storedName) {
        setUserName(storedName);
      }
      await startStream(true, true);
    };
    init();

    return () => {
      stopStream();
      stopScreenShare();
    };
  }, []);

  // Timer
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
    navigator.clipboard.writeText(`${window.location.origin}/join?code=${meetingId}`);
    toast({
      title: "Link Copied!",
      description: "Meeting link copied to clipboard.",
    });
  };

  const handleScreenShare = async () => {
    if (isSharing) {
      stopScreenShare();
      toast({
        title: "Stopped Sharing",
        description: "You stopped sharing your screen",
      });
    } else {
      const result = await startScreenShare();
      if (result) {
        toast({
          title: "Sharing Screen",
          description: "You are now sharing your screen",
        });
      }
    }
  };

  const handleRaiseHand = () => {
    setHandRaised(!handRaised);
    toast({
      title: handRaised ? "Hand Lowered" : "Hand Raised",
      description: handRaised ? "You lowered your hand" : "You raised your hand",
    });
  };

  const leaveMeeting = () => {
    stopStream();
    stopScreenShare();
    sessionStorage.removeItem('userName');
    navigate("/dashboard");
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
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-3 auto-rows-fr">
            {/* Screen share (if active) */}
            {isSharing && screenStream && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full lg:col-span-2 relative rounded-xl overflow-hidden bg-surface min-h-[300px]"
              >
                <video
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el && screenStream) {
                      el.srcObject = screenStream;
                    }
                  }}
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-sm">
                  <Monitor className="h-4 w-4 inline mr-1" />
                  You're sharing your screen
                </div>
              </motion.div>
            )}

            {/* Local video */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="min-h-[200px]"
            >
              <VideoPlayer
                stream={stream}
                name={userName}
                isLocal={true}
                isMuted={!isAudioEnabled}
                isVideoOff={!isVideoEnabled}
                className="h-full w-full"
              />
            </motion.div>

            {/* Placeholder for remote participants */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="min-h-[200px] relative rounded-xl overflow-hidden bg-surface"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary">
                <Users className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm text-center px-4">
                  Waiting for others to join...
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Share the meeting code: <span className="font-mono text-primary">{meetingId}</span>
                </p>
              </div>
            </motion.div>
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
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-semibold">
                  {showChat ? "Chat" : "Participants"}
                </h3>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setShowChat(false);
                    setShowParticipants(false);
                  }}
                >
                  ×
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                {showParticipants && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {userName[0]?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm flex-1">{userName} (You)</span>
                      {!isAudioEnabled && <MicOff className="h-4 w-4 text-muted-foreground" />}
                      {handRaised && <Hand className="h-4 w-4 text-yellow-500" />}
                    </div>
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
            variant={!isAudioEnabled ? "destructive" : "secondary"}
            size="icon-lg"
            onClick={toggleAudio}
            className="rounded-full"
          >
            {!isAudioEnabled ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          {/* Camera */}
          <Button
            variant={!isVideoEnabled ? "destructive" : "secondary"}
            size="icon-lg"
            onClick={toggleVideo}
            className="rounded-full"
          >
            {!isVideoEnabled ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>

          {/* Screen Share */}
          <Button
            variant={isSharing ? "default" : "secondary"}
            size="icon-lg"
            onClick={handleScreenShare}
            className="rounded-full hidden md:flex"
          >
            {isSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>

          {/* Raise Hand */}
          <Button
            variant={handRaised ? "default" : "secondary"}
            size="icon-lg"
            onClick={handleRaiseHand}
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
