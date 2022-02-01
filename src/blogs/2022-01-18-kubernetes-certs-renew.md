---
layout:     post
title:      "处理 k8s 证书过期"
date:       2022-01-18 09:38:11 +08:00
author:     "Eisen"
tags:       [devops, kubernetes, kubeadm]
categories: ["kubernetes 运维"]
---

## 简单记录

k8s 为了鼓励大家更新，其 kubeadm 默认的证书有效期为 1 年，任何 k8s 版本的更新都会触发证书的更新。如果证书过期了可以按照如下方式处理：

1. 如果发现自己本地 kubectl 无法访问集群并报错就很有可能是证书过期了，登陆任意一台 master 执行命令 `kubeadm certs check-expiration` 可以查看证书的有效期，如果报错没有命令 `certs` 那么可以尝试命令 `kubeadm alpha certs ...` 
2. 过期后可以用命令 `kubeadm certs renew all` 更新所有证书
3. 更新后需要将 `/etc/kubernetes/manifests/` 挪走，比如重命名为 `manifests.1` 20 秒以上，等待 static pod 全部都关闭了，然后重命名回来，这个步骤就是强迫所有的 static pod 重启，[官网文档](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/#manual-certificate-renewal) 就是这么建议操作的
4. 如果是 HA 高可用模式，那么需要将每一台 master 都这么操作一下
5. 将新的 `/etc/kubernetes/admin.conf` 拷贝到自己的电脑，并将其其中的 api-server 的访问地址修改成从自己电脑可以访问的地址即可，然后具体的管理可以参考 [维护一大堆 kubeconfig 的一些实践](/kubeconfig-management)

## 更好的办法

这样做现在并不是最好的方法，目前可以改进的方式有如下几个：

1. 按照官方推荐，更频繁的升级 k8s 避免自己的集群版本掉队到无法维护，这应该是最好的方法，当然听起来成本也高一些
2. 简单粗暴，修改对应版本的 kubeadm 源码，将 renew 时间改成什么 100 年之类的，然后用这个编译的版本去 renew 就是 100 年有效期了
3. https://github.com/fanux/sealos **可能是不错的方案，具体还没看**

## 资料

1. [Certificate Management with kubeadm](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/)
2. [kubeadm 集群修改证书时间到 99 年](https://cloud.tencent.com/developer/article/1650657)
