FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/app/data \
    UPLOADS_DIR=/app/public/uploads

WORKDIR /app

# Faqat production bog'liqliklar: express, cors, multer — hammasi toza JS.
# Hech qanday native kompilyatsiya yo'q, shuning uchun serverda RAM yemaydi.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN mkdir -p /app/data /app/public/uploads

EXPOSE 3000

CMD ["node", "server.js"]
