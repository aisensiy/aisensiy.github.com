---
layout:     post
title:      "unbound 的安装与基础应用"
date:       2022-12-06 22:47:00 +08:00
author:     "Eisen"
tags:       ["dns", "unbound", "homelab"]
categories: ["homelab"]
---

了解到 unbound 可以用于做本地的 recursive dns server 同时也能支持本地的域名解析，打算用这个东西给内网做域名解析。而用 unbound 有这么两个好处：

1. 使用 recursive dns server 可以避免把请求都发给上级的缓存服务器，很大程度上保证了个人隐私，也相对会更安全，当然搭配 pi-hole 这样的东西使用效果更佳 https://docs.pi-hole.net/guides/dns/unbound/
2. unbound 除了做 recursive dns server 外也能接管内网域名解析，作为一个 authoritative server 使用（当然，它并不是专门做这个的，但是规模比较小的网络是没问题的）

## unbound 的安装

以下是在 ubuntu 20.04 的安装流程：

```sh
sudo apt update && sudo apt install unbound -y
```

### 基础配置

先来一个简单的配置：

```
server:
    # can be uncommented if you do not need user privilige protection
    # username: ""

    # can be uncommented if you do not need file access protection
    # chroot: ""

    # location of the trust anchor file that enables DNSSEC. note that
    # the location of this file can be elsewhere
    auto-trust-anchor-file: "/usr/local/etc/unbound/root.key"
    # auto-trust-anchor-file: "/var/lib/unbound/root.key"

    # send minimal amount of information to upstream servers to enhance privacy
    qname-minimisation: yes

    # specify the interface to answer queries from by ip-address.
    interface: 0.0.0.0
    # interface: ::0

    # addresses from the IP range that are allowed to connect to the resolver
    access-control: 192.168.0.0/16 allow
    # access-control: 2001:DB8/64 allow
```

把它放到 `/etc/unbound/unbound.conf.d/myunbound.conf` 这里，然后 `systemctl restart unbound` 重启服务。

### 解决 53 端口冲突的问题

不出意外的话，重启 `unbound` 服务会报错，大概的报错信息是说 53 端口已经被占用了。这个时候可以通过 `netstat -tulpn` 来查看端口占用情况，发现是 `systemd-resolved` 占用了 53 端口，简单搜索会找到 https://unix.stackexchange.com/questions/304050/how-to-avoid-conflicts-between-dnsmasq-and-systemd-resolved 这么一个问题。按照其中内容修改 `/etc/systemd/resolved.conf` 设置 `DNSStubListener=no` 并重启 `systemd-resolved` 服务就可以了。

## 测试 unbound 是否工作

```sh
$ dig openbayes.com @127.0.0.1

; <<>> DiG 9.16.1-Ubuntu <<>> openbayes.com @127.0.0.1
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 52191
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;openbayes.com.			IN	A

;; ANSWER SECTION:
openbayes.com.		600	IN	A	106.75.109.110

;; Query time: 1524 msec
;; SERVER: 127.0.0.1#53(127.0.0.1)
;; WHEN: Sun Dec 04 14:59:32 CST 2022
;; MSG SIZE  rcvd: 58
```

可以看到第一次很慢，但是第二次由于已经有了缓存，速度会快起来：

```sh
$ dig openbayes.com @127.0.0.1

; <<>> DiG 9.16.1-Ubuntu <<>> openbayes.com @127.0.0.1
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 26243
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;openbayes.com.			IN	A

;; ANSWER SECTION:
openbayes.com.		535	IN	A	106.75.109.110

;; Query time: 0 msec
;; SERVER: 127.0.0.1#53(127.0.0.1)
;; WHEN: Sun Dec 04 15:00:37 CST 2022
;; MSG SIZE  rcvd: 58
```

## 让 unbound 接管本机的域名解析

上面的 `dig` 命令需要主动选择 `@127.0.0.1` 作为域名解析的服务。我们当然是希望默认就使用 `unbound` 来做域名解析。这里我参考的 unbound 文旦 https://unbound.docs.nlnetlabs.nl/en/latest/use-cases/home-resolver.html#setting-up-for-a-single-machine 进行配置。

首先继续修改 `/etc/systemd/resolved.conf`:

```
[Resolve]
DNS=127.0.0.1
#FallbackDNS=
#Domains=
DNSSEC=yes
#DNSOverTLS=no
#MulticastDNS=no
#LLMNR=no
#Cache=no-negative
DNSStubListener=no
#DNSStubListenerExtra=
```

然后强制更新下 `/etc/resolv.conf`:

```sh
ln -fs /run/systemd/resolve/resolv.conf /etc/resolv.conf
```

最后重启 `systemd-resolved` 服务：

```sh
systemctl restart systemd-resolved
```

执行 `dig` 的时候，就默认使用 `127.0.0.1#53` 了呢。

到此为止，unbound 的基本配置就完成了。

## 添加 local-zone

最后就是利用 `unbound` 所提供的 `local-zone` 配置实现内网域名解析了：

```
server:
    # can be uncommented if you do not need user privilige protection
    # username: ""

    # can be uncommented if you do not need file access protection
    # chroot: ""

    # location of the trust anchor file that enables DNSSEC. note that
    # the location of this file can be elsewhere
    # auto-trust-anchor-file: "/usr/local/etc/unbound/root.key"
    # auto-trust-anchor-file: "/var/lib/unbound/root.key"

    # send minimal amount of information to upstream servers to enhance privacy
    qname-minimisation: yes

    # specify the interface to answer queries from by ip-address.
    interface: 0.0.0.0
    # interface: ::0

    # addresses from the IP range that are allowed to connect to the resolver
    access-control: 192.168.0.0/16 allow
    access-control: 10.23.0.0/16 allow
    # access-control: 2001:DB8/64 allow

    local-zone: "home.lan." static
    local-data: "abc.home.lan. A 127.0.0.1"
    local-data: "bbc.home.lan. A 127.0.0.1"
```

`dig abc.home.lan` 就发现域名指向了 `127.0.0.1` 了。
