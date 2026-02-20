FROM node:25.6.1-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig*.json ./
COPY src ./src

RUN yarn build

EXPOSE 3000

CMD ["node", "dist/main.js"]
