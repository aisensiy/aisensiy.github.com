---
author: aisensiy
comments: true
date: 2011-05-11 13:31:53+00:00
layout: post
slug: '%e8%af%bb%e4%b9%a6%e7%ac%94%e8%ae%b0practices-of-an-agile-developer-1-%e5%8e%bb%e4%bd%a0%e8%af%a5%e5%8e%bb%e7%9a%84%e5%9c%b0%e6%96%b9'
title: '读书笔记 | Practices of an Agile Developer 1: 去你该去的地方'
wordpress_id: 114
categories:
- 读书笔记
tags:
- 实践
- 开发
- 敏捷
---

本科期间，差不多一直是自己在做开发，每个项目(自己做的那些东西，真不能和正经项目比，不过想不到别的词汇了，就暂且这么说吧)差不多都是因为兴趣而起，因为项目的腐烂(程序员修炼之道, Software Entropy)而终。由于自己不成熟的编程技术以及开发手段，总是闹出各种各样的项目现在真的是有内伤了，做项目真的有点害怕了，害怕自己做的这么点儿的项目都难以维护，哪还敢去接其他的东西呢。

## 曾经的尝试

我也一直想办法去改善这种情况，更准确的说，一直在找开发的方法以及开发的工具。从最开始用<%%>的JSP到用JSTL，从用STRUTS+JDBC到STRUTS2+Hibernate。后来觉得做这种web开发太累了，实在没心情去写那些讨厌的数据库CRUD讨厌在多个浏览器之间测试兼容性了。之后听说了敏捷以及TDD这些东西，有眼前一亮的感觉。在之后的一个小东西里面尝试了Junit，开始真的很不错，可是我感觉自己没有掌握好方法，总感觉自己做的很多东西是没办法做测试的。比如，我做爬取，不知道怎么样设计这个测试，导致最终的单元测试代码中开始出现System out这样的东西...更可悲的是在一次对项目迁移的时候放弃了自己觉得越来越混乱的单元测试代码，紧紧保留了"真正"的代码。之后就没有好好去尝试TDD了。还有就是版本控制了，最开始用SVN，现在想想挺2的。首先，自己根本没有仔细研究这个东西，为了用这么个版本控制，自己在自己的电脑上装了服务器又装了客户端，总觉得开着个apache挺别扭的...现在好了，在一次交流活动中听说了git这个有趣的东西。发现github这个伟大的网站，我把最近的开发项目纷纷转移到了那里，舒服多了～


## 之后的思考


我一直觉得做开发应该是一件很有意思的事情，它应该让我觉得开心，让我觉得有成就感，但事实却让我很失望，每次做开发都让我觉得很担心，很有压力，我担心问题不能解决，我担心系统不够完善，我担心bug频出，我担心越来越难维护的代码。我反复思考是不是哪里出了问题，应该怎么去改善。我一直觉得现在这么多问题是自己采用的技术不够好，自己的眼界不够广，自己的编程能力不够强和经验不够丰富。我觉得我也确确实实在努力的看书学习，去关注更新更好的技术，参加一些技术社区的活动，去一些平台多多coding。但是，我更缺少的是一种信念，一种支持，一种转变成强大信心的东西去弥补之前的内伤。


## 转变


以前也看过一些敏捷的东西，但是不够上心。以前总觉得结对编程什么的对我来说没什么用，因为我是一个人在编程，那种团队的东西对我来说完全没有必要，主观的排斥这些内容。后来关注的就是TDD了，但是就像我前面所说的，我发现很多东西不好实现测试，而且很多东西在我开发之初都不知道它应该是个什么样子，都是走一步看一步，所以根本没有一个测试的框架。之后再一次百度开发者大会上，我听了一个敏捷开发的演讲让我有了眼前一亮的感觉。感觉他所说的一些问题正是我所遇到的问题，让我认识到不仅仅是我这样的小菜鸟也遇到了类似的问题，而且也让我感受到敏捷确实是在针对这些问题在做事情。于是我又一次翻出一个讲敏捷的，评价很高的书 Practices of an Agile Developer。我只能用我直白的语言讲，真的很不错。我想把自己比较喜欢的话以及对这本书的感慨都写下来。


## 正题

>  No matter how far down the wrong road you' ve gone, turn back.


希望我可以迷途知返...
下面就是伟大的敏捷宣言，每次看都让我感慨万千：那就是我所期望的开发的感觉。
书中的开篇提到了很多精神上，态度上的问题：团队合作应该建立在一个平等的，乐观的，充满活力的氛围之中的。但是这种氛围的基础一定是团队里面的人都要靠谱！这个非常重要，一定不能有打酱油的人存在。如果你发现你的队友有人在打酱油，就应该剔除他，如果你的队友都在打酱油，那你就应该离开这个团队。


> If a team member is repeatedly harming the team by their actions, then they are not acting in a professional manner. They aren't helping move the team toward a solution. In that case, they need to be removed from this team.

> If the majority of the team (and especially the lead developers) don't act in a professional manner and aren't interested in moving in that direction, then you should remove yourself from the team and seek success elsewhere (which is a far better idea than being dragged into a "Death March" project

这个是一切的基础，平等的水平才有平等的待遇才有平等的互利。怎么能让一个大牛面对一堆菜鸟呢，那大牛显然是输出多输入少了，而且也会觉得很别扭，自然而然的想撤了。


> Don’t code in isolation


这也是要有平等的水平才行的吧，如果我的代码总是很烂而你的代码很好，我总是能从你那里收获很多而你从我这里却收获甚微，让我来看是不是有点亏，当然这种说法确实有点小家子气了，不过事实就是这样的，各有亮点才能相互学习，共同进步~


> You can't be an expert at everything. Don't try, But once you're an expert at a few things, it becomes easier to gain expertise in selected new areas.


第三章，谈到要不断地学习，我是有心学习的，可总觉得自己不求甚解的态度太不靠谱。是的，不可能样样精通的，但是这个精通到底是要达到什么样的地步呢？
之后，又谈到了对团队的建设方面，要多多共享自己的信息(6 invest your team)，但是作者更强调:


> Is Everyone Better Than You? Good!
Legendary jazz guitarist Pat Methany offers this advice: "Always be the worst guy in every band you' re in. If you' re the best guy there, you need to be in a different band. And I think that works for almost verything that’s out there as well."
Why is that? If you're the best on the team, you have little incentive to continue to invest in yourself. But if everyone around you is better than you are, you'll be keenly motivated to catch up. You'll be on top of your game.


这也是我自己一直坚持的观点，我想去一个所有人都比我厉害的地方(而且我觉得不会很难:))。这也更表明了作者的态度，平等源于"平等"。


## 注解以及书单

1. [程序员修炼之道](http://book.douban.com/subject/1152111/)
2. [Practices of An Agile Developer](http://book.douban.com/subject/1767907/)


