FROM node:8
MAINTAINER giseop.lee <llgs901@naver.com>

RUN mkdir -p /app/travel

COPY package.json /app/travel/package.json
RUN  cd /app/travel; npm install

COPY . /app/travel

RUN echo 'node version : ' && node --version
RUN echo 'npm  version : ' &&  npm --version

WORKDIR /app/travel

CMD npm run start

EXPOSE 8080
