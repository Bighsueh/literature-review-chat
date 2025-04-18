import React, { lazy, Suspense, useEffect } from 'react';
import { Paper } from '@mui/material';

const ReactQuill = lazy(() => import('react-quill'));

interface QuillEditorProps {
  value: string;
  readOnly?: boolean;
}

export default function QuillEditor({ value, readOnly = true }: QuillEditorProps) {
  useEffect(() => {
    // 動態導入樣式表
    import('react-quill/dist/quill.snow.css');
  }, []);

  return (
    <Paper sx={{ p: 1, mt: 1, backgroundColor: '#f5f5f5' }}>
      <Suspense fallback={<p>載入編輯器...</p>}>
        <ReactQuill
          value={value}
          readOnly={readOnly}
          theme="snow"
        />
      </Suspense>
    </Paper>
  );
} 