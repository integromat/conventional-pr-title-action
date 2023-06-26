FROM node:17-alpine

ARG NPM_TOKEN

ADD package.json package-lock.json .npmrc  /action/

RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > /root/.npmrc

RUN cd /action && npm ci

ADD src /action/src

ENTRYPOINT ["node", "/action/src/index.js"]
