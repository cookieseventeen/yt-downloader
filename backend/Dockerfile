FROM node:20-slim

# 安裝 yt-dlp 與 ffmpeg
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg curl nodejs && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p downloads

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
