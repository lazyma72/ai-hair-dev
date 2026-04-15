FROM registry.cn-beijing.aliyuncs.com/k8w/node:lts AS build

RUN npm set strict-ssl false
RUN npm config set registry https://registry.npmmirror.com/

WORKDIR /src

# 先复制依赖文件，利用缓存层
COPY package*.json ./
RUN npm i

# build
ADD . /src
RUN npm run build

FROM registry.cn-beijing.aliyuncs.com/k8w/node:lts

RUN npm set strict-ssl false
RUN npm config set registry https://registry.npmmirror.com/
RUN npm i -g serve

WORKDIR /app
COPY --from=build /src/dist /app/dist

EXPOSE 80

CMD ["serve", "-s", "dist", "-l", "80"]
