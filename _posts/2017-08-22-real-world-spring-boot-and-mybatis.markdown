---
layout:     post
title:      "Spring Boot + Spring MVC + MyBatis 版本的 Real World 实现"
date:       2017-08-04 19:03:00 +08:00
author:     "Eisen"
tags:       [java, spring, mybatis, realworld]
---

[Real World](https://github.com/gothinkster/realworld) 是由 [thinkster](https://thinkster.io/) 这样一个在线编程教育机构发起的一个前后端分离的项目规范。用以展示并作为教材教大家用 react、angular 等不同的前端框架或者 rails、django、spring boot 等不同的后端框架实现同一个项目时的实践是什么样子的。这个主意非常的好，它让大家对技术的讨论有了一个共同的主题，在采用不同的技术栈以及设计思路解决这个共同的问题的时候我们可以更确切的看到不同的方案之间的优劣，从而更切实的（而不是零散的代码和想象）了解不同框架、语言、设计思路在实现一个项目时的差异，从而帮助我们更好的选择项目的解决方案。

虽然这个项目叫做 real world，相比 todomvc 这样的 hello world 确实复杂了不少，但是很显然它的复杂度还仅仅是一个人几个小时就能完成的水平，当然不能全面的反映出一个框架的水平，仅做参考。

这里我想出一个系列的文章，首先介绍我自己 spring boot + spring mvc + mybatis 的后端实现方案，然后再将其和其他的框架做一个对比，看看不同的方案之间的优势和短板。

本篇对项目做一个整体的介绍，后续会有一些细节的介绍。文章中会涉及到很多 DDD 相关的概念，想要更多的了解建议看看最下面相关材料中的链接。


## 项目功能

[conduit](https://demo.realworld.io/#/) 是 realworld 要实现的一个博客系统。具备一下的功能：

1. 用户的注册和登录
2. 用户可以发表、编辑文章
3. 用户可以对文章添加评论、点赞
4. 用户可以关注别的用户，关注的用户的文章会展示在用户的 feed 中

![](/img/in-post/realworld-get-started/conduit.png)

这是一个前后端分离的项目，其提供了后端 api 的[规范](https://github.com/gothinkster/realworld/tree/master/api)。这里，我们不评论其 API 设计的好坏，要完全遵循其设计并实现它。当然，对于不同的语言和框架实现都有其 API 设计的偏好，既然这里定死了一种规范，那么在实现的过程中难免会有一些 tricky 的地方需要我们去克服。

## 目录结构

如标题所述，这里我提供了一个 spring boot + spring mvc + mybatis 的实现。其大概的结构如下:

```
.
├── JacksonCustomizations.java
├── MyBatisConfig.java
├── RealworldApplication.java
├── api
├── application
├── core
└── infrastructure
```

1. `api` 是 web 层，实现了和 spring mvc 的 web 接口
2. `core` 是业务层，包含了最关键的业务实体和领域服务以及其各个实体之间的交互
3. `application` 是对外的服务层，由于这个项目本身的业务并不复杂，这里处理的基本都是各种信息的查询
4. `core` 中定义的大量接口在 `infrastructure` 包含了其具体的实现，比如 data mapper 的实现，具体的密码加密的实现等
5. 其他则是一些整体的配置类，如主类 `RealworldApplication` 数据库配置类 `MyBatisConfig` 等

## 六边形架构

[六边形架构](http://alistair.cockburn.us/Hexagonal+architecture) 其实不是一个什么新的架构体系，它只是强调说系统不应该强调前端和后端，因为这样会给人造成后端数据库可以和业务逻辑揉在一起的感觉（事实上很多项目也确实这样，大量的存储过程中包含着业务的炉逻辑，业务和数据库紧密的结合在了一起）；而更应该强调内部和外部：内部是我的业务逻辑，而外部与外界沟通的基础设施，比如具体的数据库存储，比如 restful 的 api，再比如 html 的视图。

![](/img/in-post/realworld-get-started/hexagonal.png)

通过这样的思考方式，我们可以认为 mysql 数据库实现仅仅是众多数据库实现中的一个而已，我们可以在不同的环境中轻易的替换掉它，尤其是为对业务的测试提供了可能：我们可以采用内存数据库或者 mock 轻松的实现业务测试。

我所实现的这个 realworld 项目也基本遵循这个架构，首先在 `core` 中定义了我们的业务实体 `User` `Article` 已经各种 `Repository` 的接口。他们定义了这个项目核心实体的关系以及交互行为。其中具体的 Repository 的实现以及 web 接口的实现都与它无关。对于比较简单的数据创建等行为我们直接在 web 层中处理了，而相对比较麻烦的查询业务我们按照用例在 application 中提供。

在 api 层直接创建用户：

```java
@RequestMapping(path = "/users", method = POST)
public ResponseEntity createUser(@Valid @RequestBody RegisterParam registerParam, BindingResult bindingResult) {
    checkInput(registerParam, bindingResult);

    User user = new User(
        registerParam.getEmail(),
        registerParam.getUsername(),
        encryptService.encrypt(registerParam.getPassword()),
        "",
        defaultImage);
    userRepository.save(user);
    UserData userData = userQueryService.findById(user.getId()).get();
    return ResponseEntity.status(201).body(userResponse(new UserWithToken(userData, jwtService.toToken(user))));
}
```

在 application 层创建一个 `findRecentArticles` 的服务，用于处理相对比较复杂的查询：

```java
public ArticleDataList findRecentArticles(String tag, String author, String favoritedBy, Page page, User currentUser) {
    List<String> articleIds = articleReadService.queryArticles(tag, author, favoritedBy, page);
    int articleCount = articleReadService.countArticle(tag, author, favoritedBy);
    if (articleIds.size() == 0) {
        return new ArticleDataList(new ArrayList<>(), articleCount);
    } else {
        List<ArticleData> articles = articleReadService.findArticles(articleIds);
        fillExtraInfo(articles, currentUser);
        return new ArticleDataList(articles, articleCount);
    }
}
```



**注意** 这里之所以没有为创建数据的用例在 application 中创建 service 纯粹是因为它们比较简单，在面向复杂的场景时是可以提供的。

## CQRS

在 DDD 中 Repository 主要负责数据的持久化：它的任务非常的简单：要么是将内存中的 aggregate 储到数据库中，要么是从数据库中将指定 id 的实体从数据库中重新在内存中构建起来。它实际上是不负责那种复杂的查询业务的，比如获取被喜爱最多的 50 篇文章。更多的内容可以看[这篇文章]({% post_url 2016-04-20-some-tips-for-ddd %})。

CQRS 全称 Command Query Responsibility Segregation，强调一个系统的读模型和写模型是分离的。其中 DDD 所实现的是读模型，保证了业务的实现以及数据的一致性。而读模型则纯粹是利用底层数据库的优势将用户需要的数据拼装起来，完全不涉及到实体。这样的好处在于我们可以完全实现界面所需要的数据模型和真正的业务模型的独立演进：对于查询业务，我们在 `application/data` 下提供了单独的 `Data Transfer Object`。

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticleData {
    private String id;
    private String slug;
    private String title;
    private String description;
    private String body;
    private boolean favorited;
    private int favoritesCount;
    private DateTime createdAt;
    private DateTime updatedAt;
    private List<String> tagList;
    @JsonProperty("author")
    private ProfileData profileData;
}
```

可以看到 `ArticleData` 就是 `DTO` 或者说是 `Presentation Model` 它和 API 文档中对数据的格式要求完全对齐而不考虑 Article 和 Author 到底应不应当属于一个聚合。

而下面则是在 core 下的实体：

```java
@Getter
@NoArgsConstructor
@EqualsAndHashCode(of = {"id"})
public class Article {
    private String userId;
    private String id;
    private String slug;
    private String title;
    private String description;
    private String body;
    private List<Tag> tags;
    private DateTime createdAt;
    private DateTime updatedAt;
	...
}
```

很显然，这里 Article 中并不包含 Author 的概念，因为它们并不属于一个聚合，Article 只能保存另外一个聚合的 Id (userId)。

## 相关资料

1. [Real World](https://github.com/gothinkster/realworld)
2. [CQRS](https://martinfowler.com/bliki/CQRS.html)
3. [DDD Repository](https://aisensiy.github.io/2016/05/17/ddd-repository/)
4. [Some tips about DDD](https://aisensiy.github.io/2016/04/20/some-tips-for-ddd/)
