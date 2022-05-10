---
layout:     post
title:      "记一次 nvidia docker 错误追查"
date:       2019-01-17 23:55:12 +08:00
author:     "Eisen"
tags:       [docker, devops, kubernetes, gpu, nvidia]
---

最近搞装机的事情很是烦躁，非常理解做运维的同学的辛苦了。尤其是当出现一些不知所云的错误的时候，真的是头都炸了。而且如果不能保持冷静还可能把原先做的工作因为一两个失误毁于一旦。

从现在开始尝试频繁的记录在运维的过程中遇到的各种各样的错误。这次是记录 dgx1 上 `nvidia-docker2` 异常，导致 `nvidia-device-plugin` 无法启动。

将 `dgx1` 加入 `kubernetes` 集群之后发现其 `nvidia-device-plugin` 启动报错 `RunContainerError`，`k describe pod` 发现错误信息：

```
Error: failed to start container "nvidia-device-plugin-ctr": Error response from daemon: OCI runtime create failed: container_linux.go:348: starting container process caused "process_linux.go:402: container init caused \"process_linux.go:385: running prestart hook 0 caused \\\"error running hook: exit status 1, stdout: , stderr: exec command: [/usr/bin/nvidia-container-cli --load-kmods configure --ldconfig=@/sbin/ldconfig.real --device=all --utility --pid=11077 /var/lib/docker/overlay2/510a6de5ed82decf7421a392e5274b4fe47e8d0cd3610175c3550f1d26c91376/merged]\\\\nnvidia-container-cli: initialization error: driver error: failed to process request\\\\n\\\"\"": unknown
```

说是驱动有问题，第一个想到的就是因为将早先的 `nvidia-384` 驱动更新到了 `nvidia-410` 可能有问题，再重启之后没有作用，于是尝试通过 `apt` 重新安装 `nvidia-410`：

```
$ add-apt-repository ppa:graphics-drivers/ppa
$ apt update
$ apt install nvidia-410
```

重启后依然发现类似问题，再去搜索发现 [https://zhuanlan.zhihu.com/p/37519492](https://zhuanlan.zhihu.com/p/37519492) 和我遇到的问题类似，通过命令 `nvidia-container-cli -k -d /dev/tty info` 得到具体的报错：

```
E0117 08:51:20.843706 12905 driver.c:197] could not start driver service: load library failed: libnvidia-fatbinaryloader.so.384.145: cannot open shared object file: no such file or directory
```

`384` 这个驱动版本我明明已经删了，为什么还要找这个库呢？是不是因为新的 `410` 安装的不全呢？再往后看，提到

> 安装驱动的时候会自动安装这个 libcuda1-384 包的，估计是什么历史遗留问题，或者是 purge 又 install 把包的依赖关系搞坏了，因此现在需要重新安装。

立即想到我的 `410` 是不是也没有安装 `libcuda1-410` 呢？赶紧 `apt search libcuda` 发现果然有这么个依赖，`apt install libcuda1-410` 赶紧安装，再次跑 `nvidia-container-cli -k -d /dev/tty info` 就一切正常了。



