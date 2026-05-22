FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3004

ENV NODE_ENV=production

CMD ["npm", "start"]
