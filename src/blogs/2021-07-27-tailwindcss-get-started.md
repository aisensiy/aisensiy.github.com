---
layout:     post
title:      "初始 tailwindcss"
date:       2021-07-27 19:54:00 +08:00
author:     "Eisen"
tags:       [css, tailwindcss, react]
---

在 [上一篇文章](/blog-migrate-from-jekyll-to-gatsby) 中提到了已经在自己的新博客中集成了 tailwindcss 。这篇对这个思路不太一样的 css 框架做一些介绍。

## 核心思想

用过 bootstrap 的人都晓得，bootstrap 提供了如下内容：

1. 一套默认的样式，比如 `h1` 长什么样 `button.btn` 长什么样
2. 一套布局系统，默认 12 列，实现各种宽度组合
3. 一套通用组件库，比如面包屑，比如下拉菜单

和 bootstrap 体系几乎一样的东西还很多，比如当年雅虎的 [purecss](https://purecss.io/start/)。

相比于 bootstrap 这种被大家所广泛认知的 css 框架，tailwindcss 有如下差别：

1. 没有默认样式，单有一套 reset 样式，将所有的东西设置为一样的大小，比如 `h1` `h2` `p` 的字号、颜色都一样
2. **所有的** css 样式完全通过一系列工具类（utility classes）组合实现，比如一个 `button` 可以这么实现：
  
    ```html
    <div class="rounded-md shadow">
      <a href="#" class="w-full flex items-center justify-center
                          px-8 py-3 border border-transparent
                          text-base font-medium rounded-md 
                          text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg
                          md:px-10">
        Get started
      </a>
    </div>
    ```

    结果如下：

    ![](2021-07-27-20-05-13.png)

3. 默认没有提供通用组建库，不过这部分我认为更多还是一个商业上的考虑

其中第二条算是 tailwindcss 最大的特色了，虽然 bootstrap 也包含很多工具类，但 bootstrap 的工具类并不是可以解决所有问题的，仅仅是一个辅助措施。而在 tailwindcss， 工具类就是实现 html 完整样式的最小单元。

全部通过类组合类拼凑样式看起来有点丑陋，以及它违反了 html 语义化的原则。不过 tailwindcss 的作者撰写了 [一篇文章](https://adamwathan.me/css-utility-classes-and-separation-of-concerns/) 对这部分困惑做了很详尽的说明。我非常推荐直接阅读原文并阅读文中引用的另外一篇文章：[About HTML semantics and front-end architecture](http://nicolasgallagher.com/about-html-semantics-front-end-architecture/)。这里我把我理解的一些重要观点放在这里，这也是我认可 tailwindcss 并开始使用的原因。

1. 语义实际上是让 css 依赖 html。在 html 结构需要扩展的时候，css 必须随之变化，而 html 确实经常变化，所以并没有省什么事
2. 原本的语义化思路有点问题，一个名为 `author` 的 `class` 真的有意义么？从实际角度出发， `class` 是给 `css` 用的而 `css` 关心的是样式，所以 `class` 改成 `media-card` 更合理，也就是说语义化面向的应该是 css 而不是 html 里的内容
3. 语义化是让 css 依赖 html 那么可不可以反过来，让 html 依赖 css？从文章 [About HTML semantics and front-end architecture](http://nicolasgallagher.com/about-html-semantics-front-end-architecture/) 获得灵感，确定反过来反而更有效：

    > When you choose to author HTML and CSS in a way that seeks to reduce the amount of time you spend writing and editing CSS, it involves accepting that you must instead spend more time changing HTML classes on elements if you want to change their styles. This turns out to be fairly practical, both for front-end and back-end developers – anyone can rearrange pre-built “lego blocks”; it turns out that no one can perform CSS-alchemy.

    这里简单翻译一下：

    > 如果你试图找到一种方法来减少花费在 css 上的时间，那么你就必然会花费更多时间在 html 上。不过这种结果是更易于实施的：不论是前端工程师或是后端工程师，都更易于修改这些预定义的 "乐高积木"，但没人是 CSS 炼金术师（轻松驾驭编辑 CSS 代码）。

4. 相对于 bootstrap 更细粒度的工具类给了用户更大的自由度，可以完全脱离手写 css 而构建复杂的样式，不必再为扩展基本样式而担忧了
5. 之所以反对手写 css （inline style 或者类似于 styled component）是因为它会带来大量的碎片化样式，通过 tailwindcss 可以避免样式的泛滥（比如有太多种字号大小）

## 入门资料

tailwindcss 的 youtube 频道里视频教程做的太好了。请把 [Tailwind CSS: From Zero to Production](https://www.youtube.com/playlist?list=PL5f_mz_zU5eXWYDXHUDOLBE0scnuJofO0) 这个系列一口气全部看完，你就可以掌握 tailwindcss 的基本用法了。

看了之后你大概可以收获这些内容：

1. tailwindcss 类的命名规律，你就不会太害怕自己记不住了
2. 配合使用的一些列工具是什么，比如 vscode 插件
3. tailwindcss 怎么做响应式设计
4. 怎么扩展 tailwindcss
5. 怎么使用 purgecss 对 css 文件进行压缩

## 目前的博客是如何使用 tailwindcss 的

博客的情况其实反而有点不太适合 tailwindcss 的场景，因为博客里面的 markdown 是需要从外部注入样式的，而不是像 tailwindcss 推荐的那样去对每个元素添加工具类。官方也有一篇视频 [Styling Markdown and CMS Content with Tailwind CSS](https://www.youtube.com/watch?v=J0Wy359NJPM) 介绍如何处理，这里我使用了官方的方式并且按照 [Use TailwindCSS Typography with Dark Mode Styles](https://sergiodxa.com/articles/use-tailwindcss-typography-with-dark-mode-styles) 增加了 dark mode 的支持。

然后就是在 `global.css` 多了些修修补补的支持：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
    body {
        @apply bg-white dark:bg-gray-700 transition duration-500;
    }
    .main .permalink {
        @apply fill-current text-gray-800 dark:text-gray-200;
    }
    .main {
        @apply text-gray-800 dark:text-gray-200;
    }
    .main h1 {
        @apply text-3xl md:text-4xl font-extrabold tracking-tight my-4;
    }
    .main h2 {
        @apply mb-4 text-gray-600 dark:text-gray-300;
    }
    .main {
        @apply break-words;
    }
}
```

可以看到，响应式的支持和 dark mode 的支持都在里面了。

## 小结

我认为它在两个方面的工作是非常有意义的：

1. 将 html 和 css 的依赖反转是正确的。事实上由于业务的变化，展示信息的变化，html 的变化速度是很快的，每次让 css 被动变更确实会导致额外的工作量。中立的细粒度的 css 一定程度上会有所帮助
2. 直接在 class 上增增减减就能实现排版从认知上确实让人觉得容易了，而且有了 `STATE VARIANTS` （就是 `focus:` `hover:` `md:` 这样的前缀工具类）确实让 css 的工作变得更集中更清楚了，比一个独立的文件以及松散的排布要好

tailwindcss 似乎在尝试将 css 乐高化以进一步降低前端工程师的门槛。但我觉得这个乐高依然是有门槛的，如果你甚至不晓得 `flex` `display` `position` `float` 这些基本的概念，那么你依然没办法去使用这些工具类。
