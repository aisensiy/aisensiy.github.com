---
layout:     post
title:      "Drone 一个原生支持 docker 的 CI"
date:       2017-08-04 19:03:00 +08:00
author:     "Eisen"
tags:       [docker, ci/cd]
---

大概是一年前发现了这样一个叫做 Drone 的开源 ci，在逐渐的尝试过程中发现它的功能非常的强大，其 pipeline as code + docker + backing service 支持的体系基本和我理想中的 ci 一模一样...这里就介绍一下我看到的 drone 的一些非常出彩的地方以及日常使用时一些非常有用的使用方式。

## 本地安装

![](http://o8p12ybem.bkt.clouddn.com/15096926244457.jpg?imageView2/2/w/1200/q/75%7Cimageslim)

可以看到 drone 的界面非常的简洁，和其他 ci 一样它通过和 github gitlab 或者是 gogs 这样的 git repository 链接并绑定 web hook 在用户提交新的 commit 的时候出发 ci 的执行。drone 作为一个开源的 ci 其支持 docker 方式的安装，非常的简单：

```yaml
version: '2'

services:
  drone-server:
    image: drone/drone:0.7
    ports:
      - 80:8000
    volumes:
      - /var/lib/drone:/var/lib/drone/
    restart: always
    environment:
      - DRONE_OPEN=true
      - DRONE_HOST=${DRONE_HOST}
      - DRONE_GITHUB=true
      - DRONE_GITHUB_CLIENT=${DRONE_GITHUB_CLIENT}
      - DRONE_GITHUB_SECRET=${DRONE_GITHUB_SECRET}
      - DRONE_SECRET=${DRONE_SECRET}

  drone-agent:
    image: drone/drone:0.7
    command: agent
    restart: always
    depends_on:
      - drone-server
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DRONE_SERVER=ws://drone-server:8000/ws/broker
      - DRONE_SECRET=${DRONE_SECRET}
```

通过这样的 docker-compose 文件就可以在本地启动一个 droner server 和一个 drone-agent（其概念和 gocd 类似）。

## drone 的亮点

### pipeline as code

首先 drone 支持 pipeline as code 其通过一个简单的 yaml 文件就包含了一个项目 ci 的所有内容了（当然，到底简不简单要看你构建流程的复杂程度以及你对项目的封装程度）。举一个例子：

```yaml
pipeline:
  build:
    image: node:6.10.2-alpine
    commands:
      - yarn install
      - yarn run build
  publish:
    image: plugins/docker
    repo: eisenxu/realtopper-app
    secrets: [ docker_username, docker_password ]
    tags:
      - latest
      - ${DRONE_COMMIT_SHA:0:8}
```

这是一个采用 `create-react-app` 创建的一个前端单页应用项目。这里定义了 `build` 和 `publish` 两个阶段。第一个阶段 `yarn install` 和 `yarn run build` 分别下载依赖和编译但也应用。第二阶段 `publish` 采用项目中的 `Dockerfile` 构建一个 docker image 并发布到 `hub.docker.com`，具体两个步骤如何进行的细节我们在后面会慢慢介绍。

### 原生支持 docker

上面的 yaml 中每个阶段都有一个 `image` 的字段，这个 `image` 就是指一个 docker image 也就是说 drone 下每一个阶段都是在一个你所指定的 docker container 下执行的。这样当然就集成了 docker 所引入的一系列的好处：环境隔离、标准化镜像。并且，它是后面插件扩展以及 backing service 可以被轻而易举的实现的基础。

### 简单易用的插件扩展

还是在看上面的那个例子，第一个阶段我们在 `node:6.10.2-alpine` 下构建了一个单页应用。然后，我们采用了 `plugins/docker` 镜像构建并发布了我们的镜像到 `hub.docker.com`。而这里的 `plugins/docker` 就是 `drone` 为我们提供的一个插件了。

虽说是一个插件，但实际上用起来就和其他的 `image` 一样，这个插件的功能就是帮我们利用项目中的 `Dockerfile` 构建一个新的 docker image 并提交。除此之外还有一些其他的官方插件可供使用，详情在[这里](http://plugins.drone.io/)。

当然，自己做一个插件也是非常简单的，在插件被执行的时候，当前目录就是项目的根目录，然后 drone 会暴露一系列的[环境变量](http://docs.drone.io/environment-reference/)给用户使用，我们可以采用之前的步骤所产生的数据或者环境变量中的内容实现一个特定功能的插件。

### 支持 backing service

我们跑 ci 的时候难免会有一些外部的依赖，比如跑单元测试的时候可能会用到外部的数据库。比如跑前端界面测试的时候我们会需要 selenium。drone 对这种场景提供了支持。

```yaml
pipeline:
  test:
    image: golang
    commands:
      - go get
      - go test

services:
  database:
    image: postgres
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_DB=test
```

这是官方所提供的一个数据库的例子。通过定义一个 `services` 字段，我们可以提供一个或者多个外部服务。

## 最佳实践

### 对 docker image 的验收测试

我们采用 docker 容器进行部署的时候通常是在 docker 容器中跑单元测试然后打包镜像并推到 registry。但是这样的流程并不能保证我们打包好的镜像是工作的，可能我们的 Dockerfile 写的有问题导致服务没办法被使用。所以，其实还可以最这种最终构件好的镜像做一个验收测试。

backing service 的机制可以让我们这么做：

```yaml
pipeline:

  build:
    image: node:6.10.2-alpine
    commands:
      - npm build

  publish_for_test:
    image: plugins/docker
    repo: test/bar
    tags: [ 1.0.0, 1.0, latest ]

  run_server:
    image: test/bar:latest
    detach: true
  
  verify:
    image: blueimp/chromedriver
    environment:
      - VNC_ENABLED=true
      - EXPOSE_X11=true
    commands:
      - nightwatch

  publish:
    image: plugins/docker
    repo: production/bar
    tags: [ 1.0.0, 1.0, latest ]
```

1. 首先，我们在 `publish_for_test` 中构建一个 `test/bar:latest` 的镜像。
2. 然后我们采用 `detach` 的字段表明我们在这里把我们刚刚创建好的镜像运行起来。
3. 在 `verify` 阶段，我们采用 `nightwatch` 对已经运行起来的 `test/bar:latest` 服务执行验收测试，也就是说，这时候我们把刚刚创建的应用当做我们的 `backing service`。
4. 如果测试通过了，我们再构建一个新的镜像并 push 到生产环境 registry

当然，这里的 `publish_for_test` 其实最好的办法是只构建镜像而不提交镜像，然后在本地启动这个镜像。不过这种使用本地镜像的方式并没有使用过，而且也没有那种只构建不提交或者只提交已经存在的镜像的插件，以后可以自己进一步做一些优化。

### 用 drone 部署多个阶段的环境

虽然 drone 没有 GoCD 里的 deployment pipeline 的概念，但是它可以通过指定特殊的 `deployment` 的事件实现手动激活的多环境部署。

```yaml
pipeline:
  build:
    image: golang
    commands:
      - go build
      - go test

  publish:
    image: plugins/docker
    registry: registry.heroku.com
    repo: registry.heroku.com/my-staging-app/web
    when:
+     event: deployment
+     environment: staging

  publish_to_prod:
    image: plugins/docker
    registry: registry.heroku.com
    repo: registry.heroku.com/my-production-app/web
    when:
+     event: deployment
+     environment: production
```

可以看到通过指定 `event` 和 `environment` 可以指定两个不同的环境：staging 和 production。然后，通过 drone 所提供的命令行可以实现手工部署到不同的环境。

```bash
drone deploy octocat/hello-world 24 staging
```

这里是将构建 `24` 号部署到 staging 环境。

### 使用插件为构建增加缓存

每次构建都从远端获取依赖真是非常费流量费时间，最好可以不要重复下载。drone 就以插件的方式支持了这样的功能。

```yaml
pipeline:
  restore-cache:
    image: drillster/drone-volume-cache
    restore: true
    mount:
      - ./node_modules
    volumes:
      - /tmp/cache:/cache

  build:
    image: node
    commands:
      - npm install

  rebuild-cache:
    image: drillster/drone-volume-cache
    rebuild: true
    mount:
      - ./node_modules
    volumes:
      - /tmp/cache:/cache
```

第一阶段 `restore-cache` 将 `/tmp/cache` 下该项目的缓存拷贝到 `./node_modules`。第三阶段将 `./node_modules` 的内容拷贝会 `/tmp/cache` 详细的内容见[缓存](http://plugins.drone.io/drillster/drone-volume-cache/)。

## 当前的状态

目前 drone 刚刚开始了商业化之路，并且在疯狂的更新中，整体社区非常的活跃 star 也已经过万了，非常期待它未来的发展。

## 相关资料

* [drone 官网](http://drone.io)
* [drone 安装指南](http://docs.drone.io/installation/)
* [create-react-app](https://github.com/facebookincubator/create-react-app)
* [drone basic usage](http://docs.drone.io/getting-started/)
* [drone docker 插件](http://plugins.drone.io/)
* [drone cache 插件](http://plugins.drone.io/drillster/drone-volume-cache/)
* [drone 部署](http://docs.drone.io/deployments/)
* [缓存](http://plugins.drone.io/drillster/drone-volume-cache/)


