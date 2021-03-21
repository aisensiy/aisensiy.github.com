---
layout:     post
title:      "GraphQL Cursor 分页"
date:       2021-03-21 22:50:11 +08:00
author:     "Eisen"
tags:       [web, graphql]
---

GraphQL 之前已经夸了不少了，见 [REST vs GraphQL]({% post_url 2021-02-20-rest-vs-graphql %})，确实在**标准化**方面远超 REST 了，这也是我想要切换到 GraphQL 的一大原因。不过 GraphQL 甚至连分页也提了一个标准，挺有意思的，看了看他们的 [GraphQL Cursor Connections Specification](https://relay.dev/graphql/connections.htm) ，想做一些自己理解的记录。

这样标准化的好处就是可以让前端也有一个类似的组件去处理分页，让这部分的工作就直接通过这个公共组件给覆盖了。想象一下，如果有更多的东西可以以这种方式形成标准，那相当于不少工作也就可以复用了呢？

分页这个东西虽然没有这样子如此明确的标准，但其实从各种文档、书籍、博客里也都逐渐形成了类似的标准了呢，毕竟这已经是一个非常古老的需求了。这里我就以最简单的方式介绍目前两种针对不同场景的分页风格，更多的信息可以从下文的参考中找的到。

## 两种分页方式

### limit offset 分页

对于记录不多并且增删不频繁的场景，`limit-offset` 的方式基本是最健全的分页了。通过从数据库的 `select * from xx limit xxx offset xxx` 配合 `select count(*) from xx` 可以获取非常全面的分页信息以及动作：

- 一共多少页
- 当前是第几页
- 去下一页
- 去上一页
- 去第一页
- 去最后一页

但缺点也很明确：offset 这个语法对数据记录多的场景不友好，查询速度会明显下降，同时对快速变化的数据也不友好，很容易丢查询数据。

### cursor limit 分页

`cursor-limit` 分页则是以类似于 `select * from xxx where cursor < xxx order by cursor limit xx` 的方式获取相对于 `cursor` 的记录。相对于 `limit-offset` 的方式会**很难**获取以下信息：

- 一共多少页
- 当前是第几页
- 去最后一页

## graphql cursor connection 标准的一些细节

### 保留字段

GraphQL 定义凡事以 `Connection` 结尾的结构都遵循 `Cursor Connection` 的数据结构，并且名为 `PageInfo` 的东西都是 `Cursor Connection` 下的 `PageInfo` 结构。

### 查询参数

`first after` 与 `last before` 必须分组出现，也就是说可以是以下几种形式:

1. `articles(first: Int!, after: String!)`
1. `articles(last: Int!, before: String!)`
1. `articles(first: Int, after: String, last: Int, before: String)`

第三种就是同时支持正序和倒序查找，也就是支持向前翻页。

### 具体算法和实施

这里就按照 `first after` 为例子做介绍了，`last before` 都是反过来的，就不复读机了：

1. 首先查询的时候按照 `after + 1` 去查询，如果返回的个数为 `after + 1` 那就意味着有下一页（hasNextPage），否则就是没有。
1. 如果还要考虑判断 `hasPreviousPage` 那意味着每次都多一个查询 `select * from xxx where cursor < #{startCursor} limit 1`，如果有结果就意味着返回 `true`。
1. 当然对很多自动加载下一页的场景就不考虑往前翻页了，这个就直接全部 `false` 就好了。

## 最后

最近把 [realworld-example-app](https://github.com/gothinkster/spring-boot-realworld-example-app) 改写的差不多了，已经同时支持 GraphQL 和 REST 了，其中 GraphQL 部分的分页也是按照 `cursor connection` 的形式做的，然后我需要找个前端的 RealWorld 项目去对接下，看看我这个分页折腾的对不对了。

## 参考

- [How to Implement Cursor Pagination Like a Pro](https://medium.com/swlh/how-to-implement-cursor-pagination-like-a-pro-513140b65f32)
- [Is offset pagination dead? Why cursor pagination is taking over](https://uxdesign.cc/why-facebook-says-cursor-pagination-is-the-greatest-d6b98d86b6c0)
- [GraphQL Pagination](https://graphql.org/learn/pagination/)
