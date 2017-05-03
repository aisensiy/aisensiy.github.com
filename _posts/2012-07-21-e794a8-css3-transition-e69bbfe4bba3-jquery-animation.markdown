---
author: aisensiy
comments: true
date: 2012-07-21 11:22:12+00:00
layout: post
slug: '%e7%94%a8-css3-transition-%e6%9b%bf%e4%bb%a3-jquery-animation'
title: 用 CSS3 transition 替代 jQuery animation
wordpress_id: 302
categories:
- 关注web
tags:
- css
- jsbin
- transition
---

css3 的 transition 真的是个非常好用的东西，但是之前一直有一个疑惑就是比如我让一个元素通过修改`opacity`作出渐隐的效果，但是opacity变化成为0了之后要怎么办？我需要一个callback把它从dom中删除，但是css哪里来的callback。一直都有这么一个疑惑，但是自己从来没有去用心的解决过这个问题，于是这个想法就一直搁置在那里[1]。

最近实习遇到一下工作就是作一个photo的弹出展示的功能，功能类似于[lightbox](http://fancybox.net/)。但是由于项目的需求，不能添加非常庞大的额外的类库，需要手写个简化版本。在完成了基本的功能之后，我想要给这个控件添加一个`fadeIn` `fadeOut`的效果。按照通常的情景，我就直接上jQuery了，但是这次不行，要自己去作[2]。于是我就想到了用css作这个工作了，这样是最简单的办法了。

查了一下资料，其实还是挺好实现的。[http://www.greywyvern.com/?post=337#](http://www.greywyvern.com/?post=337#)对这个技术有非常详细的讲解[3]。我就把主要的东西再讲解一下吧。

首先上代码

```css
/*part one*/
#image-box, #image-mask {
  opacity: 0;
  -webkit-transition:
    opacity 0.3s 0,
    visibility 0 0.3s;
}

#image-box.active {
  opacity: 1;
}

#image-mask.active {
  opacity: 0.3;
}

/*part two*/
#image-box.active,
#image-mask.active {
  visibility: visible;
  -webkit-transition-delay: 0;
}
```

part one 中，定义了元素的`transition`以及最终的`opacity`样式。这里有两个关键点:


* 不使用`display`而是采用`visibility`。`visibility`为`hidden`时是对事件透明的。
* 想要的callback是通过对`transition`设置`delay`实现的。


part two 中，通过修改`delay`的时间实现了visibility在active时立即显示的效果。那么，这里我们可以看到，实现这样的动作需要加标志 active。
最后，上[demo](http://3.jsbin.com/igeyid/11)[4]。

其实有了[3]所说的东西，其实不需要我在这里累述的。但是其实我是来写感言的，以下才是本文的主题。

[1] 很多想法本身的优先级就不高，低的低于看动漫，上点评。所以几乎不会去作的。那么，需要一些机会或者是工具来帮助自己去实现这些看似优先级不高，但是积累[5]起来是非常有意义的东西。

[2] 实习就是一个非常不错的给自己提供机会的方式，任务驱动确实可以让自己去有很多机会作新的尝试的，而更重要的是自己作出这个选择。

[4] 利用更好的工具也是一个让自己更快的去做的好办法。jsbin可以让自己用更快的速度去进行核心功能的开发而不需要关心其他琐碎的建立html template，繁琐的打开浏览器不断的F5。而且，目前的jsbin已经提供了less以及各种js类库的添加，这些都已经大大的节省了程序员的时间。

[5] "积累"是个很难完成的任务，它需要持之以恒，需要持续的迭代。所有的想法以及不错的技术都应该用一种便于检索的形式保留下来，以便自己之后可以更快的索取。

那么，之后我可能会去写一篇有关知识管理，时间管理以及项目控制的东西，来更好的给自己的发展提供一些指导意见。
