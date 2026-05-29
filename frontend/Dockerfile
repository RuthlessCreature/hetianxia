# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
ARG HTX_APP_NAME=高纳AI
ARG HTX_COMPANY_NAME=高纳科技
ARG HTX_PLATFORM_NAME=工业视觉平台
ARG HTX_THEME=light
ARG HTX_LAYOUT=sidebar
ENV HTX_APP_NAME=$HTX_APP_NAME
ENV HTX_COMPANY_NAME=$HTX_COMPANY_NAME
ENV HTX_PLATFORM_NAME=$HTX_PLATFORM_NAME
ENV HTX_THEME=$HTX_THEME
ENV HTX_LAYOUT=$HTX_LAYOUT
COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com && npm install
COPY . .
RUN npm run build

# Stage 2: Nginx serving built frontend
FROM nginx:alpine
RUN apk add --no-cache gettext
ENV HTX_APP_NAME=高纳AI
ENV HTX_COMPANY_NAME=高纳科技
ENV HTX_PLATFORM_NAME=工业视觉平台
ENV HTX_THEME=light
ENV HTX_LAYOUT=sidebar
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["sh", "-c", "envsubst '${HTX_APP_NAME} ${HTX_COMPANY_NAME} ${HTX_PLATFORM_NAME} ${HTX_THEME} ${HTX_LAYOUT}' < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js && nginx -g 'daemon off;'"]
