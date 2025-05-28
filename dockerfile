FROM nginx:alpine
COPY dist/gestion-candidatures/browser /usr/share/nginx/html
EXPOSE 80
