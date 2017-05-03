---
layout:     post
title:      "DDD Repository"
date:       2016-05-17
author:     "Eisen"
tags:       [ddd, repository]
---

标题是 `Repository`，但是内容是我如何从错用的 `Repository` 变成了感觉还算对的 `Repository` 的过程。

## 之前的做法

DDD 里面的 `Repository` 是一个处理数据存储或者说是数据持久化的单元。通常一个 `Aggregate` 对应一个 `Repository`。对于通常的 web 服务，很多时候我们都是在与数据存储打交道，以至于很多时候存储就成为了真个应用最关键的逻辑了。那么刚刚接触 DDD 的时候，我就觉得 Repository 就是以前经常使用的类似 DAO 的东西。下面这样的代码经常出现在我们的应用里面。

```java
final Application app = applicationRepository.create(name, user, stack);
return Response.created(routes.application(app)).build();
```

其中 `applicationRepository` 管理了对于应用的创建。为了创建我们的对象 `app` 我们将一堆需要的参数扔进一个 `applicationRepository` 这样子的不知道背后是什么鬼实现的黑盒子，出来就是我们想要的东西了。再看另外一个例子。

```java
public class ApplicationRecord implements Application, Record {
    ...
    @Override
    public void removeEnv(String envName) {
        mapper.removeEnv(envName, this);
    }
    ...
}
```

在这里例子里面，`application` 可以有环境变量，在 `application` 中提供了一个 `removeEnv` 的方法，`mapper` 是一个具体的持久层工具 `Mybatis` 需要的东西，可以忽略。当我需要删除环境变量的时候，我只需要做如下的事情。

```java
Application app = applicationRepository.ofId(appId);
app.removeEnv(envName);
```

在这里事实上我根本没有显性的调用任何持久化方法，在 `app` 里面持久化就偷偷的帮我把事情做了。然后需要注意的是我的 `Application` 仅仅是一个接口，实现它的是一个 `ApplicationRecord` 它内部通过注入的方式塞进去了 `Mybatis DataMapper` 的东西从而实现了持久化的工作。然后在 `Mybatis` 可以放一个叫做 `ObjectFactory` 的东西使得 `Mybatis` 和 java injector 关联子一起，当从 `Mybatis` 获取对象时 `Mybatis` 会自动的讲所有的依赖注入到这个对象里。

说白了就是**将数据层和模型绑定在一起，持久层做了业务层的事情**。

## 希望的样子

然而我希望的是可以将业务层做成这个样子：

1. 没有对什么持久层的依赖，甚至完全不知晓持久层。
2. 领域模型不应该是接口而已，接口不能描述具体的业务行为，我同意接口和实现分离的方式，但是分离的实现也应该是领域模型重要的一部分而不是和持久层放在一起
3. `Repository` 作为和存储打交道的组件应该仅仅是做**持久化**，它就是拿来一个对象，然后存到数据库里，没有任何业务逻辑，没有任何花哨的方法。

## 改进后的样子

```
interface ApplicationRepository {
    void save(Application application);
    Application ofId(String appId);
}
```

没有什么 `addEnv` `removeEnv` 等等，这些都是 `Application` 自己要做的。`Mybatis` 版本的 `Repository` 具体的 `mapper` 仅仅出现在 `MybatisApplicationRepository` 里面，其他地方都不会出现。按照这个思路把上边的代码修改之后是下面这个样子。

```java
final Application app = new Application(name, user, stack);
applicationRepository.save(app);
return Response.created(routes.application(app)).build();
```

新创建的 `app` 本身就是一个 `POJO` 里面全部都是纯粹的业务代码。

```java
public class Application {
    private Envs envs;
    ...
    public void removeEnv(String envName) {
        envs.remove(envName);
    }
    ...
}
```

`Application` 有一个 `envs` 的属性，在调用 `removeEnv` 之后，`application` 的环境变量就更新了。如果需要持久化，就单独调用 `applicationRepository`。

```java
Application app = applicationRepository.ofId(appId);
app.removeEnv(envName);
applicationRepository.save(app);
```

这样的话持久化就和业务逻辑完全的分离开了，所有的 `POJO` 保证即使没有持久化也都可以正常的运转。领域对象是 `class` 而不是 `interface` 保证了内部的逻辑都是包含在业务层的。



















