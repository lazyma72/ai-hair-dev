FROM registry.cn-beijing.aliyuncs.com/k8w/node:lts

RUN npm set strict-ssl false
RUN npm config set registry https://registry.npmmirror.com/

WORKDIR /src
# 先复制依赖文件，利用缓存层
COPY package*.json ./
RUN npm i

# build
ADD . /src
RUN npm run build

# move
RUN rm -rf /app \
    && mv dist /app \
    && mv node_modules /app/ \
    && rm -rf /src

# clean
WORKDIR /app
RUN npm prune --production

ENV NODE_ENV production

# 以下为程序配置
ENV DEBUG false
ENV CORS *

EXPOSE 3000

WORKDIR /app

CMD npm run start