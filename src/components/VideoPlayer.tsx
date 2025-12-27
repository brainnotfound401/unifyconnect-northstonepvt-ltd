import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MicOff, VideoOff } from 'lucide-react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  name: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isSpeaking?: boolean;
  className?: string;
}

export const VideoPlayer = ({
  stream,
  name,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  isSpeaking = false,
  className = '',
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const avatar = name ? name[0].toUpperCase() : '?';

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-surface ${
        isSpeaking ? 'ring-2 ring-primary' : ''
      } ${className}`}
    >
      {isVideoOff || !stream ? (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl md:text-3xl font-semibold text-muted-foreground">
              {avatar}
            </span>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
        />
      )}

      {/* Participant Info */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/80 to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">
            {name} {isLocal && '(You)'}
          </span>
          <div className="flex items-center gap-1">
            {isMuted && (
              <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                <MicOff className="h-3 w-3 text-destructive" />
              </div>
            )}
            {isVideoOff && (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <VideoOff className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Speaking Indicator */}
      {isSpeaking && (
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
    </div>
  );
};
