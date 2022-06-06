FROM node:17-alpine

ADD package.json package-lock.json .npmrc .commitlintrc.js /action/

RUN cd /action && npm ci

ADD src /action/src

ENTRYPOINT ["node", "/action/src/index.js"]
