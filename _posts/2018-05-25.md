# docker 存储

由于自己接触 docker 的时候和现在的 docker 不少的 api 已经有所变化，还是需要更新一下自己的知识。这篇文章大部分源自 docker 的官方文档，然后还有部分自己添油加醋。

在 docker 中所有的文件是存储在容器的 `writable container layer`。存在以下的问题：

* 容器里的数据不好拿出来
* 在容器里写依赖于 `storage driver` 采用了 `union filesystem` 效率低下

然而 docker 提供了可以直接往 host 机器写内容的方式：

1. volumes
2. bind mounts
3. tmpfs

采用这些方式，即使容器关了甚至删除了数据依然不会丢失。

![111](http://o8p12ybem.bkt.clouddn.com/15272493128441.jpg)


## 选择适合的数据绑定方式

首先不论是采用哪种方式，在容器里看起来都是一样的。

* Volume 将数据存储在 host 但是其实是由 docker 管理的 `/var/lib/docker/volumes` 非 docker 无法使用
* Bind mounts 是可以将数据随意存储在任意 host system 文件系统中，任何非 docker 应用也有权利对其进行使用
* tmpfs mounts 将文件存储在内存中

## 更多详情

### Volume

Volume 可以通过 `docker volume create` 显式创建，当然 docker 也可以在运行的时候创建 volume（比如在 `Dockerfile` 里面有 `VOLUME` 语法时如果没有没有显式绑定 volume 那么就会默认创建一个新的 volume）。

```
docker volume create data
docker run -v data:/data ...
```

**注意** `docker volume inspect xxx` 会得到如下的结果：

```
[
    {
        "CreatedAt": "2018-05-22T07:53:58Z",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/test/_data",
        "Name": "test",
        "Options": {},
        "Scope": "local"
    }
]
```

其存储的位置为 `/var/lib/docker/volumes/test/_data` 但是在 Mac OS 下你会发现根本没有这个目录，那是因为 Mac 下的 docker 还是以 linux 虚拟机的形式运行的，你所看到的是其虚拟机下的目录而不是 Mac 下的目录。

### Bind mounts

其功能相对 volume 比较有限。但是其好处是可以绑定任意的外部目录给 docker，尤其是在做一些外部数据共享给 docker 的时候非常适合。

```
docker run -v /tmp/data:/data:ro ...
```

### Tmpfs

我自己是没有直接使用过。基本就是用于沙盒环境吧。

```
docker run --tmpfs /data ...
```

## 注意

两个特殊的场景：

1. 如果你 mount 一个 empty volume 到一个 container 中已经存在的文件夹，那么 container 会将容器目录中的内容拷贝到这个空的 volume 里面
2. 如果你使用 bind mount 或者一个非空的 volume 绑定到容器中某一个目录，那么目录里面的东西就会隐藏而只能看到 bind mount 或者 volume 里面的内容。注意，原有的内容不是被删除了而仅仅是被隐藏了


## 相关文献

1. [Docker Volumes](https://docs.docker.com/storage/volumes/)
2. [Use bind mounts](https://docs.docker.com/storage/bind-mounts/)
3. [Use Volumes](https://docs.docker.com/storage/volumes/)

