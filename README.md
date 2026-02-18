# YouTube 搜尋下載器

使用 **Angular + Sakai-NG (PrimeNG)** 前端 與 **NestJS** 後端，透過 **yt-dlp** 搜尋並下載 YouTube 影片或純音樂。

## 快速啟動

### 方法 1：Docker Compose（推薦）

```bash
# 1. 設定 API Key
cp .env.example .env
# 編輯 .env 填入你的 YOUTUBE_API_KEY

# 2. 啟動
docker compose up --build
```

- 前端：http://localhost:4200
- 後端：http://localhost:3000
- API 文件：http://localhost:3000/api/docs

### 方法 2：本地開發

```bash
# 後端
cd backend
npm install
npm run start:dev

# 前端（另一個終端）
cd frontend
npm install
ng serve
```

## 環境需求

| 需求                 | 版本                                      |
| -------------------- | ----------------------------------------- |
| Node.js              | >= 18.x                                   |
| yt-dlp               | 已安裝                                    |
| ffmpeg               | 已安裝                                    |
| YouTube Data API Key | [申請](https://console.cloud.google.com/) |

## 功能

- 🔍 搜尋 YouTube 影片
- 🎵 下載純音樂 (MP3)
- 🎬 下載影片 (MP4)
- 📋 下載歷史紀錄
- 📄 Swagger API 文件
