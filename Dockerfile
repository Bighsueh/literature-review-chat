FROM node:20-alpine AS builder

WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝所有依賴（包括開發依賴）
RUN npm ci --legacy-peer-deps

# 複製其餘檔案
COPY . .

# 建置應用程式
RUN npm run build

# 生產環境
FROM node:20-alpine

WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝所有依賴（包括 uuid 等必要套件）
RUN npm ci --legacy-peer-deps

# 從 builder 階段複製建置結果
COPY --from=builder /app/build ./build

# 複製靜態檔案
COPY public ./public
COPY 貓頭鷹博士_擺手.gif ./public/

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 啟動應用程式
CMD ["npm", "run", "start"]