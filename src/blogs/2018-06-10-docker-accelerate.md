---
layout:     post
title:      "国内环境下更好的 docker 镜像获取"
date:       2018-06-10 23:48:22 +08:00
author:     "Eisen"
tags:       [docker, devops]
---


最近欠了好多的 blog，是在是有点忙，周末也被各种事情缠身。今天趁周日的最后半个小时抓紧记录下来一些调研的成果。

国内的网络环境大家都知道，一方面是不稳定的宽带，另一方面就是对一些国外网站访问的不可靠。今天集中记录一下自己在 docker 镜像处理方面的一些小技巧。

## 加速 docker pull

Docker 本身提供了一个叫做 [docker registry mirror](https://docs.docker.com/registry/recipes/mirror/) 的东西，就是为了减少重复的镜像下载所产生的额外带宽，在国内访问 docker 官方 image 极其缓慢的场景下这种需求尤为凸显。如果不设置相应的 mirror 国内服务器下载镜像真是举步维艰。

通过在 `/etc/dockeer/daemon.json` 做相应的配置就可以添加一个 registry mirror:

```json
{
  "registry-mirrors": ["<your registry mirror url>"]
}
```

配置之后需要重启 docker。

```sh
$ sudo pkill -SIGHUP dockerd
```

### docker-cn

[Docker 中国](https://www.docker-cn.com/) 估计是 docker 为了在中国开展业务搞的子公司吧？不应该是什么山寨网站吧。其提供了加速国内 docker pull 的镜像地址 https://registry.docker-cn.com。按照上述的配置方式配置即可使用：

```json
{
  "registry-mirrors": ["https://registry.docker-cn.com"]
}
```

然而很遗憾，这个速度并不理想，以我目前所在的网络环境，下行速度 4MB/s 拉取 ubuntu 镜像的速度大概也就是 400KB/s ~ 500KB/s。

### daocloud

[daocloud](https://daocloud.io) 作为一个做 caas 的公司为国内提供了号称免费的 mirror 构建服务。登录控制台就可以看到如图所示的位置的加速器按钮了，点进去就有相应的脚本了。

**注意** 虽然人家是好意给了一个 shell 脚本帮助修改 /etc/docker/daemon.json 的配置，然而**如果你的 docker 不止有一个 runtime**，比如你像我这样需要跑 nvidia docker 的 runtime，那么这个脚本会把你的配置搞砸...建议直接想我这样手动配置：

```json
{
    "registry-mirrors": ["{{ docker_mirror }}"],
    "runtimes": {
        "nvidia": {
            "path": "/usr/bin/nvidia-container-runtime",
            "runtimeArgs": []
        }
    }
}
```

其中将 `{{ docker_mirror }}` 替换成 daocloud 提供的 mirror 即可。

配置之后重启 dockerd 感受下速度吧，同样的网络环境，基本是 2MB/s ~ 3MB/s。

## 拉取更难以获取的镜像

上述的 docker-cn 以及 daocloud 仅仅是支持官方 docker.io 镜像的加速，然而要知道当今世界 google 的 google cloud platform 做的是相当不错，google 旗下的 kubernetes 基本是当前 PaaS 的不二之选，其官方镜像域名 gcr.io 下有大量 docker.io 无法取代的重要资源。而这些资源早早的已成为了墙外之物。

### 做搬运工

为了获取 gcr.io 域名下的镜像，我们可以在境外创建一个 vps 然后通过蚂蚁搬家的方式一点一点挪过来：

1. 把 gcr.io/image-name:tag pull 到 vps 上 `docker pull gcr.io/image-name:tage`
2. 重新打标签到自己 docker.io 的账号下 `docker tag gcr.io/image:tag <username>/image:tag`
3. 把新镜像推送到 docker.io `docker push <username>/image:tag`

当然你可以写一个脚本，把自己用得着的镜像一个个 push 到 docker.io 中。甚至有人会写一些类似于 webhook 的东西，当 gcr.io 一些特定项目的镜像更新后会自动触发相应的流程自动托运新的镜像。不过不论如何这样的坏处显而易见：这是一个体力活，虽然有一些加速的脚本但是我依然需要更新脚本，管理 webhook...我先前已经用这个方法搞了一堆这样的镜像了...都是眼泪...

google 一下发现这种方式在用 kubeadam 安装 kubernetes 的场景被很多人采用了。

### docker proxy 配置

既然有了 vps 自然是可以直接搭建一个代理的，docker 本身是支持在 docker pull 使用代理的，那么配个代理不久解决问题了吗。具体怎么配置代理这里就不讲了，我只记录 docker 这边的配置：

首先 `mkdir /etc/systemd/system/docker.service.d`。

然后创建 `/etc/systemd/system/docker.service.d/http-proxy.conf`，添加内容如下：

```
[Service]
Environment="HTTP_PROXY=http://user01:password@10.10.10.10:8080/"
Environment="HTTPS_PROXY=https://user01:password@10.10.10.10:8080/"
Environment="NO_PROXY=localhost,.docker.io,.docker.com,.daocloud.io"
```

当然要使用自己的 `HTTP_PROXY` 和 `HTTPS_PROXY`，然后把不想使用代理的域名添加到 `NO_PROXY`，尤其是使用的镜像域名和 docker.io 应该考虑在内。

最后更新 systemctl 并重启服务

```sh
$ systemctl daemon-reload
$ systemctl restart docker
```

之后可以用以下镜像测试一下：

```sh
$ docker pull k8s.gcr.io/kube-scheduler-amd64:v1.10.2
```

#### 注意

在查找有关 docker proxy 内容时会发现有两种搜索结果，一种是我上述讲的 docker pull 时采用代理的方法；另一种是**如何在 docker container 中**配置代理：[Configure Docker to use a proxy server](https://docs.docker.com/network/proxy/) 这个迷惑性还是有的...不过第二种情况以后也可能会用得上。

