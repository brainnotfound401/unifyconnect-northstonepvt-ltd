-- Create meeting_participants table for tracking who's in a meeting
CREATE TABLE public.meeting_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE
);

-- Create signaling table for WebRTC offer/answer/ICE candidates
CREATE TABLE public.meeting_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_signals ENABLE ROW LEVEL SECURITY;

-- RLS policies for meeting_participants
CREATE POLICY "Anyone can view participants in a meeting"
ON public.meeting_participants
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can join meetings"
ON public.meeting_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own participation"
ON public.meeting_participants
FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can leave meetings"
ON public.meeting_participants
FOR DELETE
USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS policies for meeting_signals
CREATE POLICY "Users can view signals sent to them"
ON public.meeting_signals
FOR SELECT
USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Authenticated users can send signals"
ON public.meeting_signals
FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete their own signals"
ON public.meeting_signals
FOR DELETE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Enable realtime for signaling
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_participants;