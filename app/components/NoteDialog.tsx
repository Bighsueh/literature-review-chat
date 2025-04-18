import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Chip,
  IconButton,
  Typography,
  Autocomplete,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { Note } from '../types/index';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    width: '800px',
    maxWidth: '95vw',
    maxHeight: '80vh',
  },
}));

const EditorContainer = styled(Box)({
  marginTop: '16px',
});

const TagContainer = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '16px',
});

interface NoteDialogProps {
  open: boolean;
  note: Note | null;
  onClose: () => void;
  onSave: (note: Note) => void;
}

const suggestedTags = [
  '深度學習',
  '機器學習',
  '神經網絡',
  '人工智慧',
  '數據分析',
  '演算法',
];

export default function NoteDialog({ open, note, onClose, onSave }: NoteDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
    }
  }, [note]);

  const handleSave = () => {
    if (title.trim() && content.trim()) {
      onSave({
        id: note?.id || '',
        title: title.trim(),
        content: content.trim(),
        tags,
        timestamp: new Date(),
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setTags([]);
    onClose();
  };

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setNewTag('');
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {note ? '編輯筆記' : '新增筆記'}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="標題"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          variant="outlined"
        />
        
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>標籤</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Autocomplete
            freeSolo
            options={suggestedTags.filter(tag => !tags.includes(tag))}
            value={newTag}
            onChange={(_, value) => value && handleAddTag(value)}
            onInputChange={(_, value) => setNewTag(value)}
            sx={{ width: 200 }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="新增標籤"
              />
            )}
          />
          <IconButton 
            size="small" 
            onClick={() => handleAddTag(newTag)}
            disabled={!newTag || tags.includes(newTag)}
          >
            <AddIcon />
          </IconButton>
        </Box>
        
        <TagContainer>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() => handleDeleteTag(tag)}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
        </TagContainer>

        <EditorContainer>
          <TextField
            fullWidth
            multiline
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="開始編寫筆記內容..."
            variant="outlined"
          />
        </EditorContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>取消</Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={!title.trim() || !content.trim()}
        >
          儲存
        </Button>
      </DialogActions>
    </StyledDialog>
  );
} 