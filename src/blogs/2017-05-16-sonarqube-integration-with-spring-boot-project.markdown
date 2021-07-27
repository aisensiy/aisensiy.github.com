---
layout:     post
title:      "将 sonarQube 和 gradle spring boot 项目集成"
date:       2017-05-16 14:00:00 +08:00
author:     "Eisen"
tags:       [java, springboot, spring-mvc, sonarQube, ci/cd]
---

在联想的项目接触了一下 [sonarQube](https://www.sonarqube.org/) 整体来说还是有很多可圈可点之处的，碰巧最近有一个相关产品的选择试用的调研，就尝试了一下下。

sonarQube 自己说自己用于做 continuous code quality， 从它所生成的默认的报告来看，主要包含了如下几个部分：

![](2021-07-27-13-34-04.png)

不过打开一看会发现其实 `Bugs & Vulnerabilities` 和 `Code Smells` 基本上就是 lint 所做的事情，比如代码风格不符合 java 的规约呀，在使用 `Optional` 之前判断其是否 `isPresent` 呀等等，不过人家本来就是做静态检查的也无可厚非。

`Code Smells` 这个名字实在是太唬人了，在 [重构](https://book.douban.com/subject/4262627/) 里定义设计的好坏在于有没有代码的坏味道，如果 sonarqube 有能力甄别所有的代码坏味道的话，那还怕神马低质量代码呢。不过起码 sonarqube 有能力甄别一部分低级的代码坏味道，比如过长的方法参数：

> Constructor has 9 parameters, which is greater than 7 authorized. 

再比如重复的代码呀

> 1 duplicated blocks of code must be removed.

甚至是提醒我们哪个方法所在的位置不合适

> Move this method into "Builder"

这么看来其功能还是可圈可点的，而且我所使用的还仅仅是最基本的配置，没有做任何的自定义。

## 集成

下面我介绍一下如何把 sonarqube 和 spring boot gradle 的项目做集成的。

### 安装 sonarqube

最好的安装办法自然是 [docker](https://store.docker.com/images/sonarqube)

    docker run -d --name sonarqube -p 9000:9000 -p 9092:9092 sonarqube

### 修改 gradle

按照 sonarqube 的[文档](https://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner+for+Gradle) 添加插件。

```groovy
plugins {
  id "org.sonarqube" version "2.4"
}
```

然后 `./gradlew clean test sonar` 执行命令。之后就可以在 http://localhost:9000 看到结果了。

不过这个时候你会发现并没有测试覆盖率的数据。

这是因为 sonarqube 自己不做测试覆盖的处理，它依赖于其他的测试覆盖工具。比如这里我们使用 [jacoco](https://www.eclemma.org/jacoco/)。

在 `build.gradle` 中添加 `jacoco`:

```groovy
apply plugin 'jacoco'
```

然后 `./gradlew clean test jacoco sonar` 再去 http://localhost:9000 查看就有相应的数据了。

### 和 ci 集成

刚才我们只是将我们的项目和一个本地的 sonarqube server 集成了，但是在实际项目中我们通常都是在 ci 中执行 sonar 命令并有一个共有的 sonar server 展现目前主分支代码的质量。那么，我们就需要在 ci 中指定外部的 sonar server 地址以及一些其他自定义的内容。

由于 sonarqube 支持以命令行的方式传入参数，这样的工作非常的简单：

    ./gradlew sonar -Dsonar.host.url=http://sonar.mycompany.com -Dsonar.verbose=true

最后附上测试[项目地址](https://github.com/aisensiy/springboot-get-started)。

