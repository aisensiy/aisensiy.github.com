---
layout:     post
title:      "使用 ansible 为 ubuntu 设置代理"
date:       2021-12-30 23:19:00 +08:00
author:     "Eisen"
tags:       [devops, ansible]
---

最近为一些藏在防火墙里的存储节点做 provision 由于是非常受限的外网访问，必须要通过代理访问网络，因此需要对原来的 ansible 脚本做修改，这里做一个记录。

看了看 ansible 里面的内容以及后续的 k8s 的流程，无非是如下几个方面需要访问外网：

1. curl 一些 github 上的一些公钥
2. apt install
3. k8s 拉镜像

那么，对应的就是以下三个方面的代理配置：

1. http_proxy / https_proxy 环境变量配置
2. apt 不走环境变量的代理，需要单独配置下
3. 我这里依然使用的 docker 拉镜像的时候也要做独立的配置，不过在一篇 [旧文- 国内环境下更好的 docker 镜像获取](/docker-accelerate) 已经介绍过了

## 设置全局环境变量

根据 ansible 的文档 [Setting remote env](https://docs.ansible.com/ansible/latest/user_guide/playbooks_environment.html) ansible 提供了 `environment` 的关键词，可以在 `task` `play` 等不同层级添加环境变量：

```yaml
- hosts: all
  remote_user: root

  tasks:

    - name: Install cobbler
      ansible.builtin.package:
        name: cobbler
        state: present
      environment:
        http_proxy: http://proxy.example.com:8080
```

```yaml
- hosts: testing

  roles:
     - php
     - nginx

  environment:
    http_proxy: http://proxy.example.com:8080
```

当然，我们这里就没什么外网，那自然就走一个全局的。


## 添加 apt 的 proxy 配置

apt 的 proxy 需要放到 `/etc/apt/apt.conf.d` 下，格式如下:

```
Acuire::http { Proxy "http://proxy:1234" }
Acuire::https { Proxy "http://proxy:1234" }
```

写成一个 ansible task 就是下面这个样子：

```yaml
- name: add proxy for apt
  copy:
    dest: /etc/apt/apt.conf.d/02proxy
    content: |
      Acquire::http { Proxy "{{ http_proxy }}" }
      Acquire::https { Proxy "{{ https_proxy }}" }
```

其中 `http_proxy` 和 `https_proxy` 抽出来做为变量后面填写进来。

## 添加 docker 的 proxy

在上面提到的旧闻中讲过了，启动 docker 的时候需要配置环境变量，放到 systemd 的配置 `/etc/systemd/system/docker.service.d/http-proxy.conf` 中：


```
[Service]
Environment="HTTP_PROXY=http://proxy:1234"
Environment="HTTPS_PROXY=http://proxy:1234"
```

然后需要执行命令 `systemctl daemon-reload`。

## 放在一起

放在一起差不多就是这个样子：

`roles/proxy/tasks/main.yml`:

```yaml
---
- file:
    dest: /etc/systemd/system/docker.service.d
    state: directory
- name: add docker proxy settings
  copy:
    directory_mode: yes
    dest: /etc/systemd/system/docker.service.d/http-proxy.conf
    content: |
      [Service]
      Environment="HTTP_PROXY={{ http_proxy }}"
      Environment="HTTPS_PROXY={{ https_proxy }}"
- name: reload docker
  service:
    name: docker
    state: restarted
    daemon_reload: yes
- name: add proxy for apt
  copy:
    dest: /etc/apt/apt.conf.d/02proxy
    content: |
      Acquire::http { Proxy "{{ http_proxy }}" }
      Acquire::https { Proxy "{{ https_proxy }}" }
```

`entry.yml`:

```yaml
---
- hosts: nodes
  vars:
    http_proxy: "http://proxy:7890"
    https_proxy: "http://proxy:7890"
  environment:
    http_proxy: "http://proxy:7890"
    https_proxy: "http://proxy:7890"
  roles:
  - role: proxy
```

## 更好的方案

有没有更好的方案？我觉得有，就是用 [tun2socks](https://github.com/xjasonlyu/tun2socks/) 的方案，可以实现以上三个方面的代理设置。不过还没很仔细的折腾，等搞定了再做记录。
