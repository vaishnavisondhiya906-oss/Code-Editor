FROM node:20

RUN apt-get update && apt-get install -y \
    default-jdk \
    g++ \
    python3

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 10000

CMD ["node", "server/API.js"]