---
layout:     post
title:      "Webpack and Redux, minify the output bundle"
date:       2016-05-29
author:     "Eisen"
tags:       [webpack, redux]
---

webpack + redux + react 开发前端最终会将所有的 js 依赖打包成为一个（或者几个，因配置不同而不同）js 文件。虽然 `webpack` 很好的帮助我们解决了依赖的问题，避免了一大堆分散的 js 文件出现在页面里，但是最终打包出来的 js 文件依然会变成所有依赖的 js 的 size 的总和，成为前端页面响应速度的巨大负担。不过通过一些调优可以最大化的减少最终的打包文件的大小并提升运行性能。

## `dev` & `production` env

首先，我们可以通过设定不同的 `NODE_ENV` 环境变量去控制在不同的环境下引入的配置。通过在 `webpack.config.js` 中读取 `process.env.NODE_ENV` 可以为 `webpack` 提供不同的 `plugin` 用于控制 `webpack` 的打包机制。下面是一个例子：

```javascript
var plugins = process.env.NODE_ENV === 'production' ? [
  new webpack.DefinePlugin({
    API_PREFIX: JSON.stringify(process.env.API_PREFIX) || '"{{API_PREFIX}}"',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }),
  new webpack.optimize.DedupePlugin(),
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    }
  })
] : [
  new webpack.DefinePlugin({
    API_PREFIX: JSON.stringify(process.env.API_PREFIX) || '"{{API_PREFIX}}"',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  })
];
```
其中 `DefinePlugin` 可以为 `webpack` 提供全局变量，这里我们利用它将 `node` 中的 `process.env.NODE_ENV` 转换为 `webpack` 构建最终的 `js` 时用到的全局变量。如果直接在 `webpack` 构建时处理的 `js` 文件中直接引用 `nodejs` 才能读取的 `process.env` 是不会有任何效果的。

然后，我们通过这个 `process.env.NODE_ENV` 的不同加载不同的 `configureStore.js`，将在 `production` 环境下用不到的 `redux` 中间件清理掉。

```javascript
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./configureStore.prod')
} else {
  module.exports = require('./configureStore.dev')
}
```

`configureStore.prod.js`:

```js
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import rootReducer from '../reducers/index'

export default function configureStore(initialState) {
  const store = createStore(rootReducer, initialState, applyMiddleware(thunk));
  return store;
}
```

`configureStore.dev.js`:

```javascript
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import createLogger from 'redux-logger';
import rootReducer from '../reducers/index'

export default function configureStore(initialState) {
  const store = createStore(rootReducer, initialState, applyMiddleware(thunk, createLogger()));
  return store;
}
```

## 利用 `webpack` 插件压缩输出文件

在各种前端构建工具中都受不了 `uglify` 的过程，`webpack` 也不例外。在上文 `webpack.config.js` 的例子中对 `production` 环境下的 `webpack` 就提供了各种插件用于压缩文件。

```js
new webpack.optimize.UglifyJsPlugin({
  compress: {
    warnings: false
  }
})
```

## 采用 `webpack-bundle-size-analyzer` 分析依赖大小

如果以上两种优化都做了（尤其是 uglify）那么恭喜你，你的 js 输出文件已经是处理前的三分之一了。我在自己的一个项目中最终的 `bundle.js` 文件从 `2.2MB` 降到了 `800KB` 效果还是非常好的。

但是 `800KB` 还是好大的一个文件，如果还想继续优化呢？那就需要有针对性的进行优化了。我们在开发的过场中依赖了乱七八糟的 `package` 那么是不是能通过减少依赖或者是更换依赖的方式来进一步的减少最终输出文件的大小呢？那么，首先需要知道每个依赖占据的比例了。这里我们采用一个工具 `webpack-bundle-size-analyzer` 分析所有依赖的大小。

```sh
npm install -g webpack-bundle-size-analyzer
```

然后 

```sh
webpack --json | webpack-bundle-size-analyzer
```

就可以看到所有依赖的大小占比了：

```
react: 667.34 KB (28.9%)
  fbjs: 33.59 KB (5.03%)
  <self>: 633.74 KB (95.0%)
moment: 454.54 KB (19.7%)
bootstrap: 273.93 KB (11.9%)
jquery: 251.51 KB (10.9%)
react-router: 159.31 KB (6.91%)
  history: 52.69 KB (33.1%)
    deep-equal: 3.8 KB (7.22%)
    query-string: 1.62 KB (3.08%)
      strict-uri-encode: 182 B (10.9%)
      <self>: 1.45 KB (89.1%)
    <self>: 47.26 KB (89.7%)
  warning: 1.76 KB (1.11%)
  invariant: 1.48 KB (0.929%)
  hoist-non-react-statics: 1.35 KB (0.850%)
  <self>: 102.03 KB (64.0%)
formsy-react-components: 36.24 KB (1.57%)
  classnames: 2.58 KB (7.11%)
  <self>: 33.66 KB (92.9%)
superagent: 30.57 KB (1.32%)
  component-emitter: 3.11 KB (10.2%)
  reduce-component: 405 B (1.29%)
  <self>: 27.06 KB (88.5%)
formsy-react: 30.55 KB (1.32%)
  form-data-to-object: 1.19 KB (3.91%)
  <self>: 29.36 KB (96.1%)
axios: 29.18 KB (1.26%)
redux: 25.8 KB (1.12%)
  lodash: 3.34 KB (12.9%)
  symbol-observable: 451 B (1.71%)
  <self>: 22.02 KB (85.4%)
react-redux: 25.54 KB (1.11%)
  lodash: 3.34 KB (13.1%)
  invariant: 1.48 KB (5.80%)
  hoist-non-react-statics: 1.35 KB (5.30%)
  <self>: 19.37 KB (75.8%)
redux-logger: 8.29 KB (0.359%)
style-loader: 6.99 KB (0.303%)
webpack: 3 KB (0.130%)
  node-libs-browser: 2.76 KB (91.8%)
    process: 2.76 KB (100%)
    <self>: 0 B (0.00%)
  <self>: 251 B (8.17%)
object-assign: 1.95 KB (0.0844%)
css-loader: 1.47 KB (0.0638%)
redux-thunk: 306 B (0.0130%)
superagent-prefix: 198 B (0.00838%)
react-dom: 63 B (0.00267%)
<self>: 300.1 KB (13.0%)
```

这里在优化前的输出情况，其中 `react` 最大，占整个输出的 `28.9%`，未压缩前 `bundle.js` 为 `2.24MB`。`react` 是我们的核心依赖，是没什么办法做优化了，但是占比第二高的 `moment` 仅仅是一个用于日期格式化的工具，占比如此之高实在是可疑。通过搜索其他的可选方案，我将 `moment` 替换为 `date-fns`，bundle 文件减小为 `1.7MB` 压缩后文件减小为 `558KB`。

## 最后的最后

如果你真的还觉得太大了...那，就只有靠 nginx 那边做 `gzip` 优化了...

```
gzip  on;
gzip_types      text/plain application/xml text/css text/html application/javascript;
```

## 参考

1. [webpack optimization](https://webpack.github.io/docs/optimization.html)
2. [Optimizing React + ES6 + Webpack Production Build](https://moduscreate.com/optimizing-react-es6-webpack-production-build/)
3. [date-format-without-moment](https://stackoverflow.com/questions/17093796/date-formatting-with-without-moment-js)
4. [passing-environment-dependent-variables-in-webpack](https://stackoverflow.com/questions/30030031/passing-environment-dependent-variables-in-webpack)
5. [nginx gzip](https://nginx.org/en/docs/http/ngx_http_gzip_module.html)


