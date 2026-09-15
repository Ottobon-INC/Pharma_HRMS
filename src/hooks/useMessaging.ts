import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase-client';

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  text: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  created_at: string;
  deleted_for_sender?: boolean;
  deleted_for_everyone?: boolean;
}

export interface ChatParticipant {
  id: string;
  channel_id: string;
  user_id: string;
  created_at: string;
}

export interface MessageRead {
  id: string;
  message_id: string;
  channel_id: string;
  user_id: string;
  read_at: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: string;
  admin_id?: string;
}

export function useMessaging(channelId: string | null, userId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [messageReads, setMessageReads] = useState<MessageRead[]>([]);
  const [channelDetails, setChannelDetails] = useState<ChatChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial messages when channel changes
  useEffect(() => {
    async function fetchChannelData() {
      if (!channelId) return;
      
      const { data: msgData, error: msgError } = await supabase
        .from('pharma_hrms_chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });
        
      if (!msgError && msgData) {
        setMessages(msgData);
      }

      // Fetch channel details
      const { data: channelData } = await supabase
        .from('pharma_hrms_chat_channels')
        .select('*')
        .eq('id', channelId)
        .single();
      if (channelData) setChannelDetails(channelData);

      // Fetch participants
      const { data: participantsData } = await supabase
        .from('pharma_hrms_chat_participants')
        .select('*')
        .eq('channel_id', channelId);
      if (participantsData) setParticipants(participantsData);

      // Fetch message reads
      const { data: readsData } = await supabase
        .from('pharma_hrms_message_reads')
        .select('*')
        .eq('channel_id', channelId);
      if (readsData) setMessageReads(readsData);
    }
    fetchChannelData();
  }, [channelId]);

  // Mark messages as read automatically
  useEffect(() => {
    if (!channelId || !userId || messages.length === 0) return;
    const unreadMessages = messages.filter(m => 
      m.sender_id !== userId && 
      !messageReads.some(r => r.message_id === m.id && r.user_id === userId)
    );
    
    if (unreadMessages.length > 0) {
      const newReads = unreadMessages.map(m => ({
        message_id: m.id,
        channel_id: channelId,
        user_id: userId
      }));
      
      // Optimistic
      const tempReads = newReads.map(r => ({ ...r, id: `temp_${Math.random()}`, read_at: new Date().toISOString() }) as MessageRead);
      setMessageReads(prev => [...prev, ...tempReads]);
      
      // DB
      supabase.from('pharma_hrms_message_reads').insert(newReads).then();
    }
  }, [messages, channelId, userId, messageReads]);

  // Listen for new/updated messages via Supabase Realtime (Postgres Changes)
  useEffect(() => {
    if (!channelId) return;

    const channel = supabase.channel(`chat_${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pharma_hrms_chat_messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as ChatMessage;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as ChatMessage;
            setMessages((prev) => prev.map((m) => m.id === updatedMessage.id ? updatedMessage : m));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pharma_hrms_message_reads', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          setMessageReads((prev) => {
            if (prev.some(r => r.id === payload.new.id)) return prev;
            return [...prev, payload.new as MessageRead];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pharma_hrms_chat_participants', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setParticipants(prev => [...prev, payload.new as ChatParticipant]);
          } else if (payload.eventType === 'DELETE') {
            setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pharma_hrms_chat_channels', filter: `id=eq.${channelId}` },
        (payload) => {
          setChannelDetails(payload.new as ChatChannel);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);
  const sendMessage = useCallback(async (text: string | null, attachment_url?: string, attachment_type?: string, attachment_name?: string) => {
    if (!channelId || !userId) return;

    // Optimistic UI Update
    const optimisticId = `temp_${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      channel_id: channelId,
      sender_id: userId,
      text,
      attachment_url,
      attachment_type,
      attachment_name,
      created_at: new Date().toISOString(),
      deleted_for_sender: false,
      deleted_for_everyone: false
    };
    
    setMessages((prev) => [...prev, optimisticMsg]);

    const payload: any = {
      channel_id: channelId,
      sender_id: userId,
      text
    };
    if (attachment_url) payload.attachment_url = attachment_url;
    if (attachment_type) payload.attachment_type = attachment_type;
    if (attachment_name) payload.attachment_name = attachment_name;

    const { data, error } = await supabase
      .from('pharma_hrms_chat_messages')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } else if (data) {
      // Replace optimistic message with real database row
      setMessages((prev) => prev.map((m) => m.id === optimisticId ? data : m));
      
      // Also broadcast via realtime as fallback if postgres_changes is disabled on the table
      supabase.channel(`chat_${channelId}`).send({
        type: 'broadcast',
        event: 'new_message',
        payload: data
      });
    }
  }, [channelId, userId]);

  const deleteMessageForMe = useCallback(async (messageId: string) => {
    // Optimistic update
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, deleted_for_sender: true } : m));
    
    const { error } = await supabase
      .from('pharma_hrms_chat_messages')
      .update({ deleted_for_sender: true })
      .eq('id', messageId);
      
    if (error) {
      console.error('Failed to delete message for me:', error);
      // Revert optimistic update
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, deleted_for_sender: false } : m));
    }
  }, []);

  const deleteMessageForEveryone = useCallback(async (messageId: string) => {
    // Optimistic update
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, deleted_for_everyone: true } : m));
    
    const { error, data } = await supabase
      .from('pharma_hrms_chat_messages')
      .update({ deleted_for_everyone: true })
      .eq('id', messageId)
      .select()
      .single();
      
    if (error) {
      console.error('Failed to delete message for everyone:', error);
      // Revert optimistic update
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, deleted_for_everyone: false } : m));
    } else if (data) {
      // Broadcast update via realtime as fallback
      supabase.channel(`chat_${channelId}`).send({
        type: 'broadcast',
        event: 'update_message',
        payload: data
      });
    }
  }, [channelId]);

  // Fallback broadcast listener in case postgres_changes is disabled
  useEffect(() => {
    if (!channelId) return;
    
    const channel = supabase.channel(`chat_${channelId}`);
    channel.on('broadcast', { event: 'new_message' }, ({ payload }) => {
      setMessages((prev) => {
        const isDuplicate = prev.some((m) => m.id === payload.id);
        if (isDuplicate) return prev;
        return [...prev, payload];
      });
    });
    channel.on('broadcast', { event: 'update_message' }, ({ payload }) => {
      setMessages((prev) => prev.map((m) => m.id === payload.id ? payload : m));
    });
  }, [channelId]);

  const updateGroupName = useCallback(async (newName: string) => {
    if (!channelId || !userId) return;
    const { error } = await supabase
      .from('pharma_hrms_chat_channels')
      .update({ name: newName })
      .eq('id', channelId);
    if (error) console.error("Error updating group name", error);
  }, [channelId, userId]);

  const addParticipant = useCallback(async (newUserId: string) => {
    if (!channelId) return;
    const { error } = await supabase
      .from('pharma_hrms_chat_participants')
      .insert([{ channel_id: channelId, user_id: newUserId }]);
    if (error) console.error("Error adding participant", error);
  }, [channelId]);

  const removeParticipant = useCallback(async (userIdToRemove: string) => {
    if (!channelId) return;
    const { error } = await supabase
      .from('pharma_hrms_chat_participants')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userIdToRemove);
    if (error) console.error("Error removing participant", error);
  }, [channelId]);

  return { 
    messages, 
    sendMessage, 
    deleteMessageForMe, 
    deleteMessageForEveryone, 
    isConnected,
    participants,
    messageReads,
    channelDetails,
    updateGroupName,
    addParticipant,
    removeParticipant
  };
}
