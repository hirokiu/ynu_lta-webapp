FROM node:22-bookworm-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
ARG FIREBASE_WEB_CONFIG
ARG FIREBASE_PROJECT_ID
ENV VUE_APP_FIREBASE_CONFIG=$FIREBASE_WEB_CONFIG
ENV VUE_APP_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
RUN node -e 'const c=JSON.parse(process.env.VUE_APP_FIREBASE_CONFIG); if(!c.apiKey || !c.appId || !c.authDomain || c.projectId!==process.env.VUE_APP_FIREBASE_PROJECT_ID) process.exit(1)'
# Vue CLI 4 uses Webpack 4; temporary compatibility until the Vue upgrade.
RUN NODE_OPTIONS=--openssl-legacy-provider npm run build
FROM nginx:1.30.7-alpine@sha256:bef154735288bc38d99fac41ae63730684bcc661503673a04a0f9bc526ba8598
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx_config/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
