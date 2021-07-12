---
author: aisensiy
comments: true
date: 2013-04-07 14:10:26+00:00
layout: post
slug: autosize-textarea
title: autosize textarea
wordpress_id: 513
categories:
- 学习笔记
tags:
- javascript
---

最近需要一个功能，要让 textarea 可以根据内容进行自动 resize 保证元素的高度不能低于目前填充内容的高度。这种需求似乎也挺广泛的了。比如 zhihu 的评论就应用了这样的体验。

最近自己也需要这样的体验效果，于是 google 了下，迅速的找到了一个 jquery 的插件就 ok 了。不过我自己想了下，感觉自动的增加高度是可行的。


    elem.style.height = elem.scrollHeight + 'px';


似乎就可以解决问题。但是，如果我删除了一些文字，怎么能够让已经变高的文本框再变低呢。这个我没有想到什么解决办法。于是就去看了下人家的源码，发现这个功能做的非常的聪明。还是要利用 `scrollHeight`  这个东西来做。


    elem.style.height = 0; elem.style.height = elem.scrollHeight + 'px';


简单说明一下，把 `height` 设置为 0 之后，`scrollHeight` 的值就是真实的高度了。那么，把目前的高度设置成 `scrollHeight` 就 ok 了。

```js
var auto_grow = function(elem) {
  var len = elem.len || 0;
  var h = elem.scrollHeight;
  if (h != len) {
    elem.style.height = 0;
    elem.style.height = elem.scrollHeight + 'px';
    elem.len = elem.scrollHeight;
  }
};

$('textarea').bind('keyup', function() {
  auto_grow(this);
});
```

那么就是这么简单。
