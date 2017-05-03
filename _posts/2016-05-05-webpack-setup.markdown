---
layout:     post
title:      "Webpack Setup"
date:       2016-05-05
author:     "Eisen"
tags:       [webpack, js]
---

虽然用 `webpack` 有一阵子了，但是上次构建整个体系的时候手忙脚乱的，仅仅是找了乱七八糟的东西堆叠起来，中间的过程忘的一干二净今天去 review 自己以前写的代码完全不知道自己是怎么搞定的。这次写一个小系列把如何构建 `webpack` + `redux` + `react` 的体系记下来，今天是第一部分，`webpack` 的准备工作。

`webpack` 可以认为就是一个 `node` 版本的 `make` 吧，不过自然是有 `js` 特色的 `make` 了，类似的东西有很多，比如 `browserify` 以及 `gulp` 等。`webpack` 最终的目的就是将我们一个有众多文件的 `js` 的 project 变成只有一个或者多个文件的 `bundles`，我在后面会结合例子做展示。并且`webpack` 可以支持 `loader` 将各种诡异的 `js` 方言转换成 `js` 比如当下比较流行的额 `babel` `jsx` 等，所以 `webpack` 配合 `es2015` 以及 `react` 一起使用非常的方便。不过要说明的是对这些方言的支持是 `loader` 的事情，`webpack` 本身是只能处理原生态的 `js` 的。

## basic

首先自然是安装 `webpack`

```
npm install -g webpack
npm install -S webpack
```

然后我展示一个 `webpack` 的基本用法。首先看一下我们的目录结构：

```
├── index.html
├── index.js
├── module1.js
├── module2.js
└── package.json
```

其中 `index.html` 基本就是一个空文件

```
<html>
  <head>
    <meta charset="utf-8">
    <title>index</title>
  </head>
  <body>
    <script src="bundle.js"></script>
  </body>
</html>
```

`module1.js` `module2.js` 展示如下

```
console.log('module 1');
```

```
console.log("module 2");
```

`index.js` 通过 `require` 的方式引用两个模块

```
require("./module1");
require("./module2");
```

然后通过命令 `webpack ./index.js bundle.js` 可以将 `index.js` 以及其所依赖的模块打包生成一个文件 `bundle.js` 这样在浏览器打开 `index.html` 就可以看到 `console` 中的命令了。

## use webpack.config.js

在上述这么简单的情况下我们就仅仅用 `webpack` 的命令就可以了。不过在处理更复杂的事情的时候需要 `webpack.config.js` 来帮忙。这里我给出一个最小化的 `webpack.config.js` 的实例来替代刚才的命令。

```
var path = require("path");

module.exports = {
  entry: [
    './index'
  ],
  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js"
  }
};
```

其中，`entry` 就是我们整个 `project` 的 `main`。就如在前文中 `webpack ./index.js bundle.js` 的 `./index.js` 的角色。`output` 则表示我们要将生成的 `js` 放在哪里。这里我提供了一个不同的 `path`: `dist`，然后依然采用 `bundle.js` 的名字。这样我们执行 `webpack` 就可以看到 `dist` 下出现了 `bundle.js` 这个文件。


## use webpack dev server

那么每次改了文件之后都 `webpack` 是不是很麻烦，应该是有 `watch` 的办法吧。对的，这就是 `webpack-dev-server` 了。首先安装它。

```
npm install -g webpack-dev-server
npm install -S webpack-dev-server
```

	执行 `webpack-dev-server --inline --hot --content-base dist/`，每次修改代码就可以自动 build 了。

既然这里我们把 `content-base` 设定为了 `dist` 那么需要把 `index.html` 放进去啦。最后的目录结构是这样子的：

```
├── dist
│   ├── bundle.js
│   └── index.html
├── index.js
├── module1.js
├── module2.js
├── package.json
└── webpack.config.js
```

值得一提是在 `package.json` 里有一个专门放置这种启动 server 的地方，就是在 `scripts` 下:

```
{
  "name": "webpack-setup",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "MIT",
  "dependencies": {
    "webpack": "^1.13.0"
  }
}
```

然后下次执行 `npm start` 就可以启动这个 dev server 啦。

## 一些参考

1. webpack.config.js [http://webpack.github.io/docs/configuration.html](http://webpack.github.io/docs/configuration.html)
2. webpack dev server [http://webpack.github.io/docs/webpack-dev-server.html](http://webpack.github.io/docs/webpack-dev-server.html)
