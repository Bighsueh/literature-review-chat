import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Tooltip,
  Zoom,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Snackbar,
  Alert,
  Badge,
  CircularProgress,
  Fade,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import io from 'socket.io-client';
import QuillEditor from './QuillEditor';
import { v4 as uuidv4 } from 'uuid';
import type { PDF, Note, ChatMessage } from '../types/index';
import NoteDialog from './NoteDialog';
import OwlChatRoom from './OwlChatRoom';
import { ragFlowApi } from '../services/ragflowApi';
import { RAGFLOW_API, isRagFlowConfigured } from '../utils/env';

// 動態導入 React-Quill
const ReactQuill = lazy(() => import('react-quill'));

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const wave = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
  100% { transform: rotate(0deg); }
`;

const AppContainer = styled(Box)({
  display: 'grid',
  gridTemplateColumns: '300px 1fr 300px',
  height: '100vh',
  backgroundColor: '#ffffff',
  color: '#333333',
});

const SourcePanel = styled(Box)({
  borderRight: '1px solid #e0e0e0',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f8f9fa',
  height: '100vh',
});

const SourceContent = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  marginTop: '16px',
});

const ChatPanel = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  padding: '16px',
  backgroundColor: '#ffffff',
  position: 'relative',
});

const ChatContent = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  marginBottom: '16px',
});

const StudioPanel = styled(Box)({
  borderLeft: '1px solid #e0e0e0',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f8f9fa',
  height: '100vh',
});

const StudioContent = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  marginTop: '16px',
});

const ActionButton = styled(Button)(({ theme }) => ({
  justifyContent: 'flex-start',
  padding: '8px 16px',
  textTransform: 'none',
  color: '#333',
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
}));

const SearchBar = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#ffffff',
    '& fieldset': {
      borderColor: '#e0e0e0',
    },
    '&:hover fieldset': {
      borderColor: '#1976d2',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1976d2',
    },
  },
});

const MessageContainer = styled(Box)({
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '16px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
});

// 新增聊天泡泡樣式
const UserMessageBubble = styled(Box)({
  backgroundColor: '#e3f2fd',
  borderRadius: '18px 18px 0 18px',
  padding: '12px 16px',
  marginLeft: 'auto',
  maxWidth: '80%',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    right: '-8px',
    width: '16px',
    height: '16px',
    backgroundColor: '#e3f2fd',
    clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
  }
});

const SystemMessageBubble = styled(Box)({
  backgroundColor: '#f5f5f5',
  borderRadius: '18px 18px 18px 0',
  padding: '12px 16px',
  marginRight: 'auto',
  maxWidth: '80%',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '-8px',
    width: '16px',
    height: '16px',
    backgroundColor: '#f5f5f5',
    clipPath: 'polygon(0 0, 0 100%, 100% 0)',
  }
});

const MessageContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
});

const MessageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '4px',
});

const MessageText = styled(Typography)({
  whiteSpace: 'pre-line',
  marginRight: '8px',
});

const SystemMessageActions = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '8px',
});

const MessageTime = styled(Typography)({
  fontSize: '0.75rem',
  color: '#666',
  marginTop: '4px',
  textAlign: 'right',
});

const OwlContainer = styled(Box)({
  position: 'fixed',
  bottom: '20px',
  left: '20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 1000,
});

const OwlDoctor = styled(Box)(({ ishovered }: { ishovered: string }) => ({
  width: '240px',
  height: '240px',
  backgroundImage: 'url("/貓頭鷹博士_擺手.gif")',
  backgroundSize: 'contain',
  backgroundRepeat: 'no-repeat',
  cursor: 'pointer',
  animation: `${ishovered === 'true' ? wave : float} 2s ease-in-out infinite`,
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const OwlMessage = styled(Paper)(({ show = true }: { show?: boolean }) => ({
  padding: '12px',
  borderRadius: '12px',
  backgroundColor: '#ffffff',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  marginBottom: '12px',
  maxWidth: '200px',
  opacity: 1,
  transform: 'translateY(0)',
  transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: '-10px',
    left: '20px',
    border: '5px solid transparent',
    borderTopColor: '#ffffff',
  },
}));

const NoteBlock = styled(Paper)({
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  cursor: 'pointer',
  transition: 'box-shadow 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
});

const NoteTitle = styled(Typography)({
  fontWeight: 600,
  marginBottom: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const NoteContent = styled(Typography)({
  color: '#666',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const TagChip = styled(Chip)({
  margin: '4px',
  backgroundColor: '#e3f2fd',
  '&:hover': {
    backgroundColor: '#bbdefb',
  },
});

const DocumentListItem = styled(ListItem)({
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  marginBottom: '8px',
  '&:hover': {
    backgroundColor: '#f0f7ff',
  },
});

// 為不同文件類型定義圖標顏色
const documentIcons = {
  pdf: { icon: PictureAsPdfIcon, color: '#e53935' },
  docx: { icon: PictureAsPdfIcon, color: '#2196f3' },
  txt: { icon: PictureAsPdfIcon, color: '#4caf50' },
  ppt: { icon: PictureAsPdfIcon, color: '#ff9800' },
  csv: { icon: PictureAsPdfIcon, color: '#9c27b0' },
  xlsx: { icon: PictureAsPdfIcon, color: '#1b5e20' },
  default: { icon: PictureAsPdfIcon, color: '#757575' }
};

// 移除預設系統訊息
const systemMessages: ChatMessage[] = [];

// 移除預設貓頭鷹訊息
const owlMessages: ChatMessage[] = [];

// 添加毛玻璃背景遮罩
const TutorialOverlay = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(4px)',
  zIndex: 1400,
});

// 修改氣泡樣式 - 將藍色改為白灰色
const TutorialBubble = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  padding: '20px',
  borderRadius: '12px',
  backgroundColor: 'rgba(245, 245, 245, 0.95)',  // 改為白灰色
  color: '#333333',  // 文字顏色改為暗灰色
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  zIndex: 1500,
  minWidth: '350px',
  maxWidth: '450px',
  pointerEvents: 'auto',
  '&:after': {
    content: '""',
    position: 'absolute',
    width: '20px',
    height: '20px',
    backgroundColor: 'rgba(245, 245, 245, 0.95)',  // 箭頭顏色也要改
    transform: 'rotate(45deg)',
  }
}));

// 修改高亮區域，使其保持清晰
const HighlightArea = styled(Box)({
  position: 'absolute',
  zIndex: 1450,
  borderRadius: '4px',
  backdropFilter: 'none',
  backgroundColor: 'transparent',
  border: '2px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
});

// 修改按鈕容器樣式 - 適應白灰色背景
const TutorialButtons = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '16px',
  gap: '12px',
});

export default function ChatInterface() {
  const [documents, setDocuments] = useState<PDF[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [owlChatMessages, setOwlChatMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showOwlChat, setShowOwlChat] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOwlHovered, setIsOwlHovered] = useState(false);
  const [owlMessage, setOwlMessage] = useState('一起來創建知識吧！點擊我開始聊天！');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [deleteNoteConfirmOpen, setDeleteNoteConfirmOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamAnswer, setStreamAnswer] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(1);
  const [tutorialSkipped, setTutorialSkipped] = useState(false);

  // 添加引用來獲取元素位置
  const fileButtonRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);

  const handleDeleteDocument = (id: string) => {
    setDocumentToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      setDocuments(documents.filter(doc => doc.id !== documentToDelete));
      setDocumentToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // 不再拒絕上傳過長檔名的檔案，而是讓API自動處理
      // 創建 FormData 用於後端上傳
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      try {
        // 顯示上傳中提示
        setSnackbarMessage('正在上傳文件...');
        setSnackbarOpen(true);

        // 處理前端本地顯示
        const newDocuments: PDF[] = Array.from(files).map(file => {
          // 獲取文件擴展名
          const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
          
          return {
            id: uuidv4(),
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          };
        });
        
        setDocuments([...documents, ...newDocuments]);

        // 收集成功上傳的文件ID
        const uploadedDocumentIds: string[] = [];
        
        // 逐個上傳文件，確保每個文件上傳成功後單獨處理
        for (const file of Array.from(files)) {
          try {
            console.log(`開始上傳文件: ${file.name}`);
            
            // 上傳文件
            const uploadResponse = await ragFlowApi.uploadDocument(file);
            console.log(`文件上傳響應:`, uploadResponse);
            
            // 檢查上傳是否成功 - 修正處理響應中data為陣列的情況
            if (uploadResponse && uploadResponse.code === 0) {
              console.log(`文件 ${file.name} 上傳成功，響應數據:`, uploadResponse);
              
              // 處理響應數據，支援單個對象或陣列格式
              const dataItems = Array.isArray(uploadResponse.data) ? uploadResponse.data : [uploadResponse.data];
              
              // 收集每個成功上傳項目的ID
              dataItems.forEach((item: { id?: string }) => {
                if (item && item.id) {
                  console.log(`文件項目ID: ${item.id}`);
                  uploadedDocumentIds.push(item.id);
                }
              });
              
              if (dataItems.length > 0 && dataItems.some((item: { id?: string }) => item && item.id)) {
                // 如果文件名稱被修改，記錄日誌
                if (uploadResponse.processedFilename && uploadResponse.processedFilename.wasRenamed) {
                  console.log(`文件名稱已自動縮短: ${uploadResponse.processedFilename.original} -> ${uploadResponse.processedFilename.processed}`);
                }
                
                // 顯示文件單獨上傳成功的訊息
                setSnackbarMessage(`文件 ${file.name} 上傳成功`);
                setSnackbarOpen(true);
              } else {
                console.error(`文件 ${file.name} 上傳成功但未返回有效ID:`, uploadResponse);
                setSnackbarMessage(`文件 ${file.name} 上傳成功但無法獲取ID`);
                setSnackbarOpen(true);
              }
            } else {
              console.error(`文件 ${file.name} 上傳失敗:`, uploadResponse);
              setSnackbarMessage(`文件 ${file.name} 上傳失敗: ${uploadResponse.message || '未知錯誤'}`);
              setSnackbarOpen(true);
            }
          } catch (error) {
            console.error(`文件 ${file.name} 上傳時發生錯誤:`, error);
            setSnackbarMessage(`文件 ${file.name} 上傳失敗`);
            setSnackbarOpen(true);
          }
        }
        
        // 如果有成功上傳的文件，觸發解析
        if (uploadedDocumentIds.length > 0) {
          console.log(`開始解析 ${uploadedDocumentIds.length} 個文件，ID列表:`, uploadedDocumentIds);
          
          try {
            setSnackbarMessage('正在解析文件內容...');
            setSnackbarOpen(true);
            
            // 呼叫解析API
            const parseResult = await ragFlowApi.parseDocuments(uploadedDocumentIds);
            console.log('文件解析響應:', parseResult);
            
            if (parseResult && parseResult.code === 0) {
              console.log('文件解析成功');
              setSnackbarMessage('文件已成功上傳並解析完成，已同步至知識庫');
            } else {
              console.error('文件解析失敗:', parseResult);
              setSnackbarMessage(`文件解析失敗: ${parseResult.message || '未知錯誤'}`);
            }
            setSnackbarOpen(true);
          } catch (error) {
            console.error('解析文件時發生錯誤:', error);
            setSnackbarMessage('文件上傳成功，但解析失敗');
            setSnackbarOpen(true);
          }
        } else {
          console.log('沒有成功上傳的文件，跳過解析步驟');
          setSnackbarMessage('沒有文件上傳成功，請重試');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('上傳過程中發生錯誤:', error);
        setSnackbarMessage('文件上傳過程中發生錯誤，請檢查網絡連接或API配置');
        setSnackbarOpen(true);
      }
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      // 顯示用戶訊息
      const newMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'user',
        text: inputText,
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setInputText('');
      setIsLoading(true);
      
      try {
        // 確保有有效的 sessionId
        if (!sessionId) {
          throw new Error('尚未與對話助手建立連接，請刷新頁面重試');
        }

        // 發送用戶訊息到 RagFlow Agent
        console.log('發送訊息到 RagFlow Agent:', inputText);
        
        // 建立一個臨時的 ID 來標識這個回應
        const tempResponseId = uuidv4();
        
        // 在開始串流回應前，先添加一個空的系統訊息
        const initialSystemMessage: ChatMessage = {
          id: tempResponseId,
          sender: 'system',
          text: '',
          timestamp: new Date(),
        };
        setMessages(prevMessages => [...prevMessages, initialSystemMessage]);
        setStreamAnswer('');
        
        // 使用 fetch API 以串流方式獲取回應
        const response = await fetch(
          `${RAGFLOW_API.DOMAIN}/api/v1/agents/${RAGFLOW_API.AGENT_ID}/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RAGFLOW_API.KEY}`
            },
            body: JSON.stringify({
              question: inputText,
              stream: true,
              session_id: sessionId,
              sync_dsl: true
            })
          }
        );
        
        // 處理串流回應
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('無法獲取回應串流');
        }
        
        // 讀取串流回應
        let combinedAnswer = '';
        const decoder = new TextDecoder();
        let buffer = '';
        let hasReceivedValidAnswer = false;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // 將 Uint8Array 轉換為字串
            const chunk = decoder.decode(value);
            buffer += chunk;
            
            // 處理完整的 SSE 消息
            let pos;
            while ((pos = buffer.indexOf('\n\n')) >= 0) {
              const message = buffer.substring(0, pos);
              buffer = buffer.substring(pos + 2);
              
              // 處理 SSE 消息，每個消息可能包含多行，每行以 'data:' 開頭
              const dataLines = message.split('\n').filter(line => line.startsWith('data:'));
              for (const dataLine of dataLines) {
                const jsonStr = dataLine.substring(5).trim();
                if (!jsonStr) continue;
                
                try {
                  const jsonData = JSON.parse(jsonStr);
                  console.log('解析的數據:', jsonData);
                  
                  // 檢查是否為最終的空訊息
                  if (jsonData.code === 0 && jsonData.data === true) {
                    console.log('接收到完成標記');
                    continue;
                  }
                  
                  // 檢查是否包含回答
                  if (jsonData.code === 0 && jsonData.data && jsonData.data.answer !== undefined) {
                    // 檢查回答是否為空白
                    if (jsonData.data.answer.trim() !== '') {
                      // 更新串流回答
                      combinedAnswer = jsonData.data.answer;
                      setStreamAnswer(combinedAnswer);
                      hasReceivedValidAnswer = true;
                      
                      // 同時更新界面上的訊息
                      setMessages(prevMessages => 
                        prevMessages.map(msg => 
                          msg.id === tempResponseId 
                            ? { ...msg, text: combinedAnswer } 
                            : msg
                        )
                      );
                    }
                    
                    // 如果有參考資料，可以在這裡處理
                    if (jsonData.data.reference) {
                      console.log('參考資料:', jsonData.data.reference);
                      // 這裡可以處理參考資料的顯示邏輯
                    }
                  }
                } catch (error) {
                  // 忽略解析錯誤，這可能是連接失敗訊息
                  console.log('解析回應時發生錯誤，可能是連接結束訊息，忽略:', error);
                }
              }
            }
          }
        } catch (error) {
          // 忽略最後可能出現的連接失敗錯誤
          console.log('讀取流時出現錯誤，可能是正常連接結束:', error);
          
          // 如果之前已經收到有效回應，就不將此視為錯誤
          if (!hasReceivedValidAnswer) {
            throw error; // 如果沒有收到任何有效回應，則拋出錯誤
          }
        }
        
        console.log('完整回應:', combinedAnswer);
        
        // 完成後更新最終系統訊息
        if (combinedAnswer.trim() === '') {
          // 如果沒有收到任何有效回應，則顯示錯誤訊息
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === tempResponseId 
                ? { 
                    ...msg, 
                    text: '抱歉，我無法處理您的請求。',
                    timestamp: new Date()
                  } 
                : msg
            )
          );
        } else {
          // 有效回應，確保最終訊息已更新
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === tempResponseId 
                ? { 
                    ...msg, 
                    text: combinedAnswer,
                    timestamp: new Date()
                  } 
                : msg
            )
          );
        }
        
      } catch (error) {
        console.error('與 RagFlow Agent 通訊時發生錯誤:', error);
        setSnackbarMessage('與 RagFlow Agent 通訊失敗');
        setSnackbarOpen(true);
        
        // 添加錯誤訊息
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          sender: 'system',
          text: '抱歉，與知識助手的連接發生問題，請稍後再試。',
          timestamp: new Date(),
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSendOwlMessage = (text: string) => {
    // 如果消息來自用戶（而不是歡迎消息或系統自動添加的消息）
    const isUserMessage = !owlChatMessages.some(msg => msg.text === text && msg.sender === 'owl');
    
    if (isUserMessage) {
      // 添加用戶消息
      const newMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'user',
        text,
        timestamp: new Date(),
      };
      setOwlChatMessages(prevMessages => [...prevMessages, newMessage]);
    } else {
      // 添加貓頭鷹博士的回覆
      const owlResponse: ChatMessage = {
        id: uuidv4(),
        sender: 'owl',
        text,
        timestamp: new Date(),
        isRead: !showOwlChat, // 如果聊天窗口未顯示，標記為未讀
      };
      setOwlChatMessages(prevMessages => [...prevMessages, owlResponse]);
      
      // 如果聊天窗口未顯示，增加未讀消息計數
      if (!showOwlChat) {
        setUnreadCount(prev => prev + 1);
      }
    }
  };

  const handleAddToNotes = async (suggestion: any) => {
    try {
      setSnackbarMessage('正在從AI生成筆記標題...');
      setSnackbarOpen(true);
      
      // 獲取筆記內容
      const noteContent = suggestion.content || '';
      
      // 預設標題（以防 API 調用失敗）
      let noteTitle = suggestion.title || '未命名筆記';
      
      // 修改 API 調用部分，添加更詳細的日誌輸出
      try {
        // 準備要發送的數據
        const apiInput = {
          "messages": [
            `System: 請根據內文生成一個簡短，10字以內的title\nHuman: ${noteContent}\nHuman: \nYou must format your output as a JSON value that adheres to a given \"JSON Schema\" instance.\n\n\"JSON Schema\" is a declarative language that allows you to annotate and validate JSON documents.\n\nFor example, the example \"JSON Schema\" instance {{\"properties\": {{\"foo\": {{\"description\": \"a list of test words\", \"type\": \"array\", \"items\": {{\"type\": \"string\"}}}}}}, \"required\": [\"foo\"]}}}}\nwould match an object with one required property, \"foo\". The \"type\" property specifies \"foo\" must be an \"array\", and the \"description\" property semantically describes it as \"a list of test words\". The items within \"foo\" must be strings.\nThus, the object {{\"foo\": [\"bar\", \"baz\"]}} is a well-formatted instance of this example \"JSON Schema\". The object {{\"properties\": {{\"foo\": [\"bar\", \"baz\"]}}}} is not well-formatted.\n\nYour output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!\n\nHere is the JSON Schema instance your output must adhere to. Include the enclosing markdown codeblock:\n\`\`\`json\n{\"type\":\"object\",\"properties\":{\"output\":{\"type\":\"object\",\"properties\":{\"response\":{\"type\":\"string\"}},\"additionalProperties\":false}},\"additionalProperties\":false,\"$schema\":\"http://json-schema.org/draft-07/schema#\"}\n\`\`\`\n`
          ],
          "estimatedTokens": 338,
          "options": {
            "lc": 1,
            "type": "not_implemented",
            "id": [
              "langchain",
              "chat_models",
              "ollama",
              "ChatOllama"
            ]
          }
        };

        // 打印 API 輸入
        console.log('======= API Input =======');
        console.log('筆記內容:', noteContent);
        console.log('完整 API 請求數據:', apiInput);
        console.log('========================');

        const response = await fetch('https://n8n.hsueh.tw/webhook/00141c75-3da3-49a7-8e07-dab74f117dcb/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(apiInput)
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // 打印 API 輸出
          console.log('======= API Output =======');
          console.log('API 響應狀態:', response.status);
          console.log('原始 API 響應:', data);
          console.log('響應類型:', typeof data);
          console.log('==========================');
          
          // 從 API 回應中提取標題
          if (data && typeof data === 'object') {
            // 檢查是否是直接返回的 JSON 對象
            if (data.output && data.output.response) {
              noteTitle = data.output.response;
              console.log('從 API 獲取的標題 (output.response):', noteTitle);
            } 
            // 檢查是否是字符串形式的 JSON
            else if (typeof data === 'string') {
              try {
                const parsedData = JSON.parse(data);
                console.log('解析後的字符串數據:', parsedData);
                if (parsedData.output && parsedData.output.response) {
                  noteTitle = parsedData.output.response;
                  console.log('從 API 字符串解析獲取的標題:', noteTitle);
                }
              } catch (parseError) {
                console.error('解析 API 回應字符串失敗:', parseError);
              }
            }
            // 檢查是否是 data.response 格式
            else if (data.response) {
              const responseStr = data.response;
              console.log('response 字段內容:', responseStr);
              console.log('response 字段類型:', typeof responseStr);
              
              // 嘗試解析 response 字段
              try {
                // 檢查 response 是否為 JSON 字符串
                if (typeof responseStr === 'string' && responseStr.includes('{"output":{"response":')) {
                  console.log('response 包含 output.response 格式');
                  const match = responseStr.match(/"response":"([^"]+)"/);
                  if (match && match[1]) {
                    noteTitle = match[1];
                    console.log('從字符串正則匹配獲取的標題:', noteTitle);
                  }
                } else if (typeof responseStr === 'object' && responseStr.output && responseStr.output.response) {
                  noteTitle = responseStr.output.response;
                  console.log('從 response 對象獲取的標題:', noteTitle);
                }
              } catch (parseError) {
                console.error('解析 response 字段失敗:', parseError);
              }
            } else {
              console.warn('API 回應格式不符預期:', data);
            }
          } else {
            console.warn('API 回應不是對象:', data);
          }
          
          // 最終獲取到的標題
          console.log('========= 最終標題 =========');
          console.log('最終使用的筆記標題:', noteTitle);
          console.log('============================');
        } else {
          console.error('API 回應錯誤狀態碼:', response.status);
          const errorText = await response.text();
          console.error('API 錯誤詳情:', errorText);
        }
      } catch (error) {
        console.error('生成筆記標題時發生錯誤:', error);
        // 使用默認標題繼續處理
      }
      
      // 確保建立新筆記時有正確的數據結構
      const newNote: Note = {
        id: uuidv4(),
        title: noteTitle,
        content: noteContent,
        timestamp: new Date(),
        tags: suggestion.tags || []
      };
      
      // 直接添加到筆記陣列中
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      
      // 在成功創建筆記後顯示標題
      setSnackbarMessage(`筆記「${noteTitle}」已新增到右側區域`);
      setSnackbarOpen(true);
      
      console.log('已添加新筆記:', newNote);
      console.log('當前筆記列表:', updatedNotes);
    } catch (error) {
      console.error('添加筆記時發生錯誤:', error, suggestion);
      setSnackbarMessage('添加筆記時發生錯誤');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteNoteConfirmOpen(true);
  };

  const confirmDeleteNote = () => {
    if (noteToDelete) {
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteToDelete));
      setSnackbarMessage('筆記已刪除');
      setSnackbarOpen(true);
    }
    setDeleteNoteConfirmOpen(false);
    setNoteToDelete(null);
  };

  const handleSaveNote = (editedNote: Note) => {
    if (selectedNote) {
      setNotes(notes.map(note => 
        note.id === selectedNote.id ? { ...editedNote, timestamp: new Date() } : note
      ));
      setSnackbarMessage('筆記已更新');
      setSnackbarOpen(true);
    }
    setSelectedNote(null);
    setIsNoteDialogOpen(false);
  };

  useEffect(() => {
    // 檢查環境變數，只在特定環境下才啟用 Socket.IO 連接
    const shouldConnectSocket = import.meta.env.VITE_USE_SOCKET_IO === 'true';
    
    if (!shouldConnectSocket) {
      console.log('Socket.IO 連接已禁用，設置 VITE_USE_SOCKET_IO=true 環境變數來啟用');
      return;
    }
      
    try {
      const socket = io('http://localhost:3000', { 
        reconnectionAttempts: 3,
        timeout: 5000,
        autoConnect: true
      });
      
      socket.on('connect', () => console.log('Connected to server'));
      socket.on('connect_error', (error) => {
        console.log('無法連接到 Socket.IO 服務器:', error.message);
      });
      socket.on('message', (message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
      });
      
      return () => { 
        socket.disconnect(); 
      };
    } catch (error) {
      console.error('Socket.io 初始化錯誤:', error);
    }
  }, []);

  // 在組件加載時建立 RagFlow Agent session
  useEffect(() => {
    async function initializeRagFlowSession() {
      if (!isRagFlowConfigured()) {
        console.log('RagFlow API 未配置，跳過初始化');
        setIsInitializing(false);
        return;
      }
      
      try {
        console.log('初始化 RagFlow Agent 會話...');
        
        // 生成一個唯一的用戶ID
        const userId = uuidv4();
        console.log('使用用戶ID:', userId);
        
        const createSessionResponse = await fetch(
          `${RAGFLOW_API.DOMAIN}/api/v1/agents/${RAGFLOW_API.AGENT_ID}/sessions?user_id=${userId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RAGFLOW_API.KEY}`
            },
            body: JSON.stringify({
              // 可以在此處添加 Begin 組件中指定的其他參數
            })
          }
        );
        
        const sessionData = await createSessionResponse.json();
        console.log('RagFlow 初始化響應:', sessionData);
        
        if (sessionData.code === 0 && sessionData.data && sessionData.data.id) {
          const newSessionId = sessionData.data.id;
          setSessionId(newSessionId);
          console.log('創建 RagFlow 會話成功:', newSessionId);
          
          // 添加初始助手訊息 (如果有且不是空字串)
          if (sessionData.data.message && 
              sessionData.data.message.length > 0 && 
              sessionData.data.message[0].content && 
              sessionData.data.message[0].content.trim() !== '') {
            const welcomeMessage: ChatMessage = {
              id: uuidv4(),
              sender: 'system',
              text: sessionData.data.message[0].content,
              timestamp: new Date(),
            };
            setMessages(prevMessages => [...prevMessages, welcomeMessage]);
          } else {
            // 如果沒有初始訊息或是空字串，添加一個默認歡迎訊息
            const defaultWelcomeMessage: ChatMessage = {
              id: uuidv4(),
              sender: 'system',
              text: '您好！請輸入你想要了解的名詞吧！',
              timestamp: new Date(),
            };
            setMessages(prevMessages => [...prevMessages, defaultWelcomeMessage]);
          }
          
          // 解決第一次發送訊息會跳錯誤的問題
          // 在 session 建立成功後，主動發送一個空白字符到 RagFlow
          try {
            console.log('發送初始化請求到 RagFlow...');
            const initResponse = await fetch(
              `${RAGFLOW_API.DOMAIN}/api/v1/agents/${RAGFLOW_API.AGENT_ID}/completions`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${RAGFLOW_API.KEY}`
                },
                body: JSON.stringify({
                  question: " ", // 空白字符
                  stream: false, // 不使用串流
                  session_id: newSessionId
                })
              }
            );
            
            const initData = await initResponse.json();
            console.log('RagFlow 初始化請求響應:', initData);
            // 忽略回應，不顯示在對話中
          } catch (error) {
            console.log('RagFlow 初始化請求失敗，但這是預期中的，繼續執行:', error);
            // 忽略這個錯誤，因為這只是為了解決第一次發送的問題
          }
          
          setInitError(null);
        } else {
          console.error('建立 RagFlow 會話失敗:', sessionData);
          setInitError('無法連接到知識助手，請稍後再試');
          setSnackbarMessage('連接 RagFlow Agent 失敗');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('RagFlow 初始化錯誤:', error);
        setInitError('連接知識助手時發生錯誤，請檢查網路連接');
        setSnackbarMessage('連接 RagFlow Agent 發生錯誤');
        setSnackbarOpen(true);
      } finally {
        setIsInitializing(false);
      }
    }

    initializeRagFlowSession();
  }, []);

  // 獲取文件類型的圖標
  const getDocumentIcon = (fileName: string) => {
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    const iconInfo = documentIcons[fileExtension as keyof typeof documentIcons] || documentIcons.default;
    return <iconInfo.icon sx={{ mr: 2, color: iconInfo.color }} />;
  };

  // 新手教學功能處理函數
  const handleNextTutorial = () => {
    if (tutorialStep < 2) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
    }
  };
  
  const handleSkipTutorial = () => {
    setShowTutorial(false);
    setTutorialSkipped(true);
  };
  
  // 在組件加載時檢查是否已經完成過教學
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (tutorialCompleted === 'true') {
      setShowTutorial(false);
      setTutorialSkipped(true);
    }
  }, []);
  
  // 在教學完成後保存狀態
  useEffect(() => {
    if (!showTutorial && (tutorialStep > 2 || tutorialSkipped)) {
      localStorage.setItem('tutorialCompleted', 'true');
    }
  }, [showTutorial, tutorialStep, tutorialSkipped]);

  return (
    <AppContainer>
      {/* 新手教學毛玻璃遮罩 */}
      {showTutorial && <TutorialOverlay />}
      
      {/* 左側面板 - 知識來源 */}
      <SourcePanel>
        <Box>
          <Box sx={{ display: 'flex', gap: 1, position: 'relative' }} ref={fileButtonRef}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              multiple
              accept=".pdf,.docx,.txt,.ppt,.pptx,.csv,.xlsx"
            />
            <ActionButton 
              startIcon={<AddIcon />} 
              fullWidth
              onClick={() => fileInputRef.current?.click()}
              sx={showTutorial && tutorialStep === 1 ? { 
                position: 'relative',
                zIndex: 1500,
                boxShadow: '0 0 15px rgba(255, 255, 255, 0.7)' 
              } : {}}
            >
              新增知識檔案
            </ActionButton>
            
            {/* 教學步驟 1: 檔案上傳提示 - 修改高亮區域 */}
            {showTutorial && tutorialStep === 1 && fileButtonRef.current && (
              <>
                <Box 
                  sx={{
                    position: 'absolute',
                    top: fileButtonRef.current.offsetTop,
                    left: fileButtonRef.current.offsetLeft,
                    width: fileButtonRef.current.offsetWidth,
                    height: fileButtonRef.current.offsetHeight,
                    borderRadius: '4px',
                    zIndex: 1460,
                    backgroundColor: 'transparent',
                  }}
                />
                <HighlightArea
                  sx={{
                    top: fileButtonRef.current.offsetTop - 4,
                    left: fileButtonRef.current.offsetLeft - 4,
                    width: fileButtonRef.current.offsetWidth + 8,
                    height: fileButtonRef.current.offsetHeight + 8,
                  }}
                />
              </>
            )}
            
            {/* 教學步驟 1: 檔案上傳提示 */}
            <Fade in={showTutorial && tutorialStep === 1}>
              <TutorialBubble sx={{
                position: 'absolute',
                top: '100%',
                left: '15px',  // 改為左對齊而非居中
                transform: 'none',  // 移除 translateX(-50%)
                marginTop: '16px',
                maxWidth: '320px',  // 稍微縮小寬度避免溢出
                '&:after': {
                  top: '-10px',
                  left: '30px',  // 調整箭頭位置
                  marginLeft: '0',  // 移除 margin-left
                }
              }}>
                <Typography variant="body1" sx={{ fontSize: '16px', color: '#333333' }}>
                  第一步，您可以先在這裡新增論文的檔案
                </Typography>
                <TutorialButtons>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    sx={{ color: '#666', borderColor: '#ccc' }}  // 調整按鈕顏色
                    onClick={handleSkipTutorial}
                  >
                    跳過教學
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained" 
                    color="error"
                    onClick={handleNextTutorial}
                  >
                    下一步
                  </Button>
                </TutorialButtons>
              </TutorialBubble>
            </Fade>
          </Box>
          <Typography variant="subtitle2" sx={{ color: '#666', mt: 2 }}>
            已上傳的文件
          </Typography>
        </Box>
        <SourceContent>
          <List>
            {documents.map((doc) => (
              <DocumentListItem key={doc.id}>
                {getDocumentIcon(doc.name)}
                <ListItemText 
                  primary={doc.name}
                  secondary={doc.size}
                  primaryTypographyProps={{
                    style: { fontWeight: 500, fontSize: '0.9rem' }
                  }}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    size="small"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </DocumentListItem>
            ))}
          </List>
        </SourceContent>

        {/* 刪除確認對話框 */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <DialogTitle>確認刪除</DialogTitle>
          <DialogContent>
            <DialogContentText>
              確定要刪除這個檔案嗎？此操作無法復原。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>取消</Button>
            <Button onClick={confirmDelete} color="error">
              刪除
            </Button>
          </DialogActions>
        </Dialog>
      </SourcePanel>

      {/* 中間面板 - 對話 */}
      <ChatPanel>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#333' }}>智慧對話助手</Typography>
        </Box>

        <ChatContent>
          {isInitializing && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 4, p: 2 }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body1">正在連接知識助手，請稍候...</Typography>
            </Box>
          )}

          {!isInitializing && initError && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 4, p: 2, borderRadius: 2, bgcolor: '#ffebee' }}>
              <Typography variant="body1" color="error">{initError}</Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={() => window.location.reload()}
              >
                重新連接
              </Button>
            </Box>
          )}

          {messages.map((message) => (
            <Box 
              key={message.id} 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
                px: 2
              }}
            >
              {message.sender === 'user' ? (
                <UserMessageBubble>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {message.text}
                  </Typography>
                  <MessageTime>
                    {new Date(message.timestamp).toLocaleTimeString('zh-TW', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </MessageTime>
                </UserMessageBubble>
              ) : (
                <SystemMessageBubble>
                  <MessageContent>
                    <MessageHeader>
                      <MessageText variant="body1">
                        {message.text}
                      </MessageText>
                      <Tooltip title="加入到筆記">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const noteData = {
                              title: '', // 現在不再需要這裡指定標題，將由 API 生成
                              content: message.text,
                              tags: []
                            };
                            
                            handleAddToNotes(noteData);
                          }}
                          sx={{ 
                            padding: '4px',
                            backgroundColor: '#e3f2fd',
                            '&:hover': {
                              backgroundColor: '#bbdefb'
                            }
                          }}
                        >
                          <BookmarkIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    </MessageHeader>
                    <MessageTime>
                      {new Date(message.timestamp).toLocaleTimeString('zh-TW', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </MessageTime>
                  </MessageContent>
                </SystemMessageBubble>
              )}
              {message.suggestions && (
                <Box sx={{ mt: 2, width: '100%' }}>
                  <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block' }}>
                    點擊下方建議卡片添加到學習筆記
                  </Typography>
                  {message.suggestions.map((suggestion) => (
                    <Paper
                      key={suggestion.id}
                      sx={{
                        p: 1.5,
                        mt: 1,
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: '60px',
                        border: '1px solid #e0e0e0',
                        '&:hover': {
                          backgroundColor: '#eef6fb',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                          borderColor: '#bbdefb'
                        },
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => {
                        console.log('卡片被點擊，準備添加筆記:', suggestion);
                        // 確保我們傳遞完整的內容，但不需要手動設置標題
                        const noteData = {
                          content: suggestion.content,
                          tags: suggestion.tags || []
                        };
                        handleAddToNotes(noteData);
                      }}
                    >
                      <Box sx={{ flex: 1, mr: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.9rem' }}>
                          {suggestion.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: '0.8rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {suggestion.content}
                        </Typography>
                      </Box>
                      <Tooltip title="加入到筆記">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            // 確保我們傳遞完整的內容，但不需要手動設置標題
                            const noteData = {
                              content: suggestion.content,
                              tags: suggestion.tags || []
                            };
                            handleAddToNotes(noteData);
                          }}
                          sx={{ 
                            backgroundColor: '#e3f2fd',
                            '&:hover': {
                              backgroundColor: '#bbdefb'
                            }
                          }}
                        >
                          <BookmarkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>正在思考回應中...</Typography>
            </Box>
          )}
        </ChatContent>

        {/* 中間面板輸入區域 */}
        <Box sx={{ position: 'relative' }} ref={inputAreaRef}>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="有任何問題都可以問我..."
            disabled={isLoading || isInitializing || !!initError}
            onKeyDown={(e) => {
              // 按下 Enter 且沒有按下 Shift 鍵時發送消息
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // 防止換行
                handleSendMessage();
              }
            }}
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#e0e0e0' },
              },
              ...(showTutorial && tutorialStep === 2 ? { 
                position: 'relative',
                zIndex: 1500,
                boxShadow: '0 0 15px rgba(255, 255, 255, 0.7)' 
              } : {})
            }}
          />
          
          {/* 教學步驟 2: 發問提示 - 修改高亮區域 */}
          {showTutorial && tutorialStep === 2 && inputAreaRef.current && (
            <>
              <Box 
                sx={{
                  position: 'absolute',
                  top: inputAreaRef.current.offsetTop,
                  left: inputAreaRef.current.offsetLeft,
                  width: inputAreaRef.current.offsetWidth,
                  height: inputAreaRef.current.offsetHeight,
                  borderRadius: '8px',
                  zIndex: 1460,
                  backgroundColor: 'transparent',
                }}
              />
              <HighlightArea
                sx={{
                  top: inputAreaRef.current.offsetTop - 4,
                  left: inputAreaRef.current.offsetLeft - 4,
                  width: inputAreaRef.current.offsetWidth + 8,
                  height: inputAreaRef.current.offsetHeight + 8,
                  borderRadius: '8px',
                }}
              />
            </>
          )}
          
          {/* 教學步驟 2: 發問提示 */}
          <Fade in={showTutorial && tutorialStep === 2}>
            <TutorialBubble sx={{
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '16px',
              '&:after': {
                bottom: '-10px',
                left: '50%',
                marginLeft: '-10px',
              }
            }}>
              <Typography variant="body1" sx={{ fontSize: '16px', color: '#333333' }}>
                第二步，您可以在這邊開始針對你想要了解的「名詞」發問
              </Typography>
              <TutorialButtons>
                <Button 
                  size="small" 
                  variant="outlined" 
                  sx={{ color: '#666', borderColor: '#ccc' }}  // 調整按鈕顏色
                  onClick={handleSkipTutorial}
                >
                  跳過教學
                </Button>
                <Button 
                  size="small" 
                  variant="contained" 
                  color="error"
                  onClick={handleNextTutorial}
                >
                  完成
                </Button>
              </TutorialButtons>
            </TutorialBubble>
          </Fade>
          
          <Box sx={{
            position: 'absolute',
            right: '24px',
            bottom: '24px',
            display: 'flex',
            gap: 1,
          }}>
            <IconButton
              size="small"
              onClick={handleSendMessage}
              disabled={isLoading || !inputText.trim() || isInitializing || !!initError}
              sx={{ color: '#1976d2' }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </ChatPanel>

      {/* 右側面板 - 學習筆記 */}
      <StudioPanel>
        <Typography variant="h6" sx={{ color: '#333', mb: 2 }}>學習筆記</Typography>
        
        <StudioContent>
          {notes.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', mt: 4 }}>
              尚未添加筆記，請點擊對話中的書籤圖示新增筆記
            </Typography>
          ) : (
            notes.map((note) => (
              <NoteBlock 
                key={note.id}
                onClick={() => {
                  setSelectedNote(note);
                  setIsNoteDialogOpen(true);
                }}
              >
                <NoteTitle variant="subtitle1">
                  <span>{note.title}</span>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </NoteTitle>
                <Box sx={{ mb: 1 }}>
                  {(note.tags || []).map((tag: string) => (
                    <TagChip
                      key={tag}
                      label={tag}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                  ))}
                </Box>
                <NoteContent variant="body2">
                  {note.content}
                </NoteContent>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block',
                    mt: 1,
                    color: 'text.secondary'
                  }}
                >
                  最後更新：{new Date(note.timestamp).toLocaleString('zh-TW')}
                </Typography>
              </NoteBlock>
            ))
          )}
        </StudioContent>
      </StudioPanel>

      {/* 貓頭鷹博士 */}
      <OwlContainer>
        <OwlMessage>
          <Typography variant="body2">{owlMessage}</Typography>
        </OwlMessage>
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          invisible={unreadCount === 0}
          overlap="circular"
          sx={{
            '& .MuiBadge-badge': {
              right: 30,
              top: 30,
              minWidth: '22px',
              height: '22px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }
          }}
        >
          <OwlDoctor
            ishovered={isOwlHovered ? 'true' : 'false'}
            onMouseEnter={() => setIsOwlHovered(true)}
            onMouseLeave={() => setIsOwlHovered(false)}
            onClick={() => setShowOwlChat(true)}
          />
        </Badge>
      </OwlContainer>

      {/* 貓頭鷹聊天室 */}
      {showOwlChat && (
        <OwlChatRoom
          messages={owlChatMessages}
          unreadCount={unreadCount}
          onClose={() => setShowOwlChat(false)}
          onSend={handleSendOwlMessage}
          onRead={() => setUnreadCount(0)}
        />
      )}

      {/* 筆記編輯對話框 */}
      <NoteDialog
        open={isNoteDialogOpen}
        note={selectedNote}
        onClose={() => {
          setIsNoteDialogOpen(false);
          setSelectedNote(null);
        }}
        onSave={handleSaveNote}
      />

      {/* 筆記刪除確認對話框 */}
      <Dialog
        open={deleteNoteConfirmOpen}
        onClose={() => setDeleteNoteConfirmOpen(false)}
      >
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            確定要刪除這個筆記嗎？此操作無法復原。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteNoteConfirmOpen(false)}>取消</Button>
          <Button onClick={confirmDeleteNote} color="error" autoFocus>
            刪除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示訊息 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </AppContainer>
  );
} 