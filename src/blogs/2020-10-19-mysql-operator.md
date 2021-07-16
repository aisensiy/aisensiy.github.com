---
layout:     post
title:      "将 MySQL 通过 presslabs/mysql-operator 部署到 k8s 内部"
date:       2020-10-19 18:16:00 +08:00
author:     "Eisen"
tags:       [mysql, kubernetes]
---

目前 openbayes 的几乎所有组件都部署在 k8s 内部，但 mysql 作为核心的数据存储节点对其要求都蛮高的，对于目前的业务场景，其要求主要包含以下几点：

1. 需要持久化存储，一旦数据丢失问题非常严重
2. 对性能有要求，不然会拖垮依赖它的一切服务
3. 需要一些额外的备份机制，可以快速的从一个备份做恢复
4. 需要对应的监控体系
5. mysql 需要可以比较容易的通过各种客户端访问，方便不同的角色对数据做分析或者做 debug
6. *在规模比较大的时候可能会做读写分离

之所以希望将 mysql 部署到 k8s 内主要还是希望达到以下目的：

1. 减少外部依赖，支持更广泛部署场景；目前对于一些环境是使用了云服务商所提供的数据库（aws / ucloud），然而并不是所有的情况都能这么做。
2. 统一部署模式，降低部署门槛；对于无法使用云服务商的数据库的场景，通常需要独立在某一台机器上安装 mysql 但这个部署模式与 k8s 是分离的，相当于多了一部分手工部署的工作量，而且手动部署也很难满足以上的几点要求的，自动化越少，部署门槛就会越高。

下面介绍 presslabs/mysql-operator 如何满足这些要求，实现在一些环境中成功使用 k8s 内的 mysql 的。

## 基本介绍

在使用云服务商的数据库的时候我就在想，如果能有一套 k8s 的 operator 能够支持快速部署 / 数据库配置 / 周期性备份 / prometheus 指标暴露也不是难事呀，在做了简单的搜索后还真的发现了这么个东西 [presslabs/mysql-operator](https://github.com/presslabs/mysql-operator) ，满足了说所提及的这一切：

1. 内置了 mysql 部署配置，简单修改配置可以实现将 mysql 的存储放置在 hostPath 或者指定的 storageClass 解决了持久化存储的问题
2. 既然可以指定具体部署的存储，那么也能指定 mysql 部署的节点，性能的问题基本得到解决
3. 内置 extraBackup 支持手动或者 cronjob 周期性备份数据库到指定的对象存储
4. 部署起来的 mysql 自带 exporter 可以直接和 prometheus 对接，然后把数据通过 grafana 展示，监控 / 告警也就有了
5. 通过配置额外的 nodePort 类型的 Service 可以将 mysql 服务暴露出来，外部访问的问题就解决了
6. 这个 operator 本身就支持读写分离，不过我并没测试

https://github.com/presslabs/mysql-operator/blob/master/charts/mysql-operator/values.yaml 这是 helm charts 的 values.yaml 把这个文件下载到本地，按照具体环境做一定修改后执行以下命令即可部署 operator 了：

```
# 这里用的是 helm3 
helm repo add presslabs https://presslabs.github.io/charts
helm install mysql presslabs/mysql-operator \
    -f values.yaml \
    -n infra --create-namespace
```

其中 `values.yaml` 需要修改的部分主要就是两部分：

1. 镜像位置（image sidecarImage orchestrator.image），国内部署速度不太行，建议自行拉到访问比较好的国内节点
2. 存储，默认 `persistence.enabled: false` 可以按照自己的情况做修改，这里只支持 `storageClass` 的方式

部署好之后才是第一步，即成功部署了 `operator` 本身，下面就是具体部署一个 `mysql` 了，在 https://github.com/presslabs/mysql-operator/tree/master/examples 有一个例子，可以看到 mysql 被定义为了一个叫做 `MysqlCluster` 的 CRD。主要需要修改的部分有以下：

1. `secretName` 见 https://github.com/presslabs/mysql-operator/blob/master/examples/example-cluster-secret.yaml 指初始化的一些数据，如 root 密码，数据库名称，用户名，用户密码
2. `image` / `mysqlVersion` mysql 的镜像，同样推荐修改为国内的镜像，具体版本也依照实际情况
3. `backupSchedule` 如果设置则是需要周期性备份，数据会按照该配置定期备份到指定的对象存储中，当然 `backupSecretName` 也需要配置正确才能使用
4. `mysqlConf` 对应 mysql.cnf 中的字段，依据自己需求配置
5. `volumeSpec` 数据持久化方式，和上文中 `operator` 的类似，但是更灵活，支持 hostPath
6. `initFileExtraSQL` 感觉这个 MysqlCluster 是希望用户每个数据库建立一个独立的资源，但是 openbayes 这里有一些附属数据库如果分开放置感觉有点没必要，所以这里就采用这个机制同时初始化了其他的数据库

```
  initFileExtraSQL:
    - "CREATE DATABASE IF NOT EXISTS `<otherdb>`"
    - "DROP USER IF EXISTS <otheruser>@'%'"
    - "CREATE USER <otheruser>@'%' IDENTIFIED BY '<PASSOWRD>'"
    - "GRANT ALL PRIVILEGES ON <otherdb>.* TO <otheruser>@'%'"
    - "FLUSH PRIVILEGES"
```

注意这里有个奇怪的写法是需要先去 `DROP USER`... 至于为啥我并不知道，我只知道不这么做就是会报错...

## 备份 / 恢复

如上文所述，这个 `MysqlCluster` 支持自动的备份，当然也支持主动的备份，具体的文档在[这里](https://www.presslabs.com/docs/mysql-operator/backups/)。

既然支持备份也支持恢复，具体的文档在[这里](https://www.presslabs.com/docs/mysql-operator/cluster-recover/)。

这些步骤我都测试过了，确认可以走的通的。以及这个备份的功能已经非常体贴了：

1. 支持手动备份通过 cron 控制
1. 支持保存最近的 N 个版本
1. 恢复只需要在初始 mysql 时填写 s3 路径即可

在备份到 s3 不成功可以看看具体的报错信息，它具体备份采用的是 rclone 这个工具。不成功基本就是两个方向：

1. s3 设置有问题，上传直接挂了
2. 你所使用的对象存储可能不是 rclone 会完全支持的，这种情况比较少见，但是我确实踩到了，具体来讲就是 ucloud 之前缺乏某些操作的支持，但是目前已经支持了呢

## 监控

![](../img/in-post/youtube-dl/2020-10-19-18-34-53.png)

如上图所示，这是我直接将 https://grafana.com/grafana/dashboards/7362 这个仪表盘导入所看到的效果。

## 外部访问

增加一个额外的 NodePort 即可：

```
apiVersion: v1
kind: Service
metadata:
  name: local-openbayes-mysql-nodeport-master
spec:
  ports:
  - name: mysql
    port: 3306
    protocol: TCP
    targetPort: 3306
    nodePort: 30016
  selector:
    app.kubernetes.io/managed-by: mysql.presslabs.org
    app.kubernetes.io/name: mysql
    mysql.presslabs.org/cluster: <local-openbayes>
    role: master
  type: NodePort
```

## 独立 io

在使用的过程中遇到一个特殊的情况，mysql 如果和其他的服务共用一个 storageClass 可能会出现 io 抢占的情况，导致 mysql 的延迟非常巨大。目前 k8s 还没有一个很好的办法解决这个问题。唯一想到的就是为 mysql 分配一套单独的 storageClass （比如 [local storage path](https://github.com/rancher/local-path-provisioner) 的方案）。
