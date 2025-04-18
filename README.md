# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

## RagFlow API 整合

本應用已整合 RagFlow API，可將上傳的文件自動同步到 RagFlow 知識庫中。若要啟用此功能，請按照以下步驟操作：

### 環境變數設定

1. 在專案根目錄中複製 `.env.example` 檔案並重命名為 `.env`：

```bash
cp .env.example .env
```

2. 在 `.env` 文件中設定您的 RagFlow API 參數：

```
RAGFLOW_API_DOMAIN=https://api.ragflow.io  # RagFlow API 的域名
RAGFLOW_API_KEY=your_api_key_here          # 您的 RagFlow API 金鑰
RAGFLOW_DATASET_ID=your_dataset_id_here    # 您要上傳文件的資料集 ID
```

### 使用方式

一旦設定完成，透過左側面板上傳的文件將自動：

1. 顯示在應用程式的左側面板中
2. 同時上傳到 RagFlow 指定的資料集中

文件上傳到 RagFlow 後，您可以利用 RagFlow 的各種功能對文件進行處理，如：
- 文件解析
- 文本分塊
- 向量化
- 知識庫查詢等

### 故障排除

如果文件上傳到 RagFlow 失敗，請檢查：

1. `.env` 文件中的 API 設定是否正確
2. 網絡連接是否正常
3. RagFlow API 服務是否可用
4. 上傳的文件格式是否被 RagFlow 支援

---

Built with ❤️ using React Router.
