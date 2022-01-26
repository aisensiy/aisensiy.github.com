---
layout:     post
title:      "尝试 clickhouse operator"
date:       2022-01-26 16:06:11 +08:00
author:     "Eisen"
tags:       [clickhouse, kubernetes, devops]
---


Production 级别的 clickhouse 不是随便就能搞出来的，需要对其有更深入的理解。这篇主题只是针对如何在 k8s 里快速搭建一还行的 clickhouse。主要是为了实现整个系统不对外有额外的依赖，所有的依赖服务都包含在 k8s 集群中。和 [将 MySQL 通过 presslabs/mysql-operator 部署到 k8s 内部](/mysql-operator) 这篇对于 mysql 的处理非常类似。

## 诉求

之前用于测试的 clickhouse 是一非常随便的 deployment 实现，其主要缺点有如下几个：

1. 没有考虑如何修改配置，如果需要额外的配置只好自己想办法 mount 一个文件到指定路径
2. 没有初始化数据库的流程，只能自己手动去创建数据库
3. 不支持高可用，也无法扩容

其中 3 的诉求并不强烈，毕竟在测试阶段对这部分的要求没有那么高，而且如果真的想要高可用可能甚至都不应该将 clickhouse 放进 k8s 里。不过 1 2 的诉求还是很强烈的。那么我这里的工作也都是针对 1 2 两项进行的。

## 方案

这里采用了 [Altinity/clickhouse-operator](https://github.com/Altinity/clickhouse-operator) 这个方案。该方案不仅仅是完美解决了 1 2 两项问题，甚至是 3 也有做了还不错的处理。不过我这里就没有测试扩容和高可用了，主要测试的是 1 2 两部分。

### 安装 operator

按照[文档](https://github.com/Altinity/clickhouse-operator/blob/master/docs/quick_start.md)安装 operator:

```bash
curl -s https://raw.githubusercontent.com/Altinity/clickhouse-operator/master/deploy/operator-web-installer/clickhouse-operator-install.sh | OPERATOR_NAMESPACE=infra bash
```

这里我把 operator 安装的 namespace 放到了 infra。


### 提供部署 clickhouse 的 crd

```yaml
apiVersion: v1
kind: "ConfigMap"
metadata:
  name: "serving-db-mounted-configmap"             # [5]
data:
  01_create_databases.sh: |
    #!/bin/bash
    set -e
    clickhouse client -n <<-EOSQL
      CREATE DATABASE IF NOT EXISTS serving;
    EOSQL
---
apiVersion: "clickhouse.altinity.com/v1"
kind: "ClickHouseInstallation"
metadata:
  name: "serving-db"
spec:
  configuration:
    settings:                                      # [5]
      max_concurrent_queries: 400
    clusters:
      - name: "serving-db"
        layout:
          shardsCount: 1
          replicasCount: 1
  defaults:                                       # [1]
    templates:
      podTemplate: pod-template
      dataVolumeClaimTemplate: data-volume-template
      logVolumeClaimTemplate: log-volume-template
      serviceTemplate: svc-template
  templates:
    serviceTemplates:                             # [2]
      - name: svc-template
        generateName: clickhouse-{chi}
        spec:
          ports:
            - name: http
              port: 8123
            - name: tcp
              port: 9000
          type: ClusterIP
    podTemplates:                                 # [3]
      - name: pod-template
        spec:
          containers:
            - name: clickhouse
              image: yandex/clickhouse-server:22.1.3
              volumeMounts:
                - name: serving-db-configmap-volume
                  mountPath: /docker-entrypoint-initdb.d
          volumes:
            - name: serving-db-configmap-volume
              configMap:
                name: serving-db-mounted-configmap

    volumeClaimTemplates:                         # [4]
      - name: data-volume-template
        reclaimPolicy: Retain
        spec:
          storageClassName: local
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 50Gi
      - name: log-volume-template
        reclaimPolicy: Retain
        spec:
          storageClassName: local
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 10Gi
```

这个 yaml 是我集成了自己的所有诉求的最终版本，可以看到它主要包含两个部分：

1. `serving-db-mounted-configmap` 其中包含了初始化数据库的内容，这部分不是必须要，只有需要初始化数据库的时候才有
2. `ClickHouseInstallation` 这个是 clickhouse operator 所提供的 crd 顾名思义，就用于创建 clickhouse 核心 crd。具体每一个东西什么意思还是看文档吧，我这里主要介绍下目前实现了上述诉求相关的内容

我在上面做了注释标记（[1] 这样子），下面我一个个做介绍。

1. 可以看到 `defaults.templates` 下定义了一系列的模板（Template）其包含了
   1. `serviceTemplate`: 暴露 clickhouse 的 service 的结构
   2. `podTemplate`: 创建 clickhouse 自身的 pod 的结构
   3. `dataVolumeClaimTemplate`: 提供给 clickhouse 的存储的结构
2. `serviceTemplate` 其默认的类型为 `LoadBalancer` 由于我们的集群里不支持也不希望使用这个类型，因此这里做了自定义将其修改为了 `ClusterIP`
3. `podTemplate` 中首先选择 image 版本为 22.1.3 其次增加了一个额外的 volumeMounts 到路径 /docker-entrypoint-initdb.d 这样做是为了利用该 operator 所提供的钩子，实现数据库的初始，具体文档参见 [02-templates-07-bootstrap-schema.yaml](https://github.com/Altinity/clickhouse-operator/blob/master/docs/chi-examples/02-templates-07-bootstrap-schema.yaml)
4. `volumeClaimTemplates` 分别定义了 clikchouse 的日志和数据的 PV
5. `configuration.settings` 可以自定义 clickhouse 的配置，这里我仅仅是修改了 `max_concurrent_queries` 这个配置，这里所写的配置最终会被合并到 clickhouse 的配置中

## 遇到的问题

clickhouse operator 很好的解决了我目前的两大诉求，不过在使用过程中也遇到了一个额外的问题：clickhouse 默认用户 default 无法通过 kubernete dns 去访问 clickhouse。仔细查看了下配置，发现其配置只支持 `<service-name>.<namespace>.svc.cluster.local` 的域名访问。这样做有两个明显的问题：

1. 无法使用类似于 `<service-name>.<namespace>` 这样的 k8s 内支持的短域名访问
2. 如果我在创建 k8s 集群时就修改了默认的域名配置（即不采用 cluster.local），那么这域名是一定不起作用的，甚至可以认为这个配置是一个 bug

解决的办法也很简单，就是不要用这个 `default` 用户，去创建一个新的用户并且设置可以访问的 ip 即可。
