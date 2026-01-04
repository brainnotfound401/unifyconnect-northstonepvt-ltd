import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Participant {
  id: string;
  visitorId: string;
  name: string;
  stream?: MediaStream;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

interface UseWebRTCProps {
  meetingId: string;
  localStream: MediaStream | null;
  visitorId: string;
  userName: string;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export const useWebRTC = ({ meetingId, localStream, visitorId, userName }: UseWebRTCProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Create peer connection for a remote participant
  const createPeerConnection = useCallback((remoteVisitorId: string, remoteName: string) => {
    console.log('Creating peer connection for:', remoteVisitorId);
    
    // Check if already exists
    if (peerConnectionsRef.current.has(remoteVisitorId)) {
      return peerConnectionsRef.current.get(remoteVisitorId)!;
    }
    
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    
    // Add local tracks to the connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received remote track from:', remoteVisitorId);
      const [remoteStream] = event.streams;
      
      setParticipants(prev => {
        const existing = prev.find(p => p.visitorId === remoteVisitorId);
        if (existing) {
          return prev.map(p => 
            p.visitorId === remoteVisitorId 
              ? { ...p, stream: remoteStream }
              : p
          );
        }
        return [...prev, {
          id: remoteVisitorId,
          visitorId: remoteVisitorId,
          name: remoteName,
          stream: remoteStream,
          isAudioEnabled: true,
          isVideoEnabled: true,
        }];
      });
    };

    // Handle ICE candidates - send via broadcast
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        console.log('Sending ICE candidate to:', remoteVisitorId);
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            from: visitorId,
            to: remoteVisitorId,
            candidate: event.candidate.toJSON(),
          },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState, 'for:', remoteVisitorId);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setParticipants(prev => prev.filter(p => p.visitorId !== remoteVisitorId));
        peerConnectionsRef.current.delete(remoteVisitorId);
      }
    };

    peerConnectionsRef.current.set(remoteVisitorId, pc);
    return pc;
  }, [localStream, visitorId]);

  // Create and send offer to a new participant
  const createOffer = useCallback(async (remoteVisitorId: string, remoteName: string) => {
    const pc = createPeerConnection(remoteVisitorId, remoteName);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      console.log('Sending offer to:', remoteVisitorId);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'offer',
        payload: {
          from: visitorId,
          to: remoteVisitorId,
          sdp: offer.sdp,
          offerType: offer.type,
          name: userName,
        },
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [createPeerConnection, visitorId, userName]);

  // Handle incoming offer
  const handleOffer = useCallback(async (fromVisitorId: string, signalData: any) => {
    console.log('Received offer from:', fromVisitorId);
    
    const pc = createPeerConnection(fromVisitorId, signalData.name || 'Participant');

    try {
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: signalData.offerType,
        sdp: signalData.sdp,
      }));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      console.log('Sending answer to:', fromVisitorId);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          from: visitorId,
          to: fromVisitorId,
          sdp: answer.sdp,
          answerType: answer.type,
          name: userName,
        },
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [createPeerConnection, visitorId, userName]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (fromVisitorId: string, signalData: any) => {
    console.log('Received answer from:', fromVisitorId);
    
    const pc = peerConnectionsRef.current.get(fromVisitorId);
    if (pc && pc.signalingState !== 'stable') {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription({
          type: signalData.answerType,
          sdp: signalData.sdp,
        }));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }, []);

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (fromVisitorId: string, candidate: any) => {
    console.log('Received ICE candidate from:', fromVisitorId);
    
    const pc = peerConnectionsRef.current.get(fromVisitorId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }, []);

  // Join meeting and set up signaling via Supabase Realtime Broadcast
  useEffect(() => {
    if (!meetingId || !visitorId || !localStream) return;

    console.log('Setting up WebRTC for meeting:', meetingId, 'visitor:', visitorId);
    setIsConnecting(true);

    // Create a broadcast channel for signaling
    const channel = supabase.channel(`meeting-${meetingId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: visitorId },
      },
    });

    channelRef.current = channel;

    // Handle presence for participant tracking
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('Presence sync:', state);
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('Participant joined:', key, newPresences);
      if (key !== visitorId && newPresences.length > 0) {
        const presence = newPresences[0] as any;
        // New participant joined - create offer to them
        createOffer(key, presence.name || 'Participant');
      }
    });

    channel.on('presence', { event: 'leave' }, ({ key }) => {
      console.log('Participant left:', key);
      if (key !== visitorId) {
        setParticipants(prev => prev.filter(p => p.visitorId !== key));
        const pc = peerConnectionsRef.current.get(key);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(key);
        }
      }
    });

    // Handle WebRTC signaling
    channel.on('broadcast', { event: 'offer' }, ({ payload }) => {
      if (payload.to === visitorId) {
        handleOffer(payload.from, payload);
      }
    });

    channel.on('broadcast', { event: 'answer' }, ({ payload }) => {
      if (payload.to === visitorId) {
        handleAnswer(payload.from, payload);
      }
    });

    channel.on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
      if (payload.to === visitorId) {
        handleIceCandidate(payload.from, payload.candidate);
      }
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      console.log('Channel status:', status);
      if (status === 'SUBSCRIBED') {
        // Track our presence
        await channel.track({
          name: userName,
          joinedAt: new Date().toISOString(),
        });
        setIsConnecting(false);
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up WebRTC');
      
      // Untrack presence
      channel.untrack();

      // Close all peer connections
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();

      // Remove channel
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [meetingId, visitorId, userName, localStream, createOffer, handleOffer, handleAnswer, handleIceCandidate]);

  return {
    participants,
    isConnecting,
  };
};
