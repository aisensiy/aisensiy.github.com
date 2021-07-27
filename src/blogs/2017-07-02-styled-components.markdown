---
layout:     post
title:      "用 styled-components 在 react 中编写 css"
date:       2017-07-02 19:22:00 +08:00
author:     "Eisen"
tags:       [css, react]
---

这么久以来，各种各样的框架试图让 web 组件化。到目前为止，react 基本做到了这一点：用一个自定义标签的方式组织 html 在一起。

```html
<Wrapper>
	<Header />
	<ProductList />
	<Footer />
</Wrapper>
```

上面的这种写法在传统的 web 开发中真是不敢想象，然而在 react 中的确实现了。如果你使用 `create-react-app` 这样的脚手架工具，你可以快速的搭建起来这样的体系。然而，即便是这样子，web 组件化依然有一个点没有解决：如何将样式和组件绑定在一起。当然，试图解决这个问题的工具有很多，也有很多人不认为这是一个问题。我在这里试图解释一些观点，并阐述为什么我觉得用 `styled-components` 可以在一定程度上解决一系列问题。

## 写 css 的最佳方式

目前，react 阵营对写 css 这个问题有两个阵营。一个阵营表示 css 应当和 js 写在一起，而另一个阵营则认为 css 原本是可以和 js 分离的。我们在这里做一个简单的例子。

首先是 css in js 的例子：

```javascript
const style = {
	margin: "1em 2em",
	color: "gray",
	background-color: "white"
};

const StyledDiv = (props) => {
	return <div style={style}>A test</div>
};
```

而 css 和 js 分离就很简单了：

```css

.styled-div {
	margin: 1em 2em;
	color: gray;
	background-color: white;	
}

```

```javascript
import "./StyledDiv.css";

const StyledDiv = (props) => {
	return <div className="styled-div">A test</div>
};
```

当然，这里展示的 css in js 只是一种非常原始的方式：用 object 直接将 style 注入到组件中。这样做的好处有两个：

1. css 不在是全局的了，style 的生命周期与生命范围终于和 component 一致了，那么因为全局变量导致的可怕的为何灾难缓解了
2. 在组件内对样式的操纵可以直接进行，无需通过 className 处理，当然也避免了创建全局的 className 了

可以看到，这里基本上就是以解决 css 的全局性为出发点的。

而 css 和 js 的分离当然也有其天然的优势：

1. 可以用 css 的方式写 css，css 选择器随便用
2. 我还可以加各种 preprocessor 和 post processor，比如写 scss 比如加 auto-prefix

对我来说，用 object 的方式去写 css 体验实在是太差了。而且作为 `css` 的 `cascade`，如果不能用多级的选择器去定位 css 而是在一层层的 html 元素中添加样式简直就是噩梦。我不觉得这样的可维护水平比全局 css 要高...所以我觉得如果能把两者的优势结合在一起，就应该是一个可以被更多人介绍的方式：

1. 用 css 的语法写 css
2. 能创建局部 className
3. 支持 preprocessor 和 postprocessor

那么在这里就不得不提另外一个有意思的东西：[css-modules](https://github.com/css-modules/css-modules)。它的主要思想是通过为 css 生成随机的类名称的方式来建立一种局部类命名的方式。

[`styled-components`](https://www.styled-components.com) 基本上集成了这个工作，并在此基础上基本实现了以上的三点要求。

```javascript
const Summary = styled.div`
  margin-top: 2em;
  text-align: right;

  .price {
    color: #ff0036;
    font-size: 1.2em;
  }

  &> * {
    display: inline-block;
    margin-left: 1em;
  }
`;
```

1. `Summary` 的 css 是以 css 的方式编写的，支持多层次的定义
2. `styled-components` 会把上面定义的 css 以一个特别的 className 的方式注入到元素上，实现了局部类定义
3. `styled-components` 支持了基本的类似于 scss 的嵌套语法（还支持 extend 语法，这里并没有展示），并且内嵌了 `autoprefix` 的模块

我最近开始在一个项目上使用它，整体来说还是感觉不错。

## 兼容现在已有的 react components 和 css 框架

`styled-components` 采用的 css-module 的模式有另外一个好处就是可以很好的与其他的主题库进行兼容。因为大部分的 css 框架或者 css 主题都是以 className 的方式进行样式处理的，额外的 className 和主题的 className 并不会有太大的冲突。你可以认为这是一个应当使用全局 css 的地方（所以我并不赞成用 styled-components 里面的 theming 接口去做这件事）。相对于以 object 的方式写 style 的 material-ui 真是好太多了，看看 material-ui 讲述如何进行[样式自定义](https://www.material-ui.com/#/customization/styles)就知道这并不是一个很成熟的想：

1. css 内嵌到组建里影响了组件自身结构的表现
2. inline style 意味着最高的优先级，其无法和其他的主题库配合

`styled-components` 的语法同样支持对一个 React 组件进行扩展：

```javascript
const StyledDiv = styled(Row)`
  position: relative;
  height: 100%;
  .image img {
    width: 100%;
  }
  .content {
    min-height: 30em;
    overflow: auto;
  }
  .content h2 {
    font-size: 1.8em;
    color: black;
    margin-bottom: 1em;
  }
`;
```

这里我把 [ant design](https://ant.design) 做为我默认的样式库，在其基础上我对其一些元素做了增强。两者可以很好的在一起使用。

这里符一个 [github 项目](https://github.com/aisensiy/pet-store-front-end) 里面包含了很多使用 `styled-components` 的例子。

## 相关资料

1. [scss](https://sass-lang.com/)
2. [js in css](https://github.com/MicheleBertoli/css-in-js)
3. [styled components](https://www.styled-components.com)
4. [auto-prefix](https://github.com/postcss/autoprefixer)
5. [material-ui](https://www.material-ui.com/)