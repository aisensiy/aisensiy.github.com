---
layout:     post
title:      "Ansible 一些 tips"
date:       2018-04-16 18:33:00 +08:00
author:     "Eisen"
tags:       [ansible, devops]
---

Ansible 是一个自动化部署脚本，通过它可以让很多的 server 执行一系列相同的任务，是大规模集群管理的利器。虽然已经用了好久了，但是之前都没有记录一些使用的技巧。最近终于还是好好的记录了一些，免得自己以后忘得干干净净。

## 1. 如何跳过第一次登陆一个机器时的授权

我们创建一个新的机器第一次登陆的时候会显示如下的东西：

```sh
$ ssh root@xxx

The authenticity of host 'xxxx (xxxxx)' can't be established.
ECDSA key fingerprint is SHA256:xxxx.
Are you sure you want to continue connecting (yes/no)? 
```

如果管理的机器很多，每次都要去确认一下肯定是要了命了。为了避免这种 popup 的问题有如下两种方式：

1. 设置环境变量 `ANSIBLE_HOST_KEY_CHECKING=False`
2. 在 ~/.ansible.cfg 或者 playbook 同目录下的配置文件增加 

    ```
    [defaults]
    host_key_checking = False
    ```
    
[How to ignore ansible SSH authenticity checking? - Stack Overflow](https://stackoverflow.com/questions/32297456/how-to-ignore-ansible-ssh-authenticity-checking)

## 2. 使用 .pem 文件访问机器

```sh
ansible-playbook -v \
  -i inventory \
  -u ubuntu --become \
  --private-key=~/.ssh/k8s.pem \
  nvidia-docker.yml
```

## 3. 展示更详细的日志

```sh
ansible-playbook ... -vvvv ...
```

## 4. 使用 ansible galaxy 初始化 role

Ansible 里面有一个很重要的概念叫做 role：一个 role 完成一个特定的任务，比如安装 docker、比如安装 nginx，之所以这么拆分当然是为了更好的重用：有些 role 是很多机器都需要的，细粒度的 role 就可以很好的组合在一起使用。比如在安装 kubernetes 集群时所有的机器都需要事先安装 docker，给所有的机器都添加 docker 的 role 即可。

ansible 有一个 galaxy 有点像是 ansible 版的 github，它一方面提供了 role 的统一格式，另一方面提供了一个放置通用 role 的平台，方便大家去那里直接下载自己所需要的 role。

`ansible-galaxy` 提供了命令用来创建一个官方的 `role` 项目：

```sh
ansible-galaxy init [your role name]
```

## 5. 用 ansible galaxy 获取所有的依赖

前文提到 role 可以被复用。那么这里就是其复用的方法了。首先准备一个 `roles.yml` 文件：

```yaml
---

- src: https://github.com/xxx.git
- src: https://github.com/xxx.git
```

其中每一项是需要使用的 `role` 的 git 地址。

然后执行以下命令就可以将指定的 roles 下载到 `roles` 文件夹下使用了。

```sh
ansible-galaxy install -r roles.yml -p roles --force
```

## 6. 提供额外的参数

一些重要的变量是不能保存在 `ansible role` 脚本里面的，需要在运行的时候传入。这种场景下 `--extra-vars` 参数就登场了。

```sh
ansible-playbook --extra-vars="@extravars.json" ...
```

其中 `extravars.json` 是一个 `json` 文件，通过 `@` 符号就可以传入。

## 7. Ad-hoc command

有的时候发现原有的 ansible playbook 有瑕疵需要重新更改参数什么的，这个时候如果更新了 ansible playbook 再重新跑一遍实在不方便。这个时候就需要这种 ad-hoc command。

```sh
ansible cpu-worker -i inventory -m copy -a 'src=/etc/hosts dest=/tmp/hosts' -u ubuntu --private-key=xxx
```

如上所示，和 `ansible-playbook` 一致 `-i` 后面是 inventory，`-u` 后面是 username，然后具体使用的 module 在 `-m` 后面提供，额外的参数用 `-a` 后面提供。