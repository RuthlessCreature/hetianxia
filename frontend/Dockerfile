# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
ARG VITE_APP_NAME=高纳AI
ARG VITE_COMPANY_NAME=高纳科技
ARG VITE_THEME=light
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_COMPANY_NAME=$VITE_COMPANY_NAME
ENV VITE_THEME=$VITE_THEME
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
