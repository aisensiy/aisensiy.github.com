---
layout:     post
title:      "在 ubuntu server 下使用代理"
date:       2018-06-11 00:48:22 +08:00
author:     "Eisen"
tags:       [devops, proxy]
---

我们在自己的办公电脑上需要一些方式访问 google.com 等一些网站。在使用 ubuntu server 的时候同样也需要安装一些被 block 的依赖，因此对于很多 server 也需要做类似的配置。这里记录一下自己配置的过程。

## 前提条件

首先，这里所有的配置是建立在我已经有了一个 ss 的 server 的前提之下。

## 1. 安装 libev 版本

```sh
sudo add-apt-repository ppa:max-c-lv/shadowsocks-libev -y
sudo apt-get update
sudo apt-get install shadowsocks-libev -y
```

## 2. 配置 client

修改 `/etc/shadowsocks-libev/config.json`

```json
{
    "server": "{{ ssserver }}",
    "server_port": {{ ssserver_port }},
    "local_address": "127.0.0.1",
    "local_port": 1080,
    "password": "{{ ssserver_password }}",
    "timeout": 600,
    "method":"{{ ssserver_method }}",
    "fast_open": true
}
```

重启服务

```sh
systemctl daemon-reload
systemctl restart shadowsocks-libev-local@config
systemctl enable shadowsocks-libev-local@config
```

至此，本地已经有了 sock5 的代理：localhost:1080。然而系统使用的代理大多是 http_proxy 我们需要另外一个工具 [polipo](https://github.com/jech/polipo)。

## 3. 配置 http https 代理

polipo 可以把 socks5 代理转化为 http 代理用。首先安装 polipo

```
sudo apt-get install polipo -y
```

然后修改配置文件 `/etc/polipo/config`

```
socksParentProxy = "localhost:1080"
socksProxyType = socks5
```

重启服务

```sh
systemctl enable polipo
systemctl restart polipo
```

然后可以在命令行下试试看了：

```
http_proxy=http://localhost:8123 curl www.google.com
```


## 参考

1. [UbuntuServer配置ShadowSocks代理](https://blog.yourtion.com/ubuntu-server-add-shadowsocks-proxy.html)

