---
layout:     post
title:      "记录 nvidia gpu 报错处理"
date:       2022-05-10 15:35:00 +08:00
author:     "Eisen"
tags:       [gpu, nvidia]
---

又发现了集群里出现了挂掉的 nvidia gpu 这里记录下如何屏蔽掉它以保证其他 GPU 可以继续被使用。

首先是监控告警，告知 `nvidia-smi` 命令出错了，去机器上看一下有这么个错误：

```sh
$ nvidia-smi
Unable to determine the device handle for GPU 0000:89:00.0: Unknown Error
```

感觉是这块卡 `0000:89:00.0` 出问题了。然后去执行下 `dmesg` 看看情况：

```sh
$ dmesg -T
[Mon May  9 20:37:33 2022] xhci_hcd 0000:89:00.2: PCI post-resume error -19!
[Mon May  9 20:37:33 2022] xhci_hcd 0000:89:00.2: HC died; cleaning up
[Mon May  9 20:37:34 2022] nvidia-gpu 0000:89:00.3: i2c timeout error ffffffff
[Mon May  9 20:37:34 2022] ucsi_ccg 6-0008: i2c_transfer failed -110
```

看不懂，搜了搜也有点懵逼。这台机器已经运行了挺久了，驱动也在短期内没有出过问题，那么就感觉是硬件出问题了。重启机器后，`nvidia-smi` 恢复了。不过如果有其他任务使用了 GPU 就又会出现这个问题了。所以考虑使用 `nvidia-smi` 的命令先屏蔽掉这块报错的 GPU 。

```sh
$ nvidia-smi drain  -p 0000:89:00.0 -m 1
Successfully set GPU 00000000:89:00.0 drain state to: draining.
```

然后再执行命令 `nvidia-smi` 就看不到这块卡了。
