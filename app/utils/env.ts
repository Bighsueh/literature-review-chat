/**
 * 環境變數存取工具
 */

// RagFlow API 設定
export const RAGFLOW_API = {
  DOMAIN: import.meta.env.VITE_RAGFLOW_API_DOMAIN || 'https://api.ragflow.io',
  KEY: import.meta.env.VITE_RAGFLOW_API_KEY || '',
  DATASET_ID: import.meta.env.VITE_RAGFLOW_DATASET_ID || '',
};

// 檢查 RagFlow API 設定是否完整
export const isRagFlowConfigured = (): boolean => {
  return Boolean(RAGFLOW_API.KEY && RAGFLOW_API.DATASET_ID);
};

// 應用程式設定
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Literature Review',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
}; 