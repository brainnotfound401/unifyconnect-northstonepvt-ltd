-- Create connections table for friend requests
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (requester_id, recipient_id)
);

-- Create messages table for chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for connections
CREATE POLICY "Users can view their own connections"
ON public.connections FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create connection requests"
ON public.connections FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update connections they received"
ON public.connections FOR UPDATE
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can delete their own connections"
ON public.connections FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- RLS policies for messages
CREATE POLICY "Users can view messages in their connections"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.connections c
    WHERE c.id = messages.connection_id
    AND (c.requester_id = auth.uid() OR c.recipient_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in accepted connections"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.connections c
    WHERE c.id = messages.connection_id
    AND c.status = 'accepted'
    AND (c.requester_id = auth.uid() OR c.recipient_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Create trigger for updated_at
CREATE TRIGGER update_connections_updated_at
BEFORE UPDATE ON public.connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_connections_users ON public.connections(requester_id, recipient_id);
CREATE INDEX idx_messages_connection ON public.messages(connection_id, created_at DESC);