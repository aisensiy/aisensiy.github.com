---
layout:     post
title:      "Learn wercker"
date:       2016-06-02
author:     "Eisen"
tags:       [docker, wercker, pipeline, ci, cd]
---

半年来一直在做一个 PaaS 的项目，比较关注市面上的相关产品。最近发现一个叫做 wercker 的项目，感觉做的还不错，介绍一下。

## wercker 要解决的问题

目前有很多的平台（如 mesos, rancher, kubernetes）都支持以 `docker image` 的形式进行应用的部署，但是却没有很多的工具帮助将 ci/cd 与这些平台进行更好的对接。而 wercker 的口号是 `From code to container`，强调自己可以做 ci/cd 的事情将代码转化为容器。那么之后就可以将这个容器作为交付的内容在需要的环境进行部署了。

## wercker 的特性

1. pipeline as cde
   
	wercker 提供一个类似于 `ansible` 的 `wercker.yml` 并提供与 `ansible` 类似的自定义命令来做部署的工作。
	
	自定义命令的功能非常的强大，种类也非常的丰富。例如 `npm-install` 安装 `node` 的依赖，`internal/docker-push` 将生成的 `image` 上传到 `docker registry`，`marathon-deploy` 将应用部署到 `marathon` 平台。
	
	整个 `pipeline` 可以通过这些命令拼装起来，所有的 pipeline 都可以通过一个 `wercker.yml` 文件进行管理。
   
2. 本地环境

	wercker 有一个命令行工具 `wercker-cli` 支持在本地通过 `docker` 和 `wercker-cli` 构建一个本地的开发环境，并且支持在本地环境提供 `backing service`。
	
3. 多 vendor 支持

	wercker 可以和多个 `PaaS` 对接的，包括 `heroku` `kubernetes` `marathon` `ecs` 等。这一点非常的难能可贵，想象一下，作为一个开发者，当有了类似于 `ecs` 或者 `heroku` 这样的公有云之后再配合 `wercker` 这样的工具可以快速的搭建 `pipeline` 以及完成以前需要花费更多时间才能得到的 `ci/cd` 开发效率真是大大的提升。
	
4. ui 界面
	
	提供一个 ui 界面管理整个 pipeline
	
5. 与 github & bitbucket 对接

	支持 github bitbucket hook，在有新的 commit 之后自动构建、部署。
	管理关键数据，有些数据不适合存放在 `wercker.yml` 中，例如 `heroku` 的 `accesskey`，`docker-hub` 的账号密码。
	
## 参考

[wercker](http://wercker.com)