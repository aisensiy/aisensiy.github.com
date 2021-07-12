---
author: aisensiy
comments: true
date: 2012-09-11 15:27:17+00:00
layout: post
slug: all-about-sublime-text-2
title: All about sublime text 2 -- sublime 使用的一些经验
wordpress_id: 332
categories:
- 工具
tags:
- editor
- sublime
- vim
---

最近一直在折腾 sublime text2 这款编辑器，终于是用顺起来了。这里写篇 blog 记下如何快速的配置好一个易用的 sublime text，并分享一些技巧和资源。

以前有用过 vim ，用过 vim 的人都知道，这，是神奇，难以替代。但是要知道，不是每个人都可以驾驭神器的，而且神器也是有适用场景的。比如在 linux 环境下，配合 terminal 的一些命令使用 vim 真的是酣畅淋漓。但是换了 windows 就没有那么顺了。那么，可否有一个替代品呢，当然有很多，但是 sublime text2 作为 editor 里面的新宠当然有它的过人之处。我今天就主要写一下我使用 sublime 的经验。不过，有篇文章 [Sublime Text 2 Tips and Tricks](http://net.tutsplus.com/tutorials/tools-and-tips/sublime-text-2-tips-and-tricks/) 已经算是 sublime 的 get started 了，我想，如果你没有用过 sublime 还是先看那篇比较好，这里会跟多的讲到配置的选择以及插件的推荐。<!-- more -->


## 使用 sublime text2 给个理由先

当然，一开始有一个非常重要的问题要谈，那就是为什么要用 sublime text2。额...这个问题吧，其实这是个人爱好问题。每种 editor 或者 ide 都有它们各自的优势和劣势，我不想在这上面吐太多口水。我主要列出来这么几点吧。

* sublime 是一个轻型的文本编辑器，不是 ide，它的各种动作都很快。这种快的好处就是，我不需要每写一小段代码就要兴师动众的建立 project 等等，而是 ctrl_n 就开始写，ctrl_s 完了就去测试。但是，它同时支持项目的概念。可大可小，应用自如。
* 其功能足够强大，可以满足大多数需求，如项目中的字符搜索，快速文件查找，快速定位函数等等。
* 它可以轻松的进行扩展。可以像 vim 那样安装插件，也可以自己添加所谓的 snippets，一种自定义的 auto-complete 的东西，用过的人都知道，在别的编辑器中也有这个概念（貌似 textmate 是最开始有的？我不清楚，没有用过 textmate）。这种扩展的机制使得各种更高的功能的需求可以得到满足。我在下文中也会提到几个我觉得很赞的功能，它们都可以很好的提升我们的工作效率。
* 还有就是它看起来很漂亮...不要忽略这个。我记得当初看过一个讲 sublime 的视频的时候，那货说自己不用 notepad++ 的理由就是，It's ugly. 有好看的干啥要用丑的呢？当然，这条对很多人来说不算是什么重要因素就是了，但是我确实很喜欢它的默认高亮主题的。




## 从无到有，把它做到让你顺手


好吧，和 vim 类似，虽然安装好了的 sublime 就差不多可以用了，但是作为一个长期使用 editor 混饭吃的人，这当然是不够的。


### 从配置文件下手


sublime 有自己的 config 文件，我们可以设定一些喜好，让它更顺手。Preferences - Settings 有两个，一个是 settings - default 一个是 settings - User。我们大可以在 settings - user 里面大做文章。废话不多说，直接附上我觉得还不错的配置。

```
{
    "color_scheme": "Packages/Color Scheme - Default/Monokai.tmTheme",
    "detect_slow_plugins": false,
    "rulers": [80],
    "tab_size": 4,
    "translate_tabs_to_spaces": true,
    "ignored_packages": [],
    "indent_to_bracket": true,
    "use_tab_stops": true
}
```

对，就是这么简单，这样差不多就够了。这个配置会兼容 vim 模式，按下 esc 就会回到 vim 的普通模式了哦。虽然 sublime 下支持的 vim 的功能比较有限，但是用惯了 vim 的同学应该还是会比较亲切的。这个配置我做了一个 gist 在 [https://gist.github.com/3617664](https://gist.github.com/3617664)。

然后这里要说一点，对于每种编程语言，其实都可以有一个新的配置文件来覆盖默认的配置的。点击 Preferences - Browse Packages 就会看到各种语言的收藏夹。在相应的文件夹下，新建并编辑 *.sublime-settings 文件即可。这里 [http://stackoverflow.com/questions/9712113/can-i-set-tab-with-to-2-spaces-in-ruby-and-4-spaces-in-javascript-with-sublime-t](http://stackoverflow.com/questions/9712113/can-i-set-tab-with-to-2-spaces-in-ruby-and-4-spaces-in-javascript-with-sublime-t) 有介绍哦。


### Package Control


sublime 有个 package control 可以让你像 apt-get 那样轻松的安装文件。具体安装这个 package controll 移步这里 ===> [http://wbond.net/sublime_packages/package_control/installation](http://wbond.net/sublime_packages/package_control/installation)。安装了这个东西之后，就可以很爽的安装各种插件了啊！！！！下面就列几个我觉得很给力的插件吧！

* [HTMLPrettify](https://github.com/victorporof/Sublime-HTMLPrettify) 用来格式化 html css 的
* [DOCBlockr](https://github.com/spadgos/sublime-jsdocs) 更方便的写注释 
* [SublimeLinter](https://github.com/SublimeLinter/SublimeLinter) 多种语言的语法检查 
* [Gist for sublime](https://github.com/condemil/Gist) 可以让你更容易的把某个文件作为 gist 或者是把某个 gist 取回本地来，如果你养成了积累一些常用代码片段的习惯，这样的工具可以让你更快的做这些事情。我的配置文件就是用这种方式去上传和下载的。


这些插件当然不能满足我们的需求，其实很简单，在 ctrl_shift_p 之后 输入 install package 然后在新框框里面输入个比如 ruby 就看到各种 ruby 相关的包了，找个需要的安装之后立即就可以用了。


## 其他的技巧


* 添加一个文件夹到 sublime 然后 ctrl_p 就可以输入文件名来快速的打开文件了，这是最便捷的文件搜索工具了，平时用的频率非常高。
* ctrl_shift_f 全局搜索字符串，当然你也需要有一个文件夹或者是建立了一个项目。 


最后附上一个快捷键的列表，[https://gist.github.com/3618541](https://gist.github.com/3618541)。多多使用快捷键确实可以大大简化我们的操作的。比如 ctrl_enter 可以不用走到行尾就可以在当前行下添加新的一行，ctrl_d 选中当前的单词等等。

整体来说就是这样了，sublime 没那么复杂，很好入手，推荐一试。
