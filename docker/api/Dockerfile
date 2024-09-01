FROM node:22-alpine3.19

WORKDIR /app

COPY ./tsconfig.json /app/
COPY ./tsconfig.build.json /app/
COPY ./package.json /app/
COPY ./yarn.lock /app/
COPY ./nest-cli.json /app/
COPY ./.env /app/

RUN yarn

EXPOSE 3001 

CMD yarn start:dev
