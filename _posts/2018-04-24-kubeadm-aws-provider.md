---
layout:     post
title:      "用 kubeadm 部署 aws 环境下的 kubernetes"
date:       2018-04-24 22:48:22 +08:00
author:     "Eisen"
tags:       [docker, devops, kubernetes]
---


最近一个多月开始折腾在 **国内** 环境部署 kubernetes 集群。是的，确实这还是一个工作内容，和直接在什么 aws googlecloud 或者是 rancher 2.0 直接点点就能创建有一个集群不一样。之所以还要付诸这样的精力去做这件事有两个原因：

1. kubernetes 默认部署安装依赖于很多 google 的域名，而因为特殊的国内网络环境，那些自动执行创建集群的工具默认都是不适用的，我不得不把 kubernetes 集群部署搞得一清二楚才能明白具体哪里去 hack 那些被 block 的资源
2. 我们有自己搭建 bare metal 集群的需求，而那些可以随便点点就能构建集群的方式都是支持公有云的方案

不过因为我刚刚搞定了 aws 环境下 kubernetes 的部署，趁热打铁我就先记录一下这一部分。

## aws 环境下 kubernetes 的特殊性

k8s 有一个 `cloud-provider` 的概念，其目的是通过和一些公有云的服务集成以达到更好的功能。

aws 环境下的 k8s 是指 k8s 集成了部分 aws 的服务方便集群的使用。到目前为止，我所知道的包含如下内容：

1. ebs 做 persistent volume
2. 通过 elb 为 `LoadBalancer` 类型的 service 绑定一个外部域名可以直接通过域名去访问

而这篇文章则是重点介绍如何让 k8s 去支持这些特性，当然会缺少 kubeadm 一些信息，会在另外一篇介绍。

## 配置

k8s 现在已经相当庞大，大的跟个操作系统似的。但是很遗憾其文档的成熟度还处于初级阶段，我甚至找不到 `cloud-provider` 配置的一些细节，唯一可靠的文档似乎就是代码，但是一不小心打开一个三四千行的 golang 文件我也是一脸迷茫...最后在一个诡异的 github issue 里面找到了一个 googledoc 解释了 `cloud-provider=aws` 的一些细节。

### 为 EC2 添加 IAM 权限

为了让 k8s 可以操纵 aws 的资源需要为 ec2 添加权限：

#### for master

```yaml
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": [
				"ec2:*",
				"elasticloadbalancing:*",
				"ecr:GetAuthorizationToken",
				"ecr:BatchCheckLayerAvailability",
				"ecr:GetDownloadUrlForLayer",
				"ecr:GetRepositoryPolicy",
				"ecr:DescribeRepositories",
				"ecr:ListImages",
				"ecr:BatchGetImage",
				"autoscaling:DescribeAutoScalingGroups",
				"autoscaling:UpdateAutoScalingGroup"
			],
			"Resource": "*"
		}
	]
}
```

#### for worker

```yaml
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": [
				"ec2:Describe*",
				"ecr:GetAuthorizationToken",
				"ecr:BatchCheckLayerAvailability",
				"ecr:GetDownloadUrlForLayer",
				"ecr:GetRepositoryPolicy",
				"ecr:DescribeRepositories",
				"ecr:ListImages",
				"ecr:BatchGetImage"
			],
			"Resource": "*"
		}
	]
}
```

### 为 ec2 机器添加标签

为了识别具体哪些 ec2 是集群的一部分需要为每个 ec2 添加一个 `KubernetesCluster` 的 tag。

### 更新 kubelet config

为了支持 cloud-provider 首先需要在 kubelet 的配置里做相应修改，为 `/etc/systemd/system/kubelet.service.d/10-kubeadm.conf` 添加 `KUBELET_EXTRA_ARGS`:

```
[Service]
Environment="KUBELET_EXTRA_ARGS=--cloud-provider=aws
```

### 更新 kubeadm 配置

```yaml
apiVersion: kubeadm.k8s.io/v1alpha1
kind: MasterConfiguration
cloudProvider: aws
api:
  advertiseAddress: <internal-ip-address>
apiServerCertSANs:
- <public-ip-address>
- <public-hostname>
```

在用 kubeadm 创建集群时采用命令即可

    kubeadm init --config=init-config.yaml


### 更新 hostname

首先先要说明一下，aws 的机器默认的 hostname 是和其 internal dns hostname 不同。默认的是这个样子：

    ip-xx-xx-xx-xx

而 internal hostname 则是 

    ip-xx-xx-xx-xx.<region>.compute.internal
    
之类的东西。而 aws kubernetes 需要通过这个 internal dns hostname 去定位 node 所以需要将 hostname 更改成这个。

先前可以通过 `--hostname-override`` 参数覆盖默认的 aws hostname，但是最近似乎不行了，不如直接修改 hostname 一劳永逸。

```
curl http://169.254.169.254/latest/meta-data/local-hostname > /etc/hostname
```

然后重启机器使得更新起效。

## 注意

如果一开始配置坏了需要重新配置那一定要 kubeadm reset 哦：

```
kubeadm reset
ifconfig cni0 down
ip link delete cni0
ifconfig flannel.1 down
ip link delete flannel.1
rm -rf /var/lib/cni/
```

因为我自己安装的 flannel 其他的要看情况修改哦。

## 相关资料

1. [aws cloud provider](https://docs.google.com/document/d/17d4qinC_HnIwrK0GHnRlD1FKkTNdN__VO4TH9-EzbIY/edit#)
2. [kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm/)
3. [kubeadm init](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm-init/)
4. [Kubernetes on AWS](https://medium.com/jane-ai-engineering-blog/kubernetes-on-aws-6281e3a830fe)





