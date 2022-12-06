---
layout:     post
title:      "使用 ansible 的 facts 生成 hosts 信息"
date:       2022-12-07 00:47:00 +08:00
author:     "Eisen"
tags:       ["ansible"]
---

<iframe src="//player.bilibili.com/player.html?aid=475933411&bvid=BV1MK41197sr&cid=914635147&page=1" width="100%" height="640" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

最近在看以前的代码，发现 `ansible` 的代码里有一些模板是从 `ansible` 的 `vars` 生成 `/etc/hsots` 的代码。这里做了些调研，了解了下用法。这里大量的过程都放到了视频里了，下面的算是笔记吧。

## `facts` 是什么，如何收集

`facts` 可以理解为 `ansible` 从主机收集的各种信息，通过如下命令可以看其到底收集了什么：

```sh
ansible all -i inventory.yaml -m gather_facts
```

通过 `ansible-doc gather_facts` 可以知道这个行为是在 `playbook` 执行之处就自动执行的。

## 如何使用 `facts` 生成 `hosts` 文件

`ansible` 帮我们收集的 `facts` 会放进 `vars` 里供我们使用。比如 `hostvars` 这个变量里就有了 `facts` 的信息，可以通过 `debug` 来展示这个信息：


```yaml
- hosts: "all"
  tasks:
  - name: Debug hostvars
    ansible.builtin.debug:
      var: hostvars
```

```yaml
- hosts: "all"
  tasks:
  - name: Debug groups
    ansible.builtin.debug:
      var: groups
```

执行命令 `ansible-playbook all -i inventory.yaml generate_hosts.yaml` 可以看到其中的内容。


然后这里我提供一个简单的模板文件 `hosts.j2`:

```
{% for host in groups["all"] | sort -%}
  {% if hostvars[host]['ansible_default_ipv4'] is defined -%}
    {{ hostvars[host]['ansible_default_ipv4']['address'] }} {{ hostvars[host].hostname }}
  {%- endif %}  
{% endfor %}
```

利用如下的 playbook 就可以生成 `hosts` 文件了（我这里就放到了 home/test 做了个测试，没有实际覆盖 `/etc/hosts`）。

```yaml
- hosts: "all"
  tasks:
  - name: Test hosts
    ansible.builtin.blockinfile:
      path: /home/ubuntu/test
      marker: "# -----{mark} NODES IN CLUSTER-----"
      create: true
      block: "{{ lookup('template', 'templates/hosts.j2') }}"
```

## 补充 `inventory.yaml`

```yaml
virtualmachines:
  vars:
    ansible_user: ubuntu
  hosts:
    vm01:
      ansible_host: 106.75.236.174
      hostname: vm01
    vm02:
      ansible_host: 113.31.107.13
      hostname: vm02
```

可以看到这里给每个 `vm` 配了一个 `hostname` 然后在 `hostvars` 里也能拿到的。

## 参考资料

- [Jinja2 template white space control](https://ttl255.com/jinja2-tutorial-part-3-whitespace-control/)
