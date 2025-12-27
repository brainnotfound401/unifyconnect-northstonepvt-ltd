import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Video, Mic, MicOff, VideoOff, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMediaStream } from "@/hooks/useMediaStream";
import northstoneLogo from "@/assets/northstone-logo.jpeg";

const JoinMeeting = () => {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const {
    stream,
    isAudioEnabled,
    isVideoEnabled,
    error,
    startStream,
    toggleAudio,
    toggleVideo,
    stopStream,
  } = useMediaStream();

  useEffect(() => {
    const initCamera = async () => {
      setIsLoading(true);
      await startStream(true, true);
      setIsLoading(false);
    };
    initCamera();

    return () => {
      stopStream();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleJoin = () => {
    if (meetingCode.trim() && name.trim()) {
      // Store name in sessionStorage for the meeting room
      sessionStorage.setItem('userName', name);
      navigate(`/meeting/${meetingCode}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/20 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl relative z-10"
      >
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Preview Section */}
          <div className="order-2 md:order-1">
            <div className="aspect-video rounded-2xl bg-surface overflow-hidden relative">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : !isVideoEnabled || !stream ? (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-4xl font-semibold text-muted-foreground">
                      {name ? name[0].toUpperCase() : "?"}
                    </span>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              )}

              {error && (
                <div className="absolute top-4 left-4 right-4 bg-destructive/90 text-destructive-foreground text-sm p-2 rounded-lg">
                  {error}
                </div>
              )}

              {/* Preview Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <Button
                  variant={!isAudioEnabled ? "destructive" : "secondary"}
                  size="icon"
                  onClick={toggleAudio}
                  className="rounded-full"
                  disabled={isLoading}
                >
                  {!isAudioEnabled ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  variant={!isVideoEnabled ? "destructive" : "secondary"}
                  size="icon"
                  onClick={toggleVideo}
                  className="rounded-full"
                  disabled={isLoading}
                >
                  {!isVideoEnabled ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                </Button>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Join Form */}
          <div className="order-1 md:order-2 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-8">
              <img
                src={northstoneLogo}
                alt="Northstone"
                className="h-12 w-12 rounded-xl object-cover"
              />
              <div>
                <span className="font-display text-2xl font-bold text-primary">
                  Unify
                </span>
                <p className="text-xs text-muted-foreground">
                  by Northstone Pvt. Ltd.
                </p>
              </div>
            </div>

            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Join Meeting
            </h1>
            <p className="text-muted-foreground mb-8">
              Enter the meeting code provided by the host
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Your Name
                </label>
                <Input
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 bg-secondary border-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Meeting Code
                </label>
                <Input
                  placeholder="e.g., unify-abc123"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="h-12 bg-secondary border-border"
                />
              </div>

              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={handleJoin}
                disabled={!meetingCode.trim() || !name.trim()}
              >
                Join Meeting
              </Button>

              <div className="text-center">
                <Link
                  to="/dashboard"
                  className="text-sm text-primary hover:underline"
                >
                  Or start your own meeting
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default JoinMeeting;
