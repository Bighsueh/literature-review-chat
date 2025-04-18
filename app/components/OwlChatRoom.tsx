import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Badge,
  Avatar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import type { ChatMessage } from '../types/index';

const ChatWindow = styled(Paper)({
  position: 'fixed',
  bottom: '280px',
  left: '20px',
  width: '300px',
  height: '400px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  zIndex: 1000,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
});

const ChatHeader = styled(Box)({
  padding: '12px',
  backgroundColor: '#f8f9fa',
  borderBottom: '1px solid #e0e0e0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const ChatMessages = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

const MessageBubble = styled(Box)<{ isOwl?: boolean }>(({ isOwl }) => ({
  maxWidth: '80%',
  padding: '8px 12px',
  borderRadius: '12px',
  backgroundColor: isOwl ? '#f0f7ff' : '#f5f5f5',
  alignSelf: isOwl ? 'flex-start' : 'flex-end',
  position: 'relative',
}));

const ChatInput = styled(Box)({
  padding: '12px',
  borderTop: '1px solid #e0e0e0',
});

interface OwlChatRoomProps {
  messages: ChatMessage[];
  unreadCount: number;
  onClose: () => void;
  onSend: (message: string) => void;
  onRead: () => void;
}

export default function OwlChatRoom({
  messages,
  unreadCount,
  onClose,
  onSend,
  onRead,
}: OwlChatRoomProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    onRead();
  }, []);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <ChatWindow>
      <ChatHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={unreadCount} color="error">
            <Avatar src="/貓頭鷹博士_擺手.gif" sx={{ width: 32, height: 32 }} />
          </Badge>
          <Typography variant="subtitle2">貓頭鷹博士</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </ChatHeader>

      <ChatMessages>
        {messages.map((message) => (
          <MessageBubble key={message.id} isOwl={message.sender === 'owl'}>
            <Typography variant="body2">{message.text}</Typography>
          </MessageBubble>
        ))}
        <div ref={messagesEndRef} />
      </ChatMessages>

      <ChatInput>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="輸入訊息..."
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <IconButton size="small" onClick={handleSend}>
                <SendIcon />
              </IconButton>
            ),
          }}
        />
      </ChatInput>
    </ChatWindow>
  );
} 