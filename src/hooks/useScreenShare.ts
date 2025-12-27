import { useState, useCallback, useRef, useEffect } from 'react';

export const useScreenShare = () => {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      setScreenStream(stream);
      setIsSharing(true);
      setError(null);

      // Listen for when user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start screen share';
      setError(errorMessage);
      console.error('Error starting screen share:', err);
      return null;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setScreenStream(null);
      setIsSharing(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    screenStream,
    isSharing,
    error,
    startScreenShare,
    stopScreenShare,
  };
};
