---
layout:     post
title:      " 在 react 项目中引入全局变量"
date:       2017-12-21 19:03:00 +08:00
author:     "Eisen"
tags:       [react, javascript]
---

虽然全局变量是一个不好的实践，但是很多时候处于方便性的考虑，还是在某些场景需要使用。这里就讲解一下在 react + webpack 场景下如何不提前引入就可以到处使用的全局变量的一个好的方案。

## 方法一：浏览器全局变量

首先，其实对于前端应用原本是跑在浏览器里的，我们自然会想到用 `window.global_var` 的方式去定义全局变量。但是这种方式有一个问题：如果我们有自己的一些组件展示视图（比如 storybook）以及一些组件测试的话，仅仅在 `index.js` 定义的这种全局变量需要在每一个展示体系下都去定义，而这些体系可未必有 `window`。

## 方法二：webpack ProvidePlugin

第二种方法是采用 webpack 的 `ProvidePlugin` 让 webpack 打包时自动发现关键的全局变量并自动的引入。它是一种隐性的全局变量。代码如下所示：

```js

module.exports = {
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      Config: path.resolve(__dirname, '../src/utils/Config')
    }
  },
  plugins: [
    new ExtractTextPlugin("styles.css"),
    new webpack.ProvidePlugin({
      Config: "Config"
    }),
  ],
  module: {
  }
};
```

1. 首先通过 `resolve.alias` 为一个引入定义一个 shortcut。
2. 然后在 `plugins` 中通过 `webpack.ProvidePlugin` 定义相应的变量即可

*注意*，这里 `resolve.alias` 引入不支持 `export default` 的语法，只支持 `export`  以及 `module.exports` 的写法。

## 相关资料

1. [解析(Resolve)](https://doc.webpack-china.org/configuration/resolve/#resolve)
2. [ProvidePlugin](https://doc.webpack-china.org/plugins/provide-plugin/#src/components/Sidebar/Sidebar.jsx)

