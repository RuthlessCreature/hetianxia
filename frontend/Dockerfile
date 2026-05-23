# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
ARG VITE_APP_NAME=高纳AI
ENV VITE_APP_NAME=$VITE_APP_NAME
COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com && npm install
COPY . .
RUN npm run build

# Stage 2: Nginx serving built frontend
FROM nginx:alpine
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
