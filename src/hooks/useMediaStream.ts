import { useState, useCallback, useRef, useEffect } from 'react';

interface MediaStreamState {
  stream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  error: string | null;
}

export const useMediaStream = () => {
  const [state, setState] = useState<MediaStreamState>({
    stream: null,
    isAudioEnabled: true,
    isVideoEnabled: true,
    error: null,
  });
  
  const streamRef = useRef<MediaStream | null>(null);

  const startStream = useCallback(async (video = true, audio = true) => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      setState({
        stream,
        isAudioEnabled: audio,
        isVideoEnabled: video,
        error: null,
      });

      return stream;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to access media devices';
      setState(prev => ({ ...prev, error }));
      console.error('Error accessing media devices:', err);
      return null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setState({
        stream: null,
        isAudioEnabled: true,
        isVideoEnabled: true,
        error: null,
      });
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setState(prev => ({ ...prev, isAudioEnabled: !prev.isAudioEnabled }));
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setState(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
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
    ...state,
    startStream,
    stopStream,
    toggleAudio,
    toggleVideo,
  };
};
