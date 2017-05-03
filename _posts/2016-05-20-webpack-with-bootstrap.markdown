---
layout:     post
title:      "Webpack with Bootstrap"
date:       2016-05-20
author:     "Eisen"
tags:       [webpack, bootstrap]
---

最近开始利用业余时间采用 `react + redux` 的前端架构山寨一个金数据（或者说是 WuFoo，毕竟两个东西看起来真的很像）以增加自己对这些框架的熟练度。在这个过程中记录下一些自己遇到的坑。今天就是一个 `webpack` 如何和 `bootstrap` 结合的坑。

为了在项目之初就一个不是那么丑的界面，都会选择一些比较成熟的前端 css 框架。`bootstrap` 是比较流行的一个。`bootstrap` 一方面是基本的 `css` 另一方面还有一些 `jQuery` 的插件形式的类库支持其中的一些组件，当然还有一些它所需要的字体文件。那么这里问题就来了：

1. 如何在 `webpack` 中引入 `jQuery` 以及它的插件
2. 如何在 `webpack` 引入一些其他类型的文件，例如字体

## 引入 bootstrap

首先，我们还是要安装 `bootstrap` 以及它所依赖的 `jquery`。

    npm install --save bootstrap-sass jquery

这里顺便说一句，虽然 `jquery` 看似过时了，但是它所构建的生态是非常庞大的，尤其是像 `jquery-ui` 这样的东西可以说是一些富交互应用所必须的。那么如何将 `react` 的 `component` 和 `jquery` 的一些组件很好的结合是在选择 `react` 这样的框架之初就考虑进去的。后面在涉及到一些复杂的交互的时候会出现 `jquery-ui` 与 `react` 一起使用的例子。

然后，我们可以在 `webpack.config.js` 中以 entry 的形式引入 `bootstrap-loader`

```
var path = require("path");

module.exports = {
  devtool: 'cheap-module-source-map',
  entry: [
    'bootstrap-loader',
    './index.js'
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
        loader: "babel-loader"
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

注意看 `entry` 本来就是一个数组，我们可以在这里引入多个入口。

## Use bootstrap-loader

做了一番调研之后发现其实没必要自己把所有的事情都做了，有这么一个 `bootstrap-loader` 可以帮助在 `webpack` 的项目中引入 `bootstrap`。

    npm install --save-dev bootstrap-loader
    
不过单单是安装它是不过的，其实 `bootstrap-loader` 所做的事情就是帮助我们把各种样子的文件引入到我们的项目中，那么为了处理不同类型的文件需要一些其他的 `loader` 的支持（前面的博客有提及 `webpack` 只能处理 `js` 如果需要处理其他类型的东西就需要 `loader` 的帮助）。这里，我们还要引入一大堆的 `loader`。

    npm install --save-dev resolve-url-loader url-loader file-loader imports-loader
    
其中 `file-loader` 用于加载其他类型的文件，`url-loader` 和 `file-loader` 类似，只是在文件比较小的时候返回 Data Url 的形式。`resolve-url-loader` 和之前提到的 `sass-loader` 一起使用，用于处理 `sass` 中 `url()` 的路径。这些 `loader` 都要和 `webpack.config.js` 中的 `loaders` 配置项配合使用:

```
var path = require("path");

module.exports = {
  ...
  module: {
    loaders: [
      ...
      {
        test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "url?limit=10000"
      },
      {
        test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/,
        loader: 'file'
      }
    ]
  }
};
```

## Use imports-loader to support jQuery

`imports-loader` 是个很有意思的 `loader` 它定义了一个简单的格式用于引入使用它的类库所需要的依赖。

```
module.exports = {
  ...
  module: {
    loaders: [
      ...
      {
        test: /bootstrap-sass\/assets\/javascripts\//,
        loader: 'imports?jQuery=jquery'
      }
    ]
  }
};
```

如上所示，在 `webpack.config.js` 中加入这样一个 `loader`。其中说明在引入 `bootstrap` 下的 `javascripts` 时，为他们提供 `jQuery` 这样的变量。那么 `imports-loader` 会在引入 `bootstrap` 的 `js` 之前为他们提供如下的代码:

      var jQuery = require('jquery');

估计在后续使用 `jquery` 的其他东西的时候还会用到它的。

## 参考

1. [bootstrap-loader](https://github.com/shakacode/bootstrap-loader)
2. [imports-loader](https://github.com/webpack/imports-loader)
3. [file-loader](https://github.com/webpack/file-loader)
4. [url-loader](https://github.com/webpack/url-loader)
5. [resolve-url-loader](https://github.com/bholloway/resolve-url-loader)





