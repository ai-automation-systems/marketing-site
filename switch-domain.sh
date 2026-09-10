#!/bin/sh
# Переключение сайта на новый домен. Запускать ТОЛЬКО после того, как
# 2vlad.ru куплен и его DNS направлен на GitHub Pages (A-записи 185.199.108–111.153).
# Проверить готовность: curl -I https://2vlad.ru
set -e
cd "$(dirname "$0")"
sed -i '' 's|https://srbstudio\.ru|https://2vlad.ru|g' \
  ./*.html robots.txt sitemap.xml
printf '2vlad.ru\n' > CNAME
echo "Домен переключён на 2vlad.ru. Осталось: git add -A && git commit && git push"
echo "После пуша GitHub выпустит сертификат — это может занять до суток."
