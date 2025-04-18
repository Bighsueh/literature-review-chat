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

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'user',
        text: inputText,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setInputText('');

      // 根據使用者輸入生成相關回應
      setTimeout(() => {
        const userInput = inputText.toLowerCase();
        let systemResponse: ChatMessage;

        if (userInput.includes('深度學習') || userInput.includes('deep learning')) {
          const suggestion = {
            id: uuidv4(),
            title: '深度學習筆記',
            content: `基於您的問題「${inputText}」，以下是重要的深度學習概念：\n1. 神經網絡架構\n2. 參數優化\n3. 模型評估`,
            timestamp: new Date(),
            tags: ['深度學習', '神經網絡', '機器學習']
          } as Note;

          systemResponse = {
            id: uuidv4(),
            sender: 'system',
            text: `關於您提到的${inputText}，我有以下見解：\n\n深度學習是機器學習的一個重要分支，它通過多層神經網絡來模擬人腦的學習過程。根據您的問題，我建議關注以下幾個要點：`,
            timestamp: new Date(),
            suggestions: [suggestion]
          };
        } else {
          const suggestion = {
            id: uuidv4(),
            title: '學習筆記',
            content: `根據您的問題「${inputText}」整理的要點：\n1. 主要概念\n2. 應用場景\n3. 注意事項`,
            timestamp: new Date(),
            tags: ['學習筆記']
          } as Note;

          systemResponse = {
            id: uuidv4(),
            sender: 'system',
            text: `我已經分析了您的問題「${inputText}」，以下是我的建議：`,
            timestamp: new Date(),
            suggestions: [suggestion]
          };
        }
        setMessages(prev => [...prev, systemResponse]);
      }, 1000);
    }
  };

  const handleSendOwlMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    setOwlChatMessages([...owlChatMessages, newMessage]);

    // 模擬貓頭鷹博士回應
    setTimeout(() => {
      const owlResponse: ChatMessage = {
        id: uuidv4(),
        sender: 'owl',
        text: '很好的問題！讓我幫您找找相關的資料...',
        timestamp: new Date(),
        isRead: false,
      };
      setOwlChatMessages(prev => [...prev, owlResponse]);
      setUnreadCount(prev => prev + 1);
    }, 1000);
  };

  const handleAddToNotes = (suggestion: any) => {
    try {
      // 確保建立新筆記時有正確的數據結構
      const newNote: Note = {
        id: uuidv4(),
        title: suggestion.title || '未命名筆記',
        content: suggestion.content || '',
        timestamp: new Date(),
        tags: suggestion.tags || []
      };
      
      // 直接添加到筆記陣列中
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      
      // 顯示成功訊息
      setSnackbarMessage('筆記已新增到右側區域');
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

  // 獲取文件類型的圖標
  const getDocumentIcon = (fileName: string) => {
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    const iconInfo = documentIcons[fileExtension as keyof typeof documentIcons] || documentIcons.default;
    return <iconInfo.icon sx={{ mr: 2, color: iconInfo.color }} />;
  };

  return (
    <AppContainer>
      {/* 左側面板 - 知識來源 */}
      <SourcePanel>
        <Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
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
            >
              新增知識檔案
            </ActionButton>
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
          {messages.map((message) => (
            <MessageContainer key={message.id}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" 
                    sx={{ whiteSpace: 'pre-line' }}
                  >
                    {message.text}
                  </Typography>
                  {message.suggestions && (
                    <Box sx={{ mt: 2 }}>
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
                            handleAddToNotes(suggestion);
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
                                e.stopPropagation(); // 防止觸發父元素的點擊事件
                                handleAddToNotes(suggestion);
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
              </Box>
            </MessageContainer>
          ))}
        </ChatContent>

        {/* 中間面板輸入區域 */}
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="開始輸入..."
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
            }}
          />
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