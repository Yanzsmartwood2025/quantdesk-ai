FROM nginxinc/nginx-unprivileged:stable-alpine
COPY --chown=101:101 default.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 data/ /usr/share/nginx/html/beat-data/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
