FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install --prod

COPY dist/ ./dist/

EXPOSE 4000

CMD ["node", "dist/index.js"]
