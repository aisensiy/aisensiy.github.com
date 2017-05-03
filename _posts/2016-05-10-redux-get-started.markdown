---
layout:     post
title:      "Redux get started"
date:       2016-05-10
author:     "Eisen"
tags:       [webpack, js, flux, redux]
---

## what is redux

`redux` 是一个目前比较流行的前端框架，它和 `react` 配合使用，作为 `react` 的 数据层。它继承了 `flux` 的思想，构建一个 `store` 保存前端所有的 `state`，但是目前这样的模式也逐渐出现了一些争议，尤其是当一个项目变得比较庞大的时候，在一个 `store` 里面存储单个页面相关的数据并没有非常大的意义，这部分我以后再说。

`redux` 的几个关键概念 `action` `reducer` `store` 在 <http://redux.js.org> 都有详细的介绍，尤其是在官网推荐的教学视频介绍了 `reduex` 的一些实现细节，对理解 `redux` 是如何工作的有很大的帮助，强烈推荐观看

## a simple redux example

首先安装 `redux`

    $ npm install --save redux

然后我们构建一个简单的目录结构

```
.
├── actions
├── dist
│   ├── bundle.js
│   ├── index.html
│   └── styles.css
├── entry.js
├── package.json
├── reducers
├── styles
│   ├── index.scss
│   └── theme.scss
└── webpack.config.js
```

两个新的文件夹 `actions` 和 `reducers` 分别用于存放 `action` 和 `reducer`。然后我们实现一下 `redux` 官网没有视图的 `counter` 的例子，具体代码如下，其中 `actions` 用于定义应用所支持的动作，有点像是 `request`，然后 `reducer` 定义依据动作的处理，有点像是 `controller` 中对应的一个个的方法。

`actions/index.js`:

```
export const increment = () => {
  return {
    type: "INCREMENT"
  }
}

export const decrement = () => {
  return {
    type: "DECREMENT"
  }
}
```

`reducers/counter.js`:

```
export default (state=0, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
      break;
    case 'DECREMENT':
      return state - 1;
      break;
    default:
      return 0;
  }
}
```

`entry.js`:

```
require('./styles/index.scss');

import counter from './reducers/counter';
import { increment, decrement } from './actions/index';
import { createStore } from 'redux';

let store = createStore(counter);

console.log(store.getState());

let unsubscribe = store.subscribe(() => console.log(store.getState()));

store.dispatch(increment());
store.dispatch(increment());
store.dispatch(decrement());
store.dispatch(decrement());

unsubscribe();
```

## add test for reducer

前端越来越复杂，相应的测试也是必不可少的了。我们目前的应用比较简单，最复杂的就是 `reducers` 所以给 `reducers` 添加一些测试。我们这里使用 `mocha` 作为测试框架。`redux` 官网提供了如何写测试的[文档](http://redux.js.org/docs/recipes/WritingTests.html)

    $ npm install --save-dev mocha expect

其中 `expect` 是一个支持比较 fancy 的 `assert` 语法的库。

为了和 `babel` 一起使用需要另外一个东西 `babel-register`

    $ npm install --save-dev babel-register

添加一个 `test` 目录

    $ mkdir test

添加 `reducer` 的测试 `test/reducers/counter.spec.js`:

```
import expect from 'expect';
import counter from '../../reducers/counter';

describe('counter', () => {
  it('should get init state 0', () => {
    expect(counter(undefined, {})).toBe(0);
  });
  it('should increase state', () => {
    expect(counter(1, { type: 'INCREMENT' })).toBe(2);
  });
  it('should decrease state', () => {
    expect(counter(1, { type: 'DECREMENT' })).toBe(0);
  });
  it('should stay same with unknown action', () => {
    expect(counter(1, { type: 'NO_ACTION' })).toBe(1);
  });
});
```

是不是觉得全天下的 `spec` 都一样？

然后我们执行 `mocha --compilers js:babel-register --recursive` 跑测试。

是不是报错了？因为我们没有 `.babelrc` 文件。因为之前我觉得这是一个隐式声明，不如在 `webpack.config.js` 显式声明好。但是没办法，其他地方也要用，改回去好了。

`.babelrc`:

```
{
  "presets": ["es2015"]
}
```

`webpack.config.js`:

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
        loader: "babel-loader"
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

和 `npm start` 类似，我们可以写一个 `npm test` 把那一堆命令移过去。

`package.json`:

```
{
  "name": "test-redux",
  "version": "1.0.0",
  "description": "",
  "dependencies": {
    "redux": "^3.5.2",
    "webpack": "^1.13.0"
  },
  "devDependencies": {
    "babel-core": "^6.8.0",
    "babel-loader": "^6.2.4",
    "babel-preset-es2015": "^6.6.0",
    "css-loader": "^0.23.1",
    "expect": "^1.20.1",
    "extract-text-webpack-plugin": "^1.0.1",
    "mocha": "^2.4.5",
    "node-sass": "^3.7.0",
    "sass-loader": "^3.2.0",
    "style-loader": "^0.13.1",
    "webpack": "^1.13.0"
  },
  "scripts": {
    "start": "webpack-dev-server --inline --hot --content-base dist/",
    "test": "mocha --compilers js:babel-register --recursive"
  },
  "author": "",
  "license": "ISC"
}
```

现在再跑一下 `npm test` 就和刚才一样的结果。

## 参考

1. [redux](http://redux.js.org)
2. [redux counter example](https://github.com/reactjs/redux/tree/master/examples/counter)
3. [redux writing tests](http://redux.js.org/docs/recipes/WritingTests.html)
4. [babelrc](https://babeljs.io/docs/usage/babelrc/)

