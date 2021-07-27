---
layout:     post
title:      "Webpack Scss Loader"
date:       2016-05-09
author:     "Eisen"
tags:       [webpack, js, css, scss]
---

## Add css in webpack

前面介绍了 `webpack` 的 `loader` 也提及了它是用来将各种语言转换成 js 的翻译器。但是有一个特殊的情况，就是有一个 `style-loader` 和 `css-loader`，他们并不是 `js` 但是最终可以以 `text` 的形式放到我们打包的那个文件 `bundle.js` 中去，并且这里是将两个 `loader` 一起使用，有点像是 `filter & pipeline` 的模式。虽然这里的 `style-loader` 并不知道为什么要单独分出来，听起来好像是 `html` 的 style 还可以有除了 `css` 之外的东西，不明觉厉。

    css file  | css-loader | style-loader > bundle.js

当然，我们现在都不怎么写纯粹的 `css` 了，都是采用 `less` 或者是 `sass` 写了之后再翻译成 `css`，`webpack` 也支持 `sass-loader` 这样的东西，最终的流程是这样子的：

    sass file | sass-loader | css-loader | style-loader > bundle.js

## 一个例子

首先安装 `sass-loader` 以及其所依赖的 `sass` to `css` 的翻译器 `node-sass`

    $ npm install --save-dev sass-loader node-sass

然后安装 `style-loader` 以及 `css-loader`

    $ npm install --save-dev style-loader css-loader

和配置 `es2015` 类似，在 `webpack.config.js` 中添加 `loader`

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
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        loader: "style!css!sass"
      }
    ]
  }
};
```

这里的 `loader` 是一个 `pipeline` 的感觉，和 `es2015` 的有些不一样。多个 `loader` 以 `!` 分隔，并且顺序是倒序的。

然后我们添加一个 `styles` 的目录，并且添加两个 `scss` 文件

```
.
├── dist
│   ├── bundle.js
│   └── index.html
├── entry.js
├── module1.js
├── module2.js
├── package.json
├── styles
│   ├── index.scss
│   └── theme.scss
└── webpack.config.js
```

`index.scss`:

```
@import './theme.scss';
```

`theme.scss`:

```
body {
  background-color: yellow;
}
```

这里只用了一个 `@import` 的 `scss` 语法，不过这样也应该足够验证 `scss` 了。

最后，在 `entry.js` 中添加对 `index.scss` 的引用。

```
import m1 from './module1'
import m2 from './module2'

require('./styles/index.scss')

m1();
m2();
```

对的，不要怀疑，就是在 `js` 里面引入了 `scss`，`npm start` 一下，看看是不是 `body` 的背景色变了。

## 拆分 css 和 js

不过 `css` 和 `js` 放在一起总觉得怪怪的，可不可以拆分出来？当然可以了，这里需要一个额外的 `webpack` 插件。`plugin` 有点像是 `webpack` 的 `postprocessor` 是在 `webpack` 打包之后进行进一步处理的工具。这里我们用到了 [extract-text-webpack-plugin](https://github.com/webpack/extract-text-webpack-plugin) 把 `css` 拆分出来放到一个单独的文件中。

首先安装

    npm install --save-dev extract-text-webpack-plugin

然后修改 `webpack.config.js` 注册这个插件

```
var path = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

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
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader", "sass-loader")
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin("styles.css")
  ]
};
```

注意，我们的 `loader` 这部分也会采用 `ExtractTextPlugin` 进行重写

    loader: ExtractTextPlugin.extract("style-loader", "css-loader", "sass-loader")

然后 `plugin` 这部分说明我们最终要将 `css` 文件保存为 `styles.css`，这里要说明的是 `styles.css` 文件是要遵循 `webpack.config.js` 文件中的 `output` 路径的，也就是说它会保存到 `dist/styles.css`。我们修改一下 `index.html`，引入这个文件

```
<html>
<head>
  <meta charset="UTF-8">
  <title>Document</title>
  <link rel="stylesheet" href="styles.css" type="text/css" media="screen" title="no title" charset="utf-8">
</head>
<body>
  <script type="text/javascript" src="bundle.js"></script>
</body>
</html>
```

执行 `webpack` 看看是不是在 `dist` 下多了一个 `styles.css`。

## 参考

1. [webpack get started](https://webpack.github.io/docs/tutorials/getting-started/)
2. [webpack loader order](https://webpack.github.io/docs/loaders.html#loader-order)
3. [webpack plugins](https://github.com/webpack/docs/wiki/list-of-plugins)
4. [extract-text-webpack-plugin](https://github.com/webpack/extract-text-webpack-plugin)
