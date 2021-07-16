---
layout:     post
title:      "Some tips about DDD"
date:       2016-04-20
author:     "Eisen"
tags:
    - ddd
---

DDD 即 Domain Driven Design, 领域驱动设计，似乎是一个比较老的东西了，2003 年这本书就出版了。不过这么多年来我是从来都没有知晓过，直到参加了小巨人的培训。在培训的过程中，我自己尝试自己对某个领域进行建模并且以 REST API 的形式实现自己的设计，而整个过程中都要尽量的遵循 DDD 的一些设计原则，可惜培训时间太短了，我需要更多的时间去消化。半年多来我一直都在琢磨这个主题，即使工作任务很重的时候我依然在尝试把以前自己认为不遵循 DDD 设计的一些项目按照我理解的 DDD （对，我理解的，不代表是对的）进行了重写，这虽然花了不少的时间但我认为这是值得的。其中经常出现的几个名词 `aggregate` `value object` `entity` `bounded context` `domain model` `repository` `factory` 一直以来我总觉得自己没有把它们彻底的搞明白。整个体系对我来说依然没有在我的脑海中建立起来。直到最近，在认认真真的看完了几本 DDD 主题的书籍以及众多有关这个主题的文章和演讲之后，我才觉得我对这方面的理解有了起色，我逐渐的弄明白了 DDD 的真正意图，清楚了 REST 和 DDD 的关系，我才敢写下这篇文章。

培训中 REST 和 DDD 的主题是被放在一起讲解的，REST 按照 DDD 中 `aggregate` 的形式被组织在一起。看下面这样一组 REST API:

```
/users
/users/:user-id
/users/:user-id/orders
/users/:user-id/orders/:order-id
```

`user` 作为一个 `aggregate` 的 `root`，它包含了其下所有的 `order`。这样最初看起来没什么不妥，`order` 是随着 `user` 出现的，`order` 的生命周期是受 `user` 控制的。这就像是 Evans 在第六章节举的那个例子，`line item` 是 `order` 的一部分。但是在实现这部分 api 的时候我发现我有一点是难以做到的：`order` 是不能够随着 `user` 一起载入到内存的，它不像是 `order` 与 `order line item` 那样的关系。user's orders 这个集合是可以不断的扩张的，我甚至不能把一个用户所有的 order 一次性的载入到内存中，我需要分页，我需要根据默写规则对用户的订单进行筛选。此时再仔细想想 DDD 的那个例子，里面涉及了很多的并发冲突，然而当我需要拿到用户以及查询订单的时候会有什么呢？没有，什么冲突都不会发生。逐渐的我才明白其实我一开始就理解错了。事实上，**DDD 关注的是一个写模型**，并发的冲突都是在有写操作的时候才会出现。例子中的创建和修改订单都是写，而我所要考虑的仅仅是读而已，读事实上什么麻烦都不会产生，怎么读都不会产生问题。

再去看看 Implementing DDD 这本书的例子，`application` 这个 package 被分成了两部分，一部分是 `Query` 一部分是 `Command`，没错就是 CQRS 的思路。一个个 `Command` 调用了 `domain` 中的对象和方法，实现了关键的业务。而 `Query` 的 Data Model 和 Domain Model 有质的区别，Query Service 甚至是直接拼装了 HQL (Hibernate SQL)。它更多的是面向 UI 的：需要展示什么就提供什么。那么这样来看，很多事情就迎刃而解了。

简单的来讲，aggregate 就是为了解决一个并发的问题。aggregate 就是定义了一个业务场景中最小的锁单元：任何人对一个 aggregate 操作时其他人都不能再对这个单元进行操作了。而整个业务中数据的一致性也是由这样的方式得到了保证。那么回到上面的例子，`user` 下的 `order` 是没有道理和 `user` 建立为一个 `aggregate` 的。`user` 和 `order` 分别是一个单 `entity` 的 `aggregte`。

DDD 仅仅是一个写模型。在通过 REST API 暴露一个 Domain 的接口的时候要明确每一个方法分别对应了相应资源下的什么操作。虽然很多的数据和演讲中强调 REST 和 DDD 没关系，并且 Rest 的 Resource 也和 DDD 中的 Entity 没有映射关系，但是我个人觉得从 UL 的角度来说，外部所看到的东西和 Domain 所提及的东西应当一致，只是 REST 会隐藏很多细节罢了。当然，这里所谓的隐藏细节也可能隐藏的多到内外的概念是不一致的。其中 `GET` 和其他操作相比有着质的区别，它可能采用了纯粹的 DTO 而不涉及任何的 Domain，这样在实现模型的时候我们就不必小心翼翼的去让 Domain Model 尽量的和 Rest 所需要获取的数据保持一致了。这也是我自己在整个过程中最困惑的地方了。

到这里，按照 DDD 设计的思路就清楚多了，我不再担心如何让 GET 方法从 Domain 中拿到它想要的东西了。我可以在设计的时候首先关注更重要的业务流程，然后在需要的时候用最简单的方式提供相应的 Query Service 即可。
