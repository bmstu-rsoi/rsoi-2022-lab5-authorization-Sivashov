# image
FROM node

# место, где мы будем внутри контейнера
WORKDIR /api/v1

# устанавливаем зависимости
ADD package*.json ./

RUN npm install
# если собираем код в прод, то 
# RUN npm ci --only-production

ADD . .

ENV PORT 8050

# делаем порт досутпным извне контейнера
# необходимо для браузера, чтобы отправлять запросы в наше приложение
EXPOSE $PORT

# команда для запуска, когда контейнер готов
CMD ["npm", "run", "privilegies-service"]