---
layout:     post
title:      "REST 的一些实践心得"
date:       2021-02-16 19:36:00 +08:00
author:     "Eisen"
tags:       [web, rest, springboot]
---

这篇文章是强行插播过来的，本来是在做 GraphQL 的调研，但是发现其实 REST 这边的很多进展根本就没有说啊，那后面比较的时候很多东西就有点说不清楚了呢。所以就介绍下目前 REST API 开发过程中引入的一些不错的实践，重点是如何 OpenAPI 以及其工具链完善开发流程，降低沟通成本。

## TL;DR

就是标题了呢，绝大部分是围绕 openapi 以及其工具链介绍具体解决了什么问题。

## CQRS 读写分离，读数据结构要标准，写数据结构要简单

众所周知，REST API 可以按照行为分为「读」和「写」两种：

- 读：只获取数据，不对数据造成更改，用 `GET` 方法
- 写：更新数据内容，用 `POST` `PUT` `DELETE` `PATCH`

自我一篇很古老的[文章](/some-tips-for-ddd)里就提到了，`GET` 请求获取的是「读模型」（区分于文中所陈述的 DDD 的「写」模型），应该按照使用方需求合理展示相应数据。不过当时对「读模型」讲述的不够深入，实际上 `GET` 所返回的数据不是孤立的，而是相互关联的。例如有这么一个场景，主要包含两个资源 `user` 和 `blog`，`blog` 会有 `user` 作为其 `author`。有如下两个 API：

- `GET /users` 返回用户列表
- `GET /blogs` 返回博客列表

其中 `blog` 下会包含 `author` 的信息：

```
{ // blog
  "id": "xxx",
  "title": "xxx",
  "summary": "xxx",
  "tags": ["spring", "rest"],
  "author": { // author
    "name": "xxx",
    "avatar": "http://images.jpg",
    "description": "bla bla bla"
  }
}
```

然后可能会有一个用户的列表 `GET /users`，里面包含了用户的信息：

```
{
  "name": "xxx",
  "avatar": "http://images.jpg",
  "description": "bla bla bla"
}
```

blog 下的 author 和 users 下的每个 user 的结构如果没什么特殊原因应该是一致的，否则前端同学肯定一脸懵逼。这就是所谓的「结构标准化」了。**就是 REST `GET` 的返回结果应该按照 API 服务所提供的资源之间的关系有统一的结构。** 这部分和 GraphQL 的感觉有点异曲同工了。

而「写模型」数据通常是让前端去提交某种结果，其所需要的结构是在 `requestBody` 中。如果硬要提交的结构和返回的结构完全一致的话会有三个问题：

1. 完全做不到，因为很多数据是提交到后端后后端去更新和关联起来的，比如上文提到提 `blog` 的 `author` 字段通常都是自动生成的，怎么可能是提交上去的，这就不符合实际业务逻辑
1. 可能会非常冗余，让 API 适用方觉得比较繁(sha)琐(bi)
1. 容忍度不太高，使用者稍有不慎就会 400 警告

比如在 openbayes 创建 job 的 API 里面，需要用户去提交什么样子的资源绑定到什么路径上，如果是规范的提交方式应该是这个样子：

```
POST /jobs

{
  "data_bindings": [
    {
      "path": "/input0",
      "data": {
        "id": "abc",
        "name": "mnist",
        "type": "DATASET",
        "owner": {
          "id": "userid",
          "name": "username",
          ...
        }
        ...
      }
    }
  ]
}
```

其中大部分数据毫无意义，因为绝大部分信息都是在提供了 `userid` + `data-type` + `data-id` 之后后端直接在数据库中就查的出来的，所以合理的提交方式应该是以下的样子：

```
POST /jobs

{
  "data_bindings": [
    {
      "path": "/input0",
      "data": {
        "userid": "userid",
        "type": "DATASET",
        "id": "xxx"
      }
    }
  ]
}
```

再举个容忍度的例子，管理员创建一个新的商品：

```
POST /plans

{
  "name": "xxx",
  "description": "xxxx",
  "price": {
    "amount": 1.99,
    "currency": "CNY"
  }
}
```

其中这个 `price` 部分有点点小冗余了，如果可以**同时**支持以下方式可能会更友好：

```
POST /plans

{
  "name": "xxx",
  "description": "xxxx",
  "price": "CNY 1.99"
}
```

这部分我觉得就有点额外发挥的意思了，甚至会画蛇添足。将 API 调用 SDK 化可以极大程度上减少这种额外工作的必要。

## OpenAPI 标准化

API 越写越多，接口越来越复杂，前端调用的时候总要有个文档说说到底每个 API 都返回了啥吧，那么就要用 OpenAPI 了。

![petstore 的 openapi 3.0 样例](/img/in-post/rest-practice/2021-02-17-13-51-09.png)

OpenAPI 是一套标准，定义了如何用 json schema （的变种）去定义一套 REST API 的接口的。然后围绕这个标准产生了一系列的工具，这一系列的工具的组合一定程度上解决了我们 REST 开发中的诸多痛点。

### [redoc](https://github.com/Redocly/redoc) 用于生成文档

openapi 就是个 yaml 而且其官方提供的 [swagger editor](https://editor.swagger.io) 在这个 yaml 比较大的时候会很卡。干脆就用 intellij 去编辑了，但是我总是知道自己的语法写没写对吧。这个时候我就直接用 redoc 这个东西去渲染结果了，**如果展示的对就是正确的了**。

然后其实随着 api 的规模的增大，单个 yaml 已经承受不了了。最后分化出了多个 yaml 文档，并对 redoc 提供的 html 做了些许魔改形成了下面的这个样子：

![openbayes api 文档的样子](/img/in-post/rest-practice/2021-02-17-13-57-18.gif)

可以看到按照边界分成了 6 个 yaml 然后 openapi 支持每个之间做了相互的数据引用。

这个文档在一定程度上解决了前后端沟通的问题。

### [openapi-validator](https://github.com/IBM/openapi-validator) 用于文档校验

openapi 文档会又撰写 api 的人同步的更新，为了保证 openapi 上线前不要各种挂，就引入了 `openapi-validator` 在 ci 那边跑测试，如果校验没过就报错了呢。`openapi-validator` 相对比较灵活，有点像是 `lint`（巧了，openapi-validator 的命令行工具就叫 `openapi-lint`）可以自动的定制一些规则，要求文档的撰写者遵循。

### [openapi2schema](https://github.com/mikunn/openapi2schema) + [restassured](https://rest-assured.io/) 与后端测试集成

文档写好了，单毕竟就是个 yaml 而已，如何保证实际的代码和 openapi 一致呢？这里就魔改出来一个还算凑合的方案。

首先 `restassured` 是我们之前就广泛使用的 api 测试框架，然后它其实又一个 `JsonSchemaValidator` 组件，支持用 jsonschema 去校验请求的内容。然后我有找到一个名为 `openapi2schema` 的东西，可以把 openapi yaml 转换为  json schema 格式。那么我就可以实现用 openapi 文档去测试实际的代码是不是符合规范了，这里就直接截取项目中的一小段代码：

```java
public void should_get_a_workspace_with_one_dataset_binding() {
    String schema = getJsonSchema("api.json", "'/users/{userId}/jobs/{jobId}'.get.responses.200");

    // bla bla bla

    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .when()
        .get("/users/{uid}/jobs/{jid}", jobData.getUserId(), jobId)
        .prettyPeek()
        .then()
        .statusCode(200)
        .body(JsonSchemaValidator.matchesJsonSchema(schema));
  }
```

其中 `api.json` 就是利用 `openapi2schema` 将 openapi 转换为 `jsonschema` 的结果了。baeldung 有篇 [文章](https://www.baeldung.com/rest-assured-json-schema) 介绍了如何使用 rest assured 的 json schema validator。

### [openapi-generator-cli](https://github.com/OpenAPITools/openapi-generator-cli) 生成前端 sdk

最后，也是最重要的一环，为了让 openapi 有灵魂，一定是给前端把它的调用做封装，而不是让前端同学按照文档自己去写调用接口。这里用了 `openapi-generator-cli` 可以生成众多语言的 sdk，甚至支持 typescript 的 sdk。

![typescript sdk 的截图](/img/in-post/rest-practice/2021-02-17-14-39-31.png)

## HATEOAS

这部分在 [在 Spring Boot 中使用 HATEOAS](/spring-boot-and-hateoas) 介绍过了。简单的说就是两部分：

- 用 link 的有无反应权限
- 一定程度上确保 link 像网页那样为用户的 api 探索提供探索，尤其是对于「分页」「列表-详情」这样的关联性极强的 API 之间。

## 遇到的问题

吐槽下目前 REST 生态吧。

REST 没什么标准（甚至还会时不时为 REST 是什么而争论），唯一看起来像样的就是 OpenAPI 但是 OpenAPI 的问题也挺多的。

OpenAPI 不是什么大厂，没有很强的运营推广能力，很多东西的贡献也全凭兴趣，持久性和可靠性令人怀疑。比如目前 openbayes 的 API 已经相对比较多了，统计下 openapi 文档的行数已经相当恐怖了。以下几个文件还是自己强行拆分出来的，OpenAPI 自身对于多文件的支持并不是很好，目前的方案也不是很完美，可能需要结合 [How to split a large OpenAPI Specification into multiple files](https://davidgarcia.dev/posts/how-to-split-open-api-spec-into-multiple-files/) 这篇文章的方案做更多的尝试了。

```sh
ls *.yml | xargs wc

    8499   15129  216144 api.yml
    1543    2752   40366 finance.yml
     167     286    4375 notifications.yml
     823    1432   20210 orgs.yml
    1366    2401   35797 servings.yml
    1550    2696   37413 users.yml
   13948   24696  354305 total
```

redoc 并不支持完整的 openapi 语法，很多时候校验全凭效果，比如 `allOf` `oneOf` 这些继承语法。正如上文所说，「**如果展示的对就是正确的了**」。类似的问题在 `openapi-generator-cli` 也会出现，具体的问题也是千奇百怪。最终结果导致我们只能使用一个 openapi 语法的子集，并且我觉得如果 openapi 没有能力让下面的工具链与自己的标准协同更新，openapi 也就慢慢成了一纸空文。以及 `openapi2schema` 就更没谱了，就是个完完全全的个人作品，已经一年多没有更新了，后面还能不能用都不知道。

总的来说，上面的工具链有点像是纸糊的，摇摇欲坠，这也是我寻求 GraphQL 破局的重要原因之一吧。