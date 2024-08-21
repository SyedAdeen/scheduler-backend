FROM node:16.16-alpine3.15

EXPOSE 8888

WORKDIR /app

COPY ./tsconfig.json /app/
COPY ./tsconfig.build.json /app/
COPY ./package.json /app/
COPY ./package-lock.json /app/
COPY ./nest-cli.json /app/
COPY ./.env /app/
RUN npm install

CMD npm run start:dev
