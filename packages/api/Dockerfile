FROM node:9-alpine

ADD . /app

WORKDIR /app

EXPOSE 3000

ENV NODE_ENV=production PORT=3000

RUN NODE_ENV=development npm i \
&&  npm run build \
&&  rm -rf node_modules \
&&  npm i

ENTRYPOINT ["npm"]
CMD ["start"]
