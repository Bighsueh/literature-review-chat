import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Badge,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import type { ChatMessage } from '../types/index';
import { v4 as uuidv4 } from 'uuid';

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

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOwl'
})<{ isOwl?: boolean }>(({ isOwl }) => ({
  maxWidth: '80%',
  padding: '8px 12px',
  borderRadius: isOwl ? '12px 12px 12px 0' : '12px 12px 0 12px',
  backgroundColor: isOwl ? '#f5f5f5' : '#e3f2fd',
  alignSelf: isOwl ? 'flex-start' : 'flex-end',
  position: 'relative',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    [isOwl ? 'left' : 'right']: '-8px',
    width: '16px',
    height: '16px',
    backgroundColor: isOwl ? '#f5f5f5' : '#e3f2fd',
    clipPath: isOwl ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(0 0, 100% 0, 100% 100%)',
  }
}));

const MessageTime = styled(Typography)({
  fontSize: '0.75rem',
  color: '#666',
  marginTop: '4px',
  textAlign: 'right',
});

const ChatInput = styled(Box)({
  padding: '12px',
  borderTop: '1px solid #e0e0e0',
});

const LoadingIndicator = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  marginTop: '8px',
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
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    onRead();
    
    // 初始化聊天會話ID
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    console.log('貓頭鷹博士會話ID:', newSessionId);
    
    // 可以在這裡添加一個歡迎訊息
    onSend(`歡迎來到貓頭鷹博士的知識助手！我可以幫您解答問題。`);
  }, []);

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = input;
      setInput('');
      setIsLoading(true);
      
      try {
        // 獲取最近的RagFlow回應作為參考資料
        // 這裡假設外部組件會傳入最近的RagFlow回應
        let recentRagflowResponses = '';
        
        // 從消息歷史中提取最近 3 條系統消息
        const recentMessages = messages
          .filter(msg => msg.sender === 'owl')
          .slice(-3)
          .map(msg => msg.text)
          .join('\n');
          
        if (recentMessages) {
          recentRagflowResponses = `參考資料：${recentMessages}`;
        }
        
        // 創建請求體
        const chatInput = `使用者：${userMessage}${recentRagflowResponses ? ', ' + recentRagflowResponses : ''}`;
        
        console.log('發送給貓頭鷹博士的請求:', chatInput);
        
        // 發送到API
        const response = await fetch('https://n8n.hsueh.tw/webhook/53c136fe-3e77-4709-a143-fe82746dd8b6/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([
            {
              sessionId: sessionId,
              action: 'sendMessage',
              chatInput: chatInput
            }
          ])
        });
        
        if (!response.ok) {
          throw new Error(`API 響應錯誤: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('貓頭鷹博士回應:', responseData);
        
        // 將使用者訊息添加到聊天歷史
        onSend(userMessage);
        
        // 將API回應添加到聊天歷史 - 修改為使用 output 結構
        if (responseData && responseData.output && responseData.output.response) {
          onSend(responseData.output.response);
        } else if (responseData && responseData.output) {
          // 可能 output 對象存在但沒有 response 字段，嘗試直接使用 output
          const outputText = typeof responseData.output === 'string' 
            ? responseData.output 
            : JSON.stringify(responseData.output);
          onSend(outputText);
        } else {
          onSend('抱歉，我無法處理您的請求，請稍後再試。');
        }
      } catch (error) {
        console.error('與貓頭鷹博士通訊時發生錯誤:', error);
        
        // 將使用者訊息添加到聊天歷史
        onSend(userMessage);
        
        // 添加錯誤訊息
        onSend('抱歉，我遇到了一點技術問題，請稍後再試。');
      } finally {
        setIsLoading(false);
      }
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
            <MessageTime>
              {new Date(message.timestamp).toLocaleTimeString('zh-TW', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </MessageTime>
          </MessageBubble>
        ))}
        {isLoading && (
          <LoadingIndicator>
            <CircularProgress size={24} />
          </LoadingIndicator>
        )}
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
          disabled={isLoading}
          InputProps={{
            endAdornment: (
              <IconButton size="small" onClick={handleSend} disabled={isLoading || !input.trim()}>
                <SendIcon />
              </IconButton>
            ),
          }}
        />
      </ChatInput>
    </ChatWindow>
  );
} 