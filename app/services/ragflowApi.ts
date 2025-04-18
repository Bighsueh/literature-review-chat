import { RAGFLOW_API, isRagFlowConfigured } from '../utils/env';

/**
 * RagFlow API 服務
 */
class RagFlowApiService {
  private domain: string;
  private apiKey: string;
  private datasetId: string;

  constructor() {
    this.domain = RAGFLOW_API.DOMAIN;
    this.apiKey = RAGFLOW_API.KEY;
    this.datasetId = RAGFLOW_API.DATASET_ID;
  }

  /**
   * 檢查 API 設定是否完整
   */
  isConfigured(): boolean {
    return isRagFlowConfigured();
  }

  /**
   * 上傳文件到 RagFlow
   * @param file 要上傳的文件
   * @returns 上傳結果
   */
  async uploadDocument(file: File): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('RagFlow API 尚未設定，請檢查環境變數');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 根據文件類型設置合適的 metadata
      const fileType = this.getFileType(file.name);
      formData.append('metadata', JSON.stringify({
        filename: file.name,
        content_type: file.type || this.getMimeType(fileType),
        file_type: fileType,
        size: file.size,
      }));

      const response = await fetch(`${this.domain}/api/v1/datasets/${this.datasetId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`上傳文件失敗: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('上傳文件到 RagFlow 時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 從文件名獲取文件類型
   */
  private getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return extension;
  }

  /**
   * 根據文件類型獲取 MIME 類型
   */
  private getMimeType(fileType: string): string {
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'csv': 'text/csv',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return mimeTypes[fileType] || 'application/octet-stream';
  }
}

// 導出服務實例
export const ragFlowApi = new RagFlowApiService(); 