// 載入環境變數配置
const dotenv = require('dotenv');
const path = require('path');

// 嘗試載入 .env 文件
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (result.error) {
  console.warn('未找到 .env 文件或讀取錯誤，將使用默認環境變數設定');
}

// 導出環境變數檢查函數
module.exports = {
  isRagFlowConfigured: () => {
    return Boolean(
      process.env.RAGFLOW_API_KEY && 
      process.env.RAGFLOW_DATASET_ID
    );
  },
  getRagFlowConfig: () => {
    return {
      domain: process.env.RAGFLOW_API_DOMAIN || 'https://api.ragflow.io',
      apiKey: process.env.RAGFLOW_API_KEY || '',
      datasetId: process.env.RAGFLOW_DATASET_ID || '',
    };
  }
}; 