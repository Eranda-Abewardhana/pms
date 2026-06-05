FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Hugging Face Spaces requires port 7860
ENV PORT=7860
EXPOSE 7860

CMD ["node", "server.js"]
