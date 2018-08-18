FROM node:8
MAINTAINER giseop.lee <llgs901@naver.com>

RUN mkdir -p /app/tiptap

COPY package.json /app/tiptap/package.json
RUN  cd /app/tiptap; npm install

COPY . /app/tiptap

RUN echo 'node version : ' && node --version
RUN echo 'npm  version : ' &&  npm --version

WORKDIR /app/tiptap

CMD npm run start

EXPOSE 8080
