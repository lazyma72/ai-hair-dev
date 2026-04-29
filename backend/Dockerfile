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
# 2. 安装系统依赖 + inkscape（尽量减少额外推荐包）
ENV DEBIAN_FRONTEND=noninteractive
RUN if [ -f /etc/apt/sources.list ]; then \
      sed -i 's|http://deb.debian.org/debian|https://mirrors.tuna.tsinghua.edu.cn/debian|g; s|http://security.debian.org/debian-security|https://mirrors.tuna.tsinghua.edu.cn/debian-security|g' /etc/apt/sources.list; \
    fi && \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      sed -i 's|http://deb.debian.org/debian|https://mirrors.tuna.tsinghua.edu.cn/debian|g; s|http://security.debian.org/debian-security|https://mirrors.tuna.tsinghua.edu.cn/debian-security|g' /etc/apt/sources.list.d/debian.sources; \
    fi && \
    apt-get update && \
    apt-get install -y --no-install-recommends inkscape && \
    command -v inkscape >/dev/null && \
    rm -rf /var/lib/apt/lists/*
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
