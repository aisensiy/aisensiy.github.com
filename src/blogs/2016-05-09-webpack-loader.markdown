---
layout:     post
title:      "Webpack Loader"
date:       2016-05-09
author:     "Eisen"
tags:       [webpack, js]
---

## loader 是做什么的

> Loaders allow you to preprocess files as you require() or “load” them. Loaders are kind of like “tasks” are in other build tools, and provide a powerful way to handle frontend build steps. Loaders can transform files from a different language like, CoffeeScript to JavaScript, or inline images as data URLs. Loaders even allow you to do things like require() css files right in your JavaScript!

`webpack` 本身并不能处理乱起八糟的语言，什么 `css` `scss` `es6` `jsx` 都不可以。`loader` 就是一个额外的 `preprocessor` 用于将其他语言翻译成 `js` 然后再让 `webpack` 去打包处理。那么目前我们需要处理的*其他语言*主要就是 `scss` `es6` `jsx` 这几个。

## 在 webpack 的项目中使用 babel

`babel` 是目前比较主流的 `es6` to `js` 的编译器，通过简单的包装就有了在 `webpack` 中将 `es6` 转换成 `js` 的 `babel-loader`。`babel` 目前支持 `es2015` (ECMAScript 2015 is the newest version of the ECMAScript standard)，采用 `webpack` + `babel` 的模式，我们就可以直接写 `es2015` 的 js 脚本。

## 一个例子

首先自然是安装 `babel-loader` 了。

    npm install --save-dev babel-loader babel-core

需要说明的是 `babel 6.x` 将其可以翻译的语言做了拆分，目前还没有支持默认的翻译器，需要我们在 `package.json` 中显示的安装所需要的翻译器。

    npm install babel-preset-es2015 --save-dev

这里就是显示的说明我需要 `es2015` 的翻译器，**不过这个情况貌似在以后的版本会做调整**。

然后需要在 `webpack.config.js` 提供一个 `loader` 的声明，说明什么样子的文件需要使用 `babel-loader` 这个 `loader` 做处理。

```
var path = require("path");

module.exports = {
  entry: [
    './entry'
  ],
  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
};
```

可以看到在 `webpack.config.js` 中多了一个 `module.loaders`，通过 `test` 匹配末尾为 `.js` 的文件，并且忽略 `node_modules` 文件夹下的所有文件。当然，我们也可以加上 `include` 强调只处理某个文件夹下的文件。然后 `query` 这部分是 `babel-loader` 所需要的一个声明，指定需要什么具体的翻译器对这些文件做处理。在 `babel` 官方文档 <https://babeljs.io/docs/setup/#installation> 中有另外一种申明翻译器的方法：将 `query` 写在一个单独的 `.babelrc` 文件下，我个人觉得这样让配置过于分散了，还是采用了直接在 `webpack.config.js` 声明的办法。

然后，我们将上一部分的 `module1` `module2` 用 `es2015` 的语法方式写出来。

module1.js:

```
export default () => {
  console.log("module1");
}
```

module2.js:

```
export default () => {
  console.log("module2");
}
```

entry.js:

```
import m1 from './module1'
import m2 from './module2'

m1();
m2();
```

## 参考

1. [Using babel](https://babeljs.io/docs/setup/#installation)
2. [Webpack loaders](https://webpack.github.io/docs/loaders.html)
