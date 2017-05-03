---
author: aisensiy
comments: true
date: 2011-03-29 12:28:33+00:00
layout: post
slug: some-thing-about-python
title: Some Thing about Python
wordpress_id: 26
categories:
- 读书笔记
---

> A major rule of thumb in Python is to code for simplicity and readability first and worry about performance later, after your program is working, and after you’ve proved that there is a genuine performance concern. More often than not, your code will be quick enough as it is. If you do need to tweak code for performance, though, Python includes tools to help you out, including the time and timeit modules and the profile module.


我认为这是一个很重要的原则，不仅仅在python。事实上，绝大多数的程序效率并不是什么问题，主要的矛盾在于你的想法与你所写程序的功能。而这显然是一个代码的质量以及生产率的问题。如何用更短的时间写出更多更优秀的代码才是王道。


> We should forget about small efficiencies, say about 97% of the time: Premature optimization is the root of all evil.—Donald Knuth


而且，对效率的处理，应该在出现效率问题的时候才开始考虑吧。今天看Bruce Eckel的Thinking in Patterns with Java 最开始的章节里就讲到了这个所谓的"premature optimization"，他引用了Knuth的话，强调除非你真的测试到这部分代码确实很耗时，需要对其优化，不然不要主观臆断的去提前优化它，这样的做法很浪费开发时间。纵使你的感觉是对的(那段代码确实很耗时！)，他依然主张要从全局去考虑：整个程序的运行中，90%的时间浪费在10%的代码之中，那你所考虑的代码真的被包含进去了么？去花时间处理那10%就可以了，我们的时间是很宝贵的。其实道理很简单：完美是不可能的，去用最短的时间获取最大的优化吧。
