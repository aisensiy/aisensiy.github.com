---
layout:     post
title:      "Kuberhealthy 一个还不错的健康检查 operator"
date:       2021-03-01 12:36:00 +08:00
author:     "Eisen"
tags:       [kubernetes, devops]
---

几年前 k8s 就是 openbayes 部署的基础平台了，它算是一个相当不错的 PaaS 了。这里介绍一个最近发现的做 healthcheck 的 operator（我不知道这东西用中文怎么说）。

## 需求

当我们的子系统越来越多的时候，我们希望每个系统有一些监控用于检测其核心的功能是否跑起来了，并希望知晓每个服务的宕机事件。[uptimerobot](https://uptimerobot.com/) 就是在做类似的事情。我们可以给它一个 http 访问地址，当访问成功的之后就标记为「健康」，当访问失败的时候就标记为「不健康」。这个检测在指定的周期执行，日积月累就能知道一个服务的稳定情况了。

不过以上所述的健康检查就像是一个 `curl https://targeturl` 似乎在假设所有的子系统都需要有一个可以方便访问的 http path。不过有些时候，我们会需要一些稍微复杂的健康检查：

- 希望知道一些非 http 请求访问的服务是否健康
- 希望知道一些以灵活的请求内容访问的服务是否健康
- 希望有一些端到端的健康检查，以联通多个系统

这里就推荐一下 [kuberhealthy](https://comcast.github.io/kuberhealthy/) 这个项目。首先它是一个 kubernetes 的 operator 那么只有你在使用 k8s 的时候这个东西才算是有意义的。它有两个我很看中的地方：

1. kuberhealthy 提供了一个健康检查的框架，用于让你构建任意形式的健康检查，并且这个框架我觉得很清晰，构建起来也很容易，理解起来一点都不晦涩
1. 它已经包含了不少预置健康检查了，尤其是与 k8s 集成的健康检查，算是做到了一定程度的开箱即用

## 几个不错的预置健康检查

1. [pod-restarts-check](https://comcast.github.io/kuberhealthy/cmd/pod-restarts-check/) 用于检查是否存在 pod 在不断的重启，可以快速的发现是不是有服务出现了些导致其不断重启的行为。
1. [pod-status-check](https://comcast.github.io/kuberhealthy/cmd/pod-status-check/) 用于检查是否存在 pod 一直处于失败的状态。
1. [storage-check](https://github.com/ChrisHirsch/kuberhealthy-storage-check) 用于判断是否可以使用某一个 storageclass 成功创建 pvc。每个集群的分布式存储的健康基本就是各种服务不出问题的基石，即使发现存储出现问题太重要了。

更多的可以在[这里](https://comcast.github.io/kuberhealthy/docs/EXTERNAL_CHECKS_REGISTRY.html)找到。

## 自定义 healthcheck

在 [文档](https://github.com/Comcast/kuberhealthy/blob/master/docs/EXTERNAL_CHECK_CREATION.md) 里做了介绍，简单的说就是这样一个东西：

- 做一件事情去检查你想要测试的东西是否「健康」，总之这个行为可以很灵活，你想怎么测试就怎么测试
- 如果健康就把 `{"OK": true}` 以 POST 发送到 `http://$KH_REPORTING_URL`
- 如果不健康就发以下的内容，其中 `Errors` 自然就是具体的出错原因了。

```
{
  "Errors": [
    "Error 1 here",
    "Error 2 here"
  ],
  "OK": false
}
```

这里我写了一个用来测试 openbayes 的服务是否可用的端到端的健康检查，它主要做如下的事情：

1. 用 openbayes 的命令行工具登录到预置的账号
1. 创建一个脚步任务提交到 openbayes
1. 如果任务提交成功则是「健康」的
1. 否则系统就是「不健康」的

具体的 crd 定义如下：

```yaml
apiVersion: comcast.github.io/v1
kind: KuberhealthyCheck
metadata:
  name: openbayes-gear-check
spec:
  runInterval: 6h # 指定多久时间跑一次
  timeout: 5m # 指定执行的最长时间
  podSpec:
    containers:
    - env: # 自定义的环境变量
        - name: OPENBAYES_TOKEN
          value: <THE TOKEN>
        - name: ENTRYPOINT
          value: <THE ENTRYPOINT>
        - name: RUNTIME
          value: pytorch-1.7.0
        - name: RESOURCE
          value: titan_rtx
      image: xxxx # 镜像
      name: main
```

容器的 Dockerfile 如下：

```
FROM ubuntu

RUN apt update
RUN apt install wget curl git -y
RUN wget https://gitee.com/openbayes/bayes-releases/attach_files/606636/download/bayes_amd64.deb
RUN dpkg -i bayes_amd64.deb
WORKDIR /empty
COPY run.sh .
CMD ["/bin/bash", "run.sh"]
```

只做了两件事：

1. 下载 bayes 命令行工具
1. 执行 `run.sh` 脚本

其中 `run.sh` 如下：

```sh
set -e # 任意一行错了就不再继续执行了

bayes upgrade # 更新命令行工具到最新
bayes switch test -e $ENTRYPOINT # 切换 bayes 命令行的上下文
bayes login $OPENBAYES_TOKEN # 登录
bayes gear init healthcheck -m '自动测试项目' # 创建项目
bayes gear run task --env $RUNTIME --resource $RESOURCE -f -- echo 123 # 提交 Python 脚本
curl --location --request POST $KH_REPORTING_URL \
--header 'Content-Type: application/json' \
--data-raw '{ "OK": true }' # 提交成功就告知 kuberhealthy 这次检查是成功的
```

下面是执行的样子，可以看到这个任务就像是 crd 设置的那个样子，每 6 个小时跑一次。

![openbayes healthcheck 的执行记录](/img/in-post/kuberhealthy/2021-03-01-14-07-25.png)

## 与 prometheus / grafana 集成

首先 kuberhealthy 自己有一个汇总页面，可以通过 `kubectl port-forward svc/kuberhealthy 8888:80` 类似的方式去访问：

```json
{
  "OK": true,
  "Errors": [],
  "CheckDetails": {
    "kuberhealthy/dns-status-internal": {
      "OK": true,
      "Errors": [],
      "RunDuration": "3.359431829s",
      "Namespace": "kuberhealthy",
      "LastRun": "2021-03-01T06:08:09.35793049Z",
      "AuthoritativePod": "kuberhealthy-84bf9fd647-2x72f",
      "uuid": "1d309ed7-4b7a-4fd5-9706-d04f53c9ed30"
    },
    "kuberhealthy/namespace-pod-check": {
      "OK": true,
      "Errors": [],
      "RunDuration": "13.589526741s",
      "Namespace": "kuberhealthy",
      "LastRun": "2021-03-01T05:50:19.584075218Z",
      "AuthoritativePod": "kuberhealthy-84bf9fd647-2x72f",
      "uuid": "49f7bef3-f5d4-4e25-bf06-acd260d52e27"
    },
    "kuberhealthy/openbayes-gear-check": {
      "OK": true,
      "Errors": null,
      "RunDuration": "1m8.486351014s",
      "Namespace": "kuberhealthy",
      "LastRun": "2021-03-01T00:51:14.477191396Z",
      "AuthoritativePod": "kuberhealthy-84bf9fd647-2x72f",
      "uuid": "c13aea0d-52ca-4777-a6e0-551d0c59962a"
    },
    "kuberhealthy/openbayes-random-image-serving-check": {
      "OK": true,
      "Errors": null,
      "RunDuration": "9.008124976s",
      "Namespace": "kuberhealthy",
      "LastRun": "2021-03-01T06:08:15.000563842Z",
      "AuthoritativePod": "kuberhealthy-84bf9fd647-2x72f",
      "uuid": "eb1341d3-9bbf-44ab-9348-76715464df6b"
    },
    "kuberhealthy/pod-restarts": {
      "OK": true,
      "Errors": null,
      "RunDuration": "2.903617967s",
      "Namespace": "kuberhealthy",
      "LastRun": "2021-03-01T06:05:09.40445213Z",
      "AuthoritativePod": "kuberhealthy-84bf9fd647-2x72f",
      "uuid": "4cf2c122-95ac-4902-8ecf-ee484a54c475"
    },
    "kuberhealthy/pod-status": {
      "OK": true,
      "Errors": [],
      "RunDuration": "2.845955825s",
      "Namespace": "kuberhealthy",
      "LastRun": "2021-03-01T06:05:08.84049994Z",
      "AuthoritativePod": "kuberhealthy-84bf9fd647-2x72f",
      "uuid": "77af9108-720b-4ad4-b8cc-2fe81e751d8d"
    }
  },
  "JobDetails": {},
  "CurrentMaster": "kuberhealthy-84bf9fd647-2x72f"
}
```

但是谁也没空去看这么个 json 的，还是需要和 prometheus 这样的东西集成才行：

```
    scrape_configs:
      ...
      - job_name: kuberhealthy
        scrape_interval: 1m
        honor_labels: true
        metrics_path: /metrics
        static_configs:
          - targets:
            - kuberhealthy.kuberhealthy

```

然后就可以在 grafana 那边去设置具体的展示了，这里我有一个比较简单的：

![grafana 的示例](/img/in-post/kuberhealthy/2021-03-01-14-13-46.png)

具体的集成文档见[K8s-KPIs-with-Kuberhealthy.md](https://github.com/Comcast/kuberhealthy/blob/master/docs/K8s-KPIs-with-Kuberhealthy.md)。

## 遇到的坑

1. kuberhealthy 的 service account 需要好好制定，对于跨 namespace 的东西，需要给 [clusterRole](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#clusterrole-example) 才可以
1. kuberhealthy 在每次有新的 KuberhealthyCheck 创建的时候似乎都会刷新它自己的周期计时，导致一些数个小时才需要跑一次的检查会立即跑一次，这个行为对于某些场景可能无法接受

