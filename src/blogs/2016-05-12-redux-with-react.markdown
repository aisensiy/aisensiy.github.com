---
layout:     post
title:      "Redux with react"
date:       2016-05-12
author:     "Eisen"
tags:       [webpack, js, flux, redux, react]
---

沿着上一部分 [Get Started Redux](/redux-get-started)，在利用 `redux` 构建了 `store` `reducer` 之后，现在需要给应用提供个 `view` 了。我们用当下最流行的 `react`。

## prepare package for react with redux

安装 `react`

    $ npm install --save react react-dom react-redux
    
其中 `react` `react-dom` 是 `react` 的原生包，`react-redux` 提供了一些方便的方法用来将 `redux` 和 `react` 一起使用。后面的代码示例会着重讲解。

添加 `babel` 对 `jsx` 的支持。

`jsx` 是 `react` 支持的一种特殊的语法，这种语法用于将 `html` 写到 `js` 中，例如

```js
return (
    <p>
      Click {value} times.
      { ' ' }
      <button onClick={onIncrement}>+</button>
      { ' ' }
      <button onClick={onDecrement}>-</button>
    </p>
)
```

目前可以认为 `jsx` 是写 `react` 的标配，那么就需要在 `babel` 中添加一个新的 `react` 翻译器。

    $ npm install --save-dev babel-preset-react
    
然后修改 `.babelrc`

```json
{
  "presets": ["es2015", "react"]
}
```

这样，我们就可以开始写 `react` 了。

## Presentational and Container Components

在 `redux` 的官方文档 [Use With React](https://redux.js.org/docs/basics/UsageWithReact.html) 解释了一种 `redux` 和 `react` 结合的模式：将 `react` 的组件分为两种，一种是不与 `redux` 交互的 `presentational` 组件，它是一种通用的组件，任何提供给它所需要的 `func` 或者是 `prop` 的框架都可以使用它。另一种是 `container` 组件，是和 `redux` 的 `action` 以及 `store` 绑定的组件。通常都是会先写一个 `presentational` 组件，然后再创建一个 `container` 组件对 `presentational` 组件进行包装后使用。后面的 *full example* 展示了 `Counter` 与 `Visible Counter` 两个不同类型的组件。当然在[官方](https://redux.js.org/docs/basics/UsageWithReact.html)也提供了非常好的例子。

## full example

首先展示一下目录结构

```
.
├── actions
│   └── index.js
├── components
│   ├── App.js
│   └── Counter.js
├── containers
│   └── VisibleCounter.js
├── dist
│   ├── bundle.js
│   ├── index.html
│   └── styles.css
├── entry.js
├── package.json
├── reducers
│   └── counter.js
├── styles
│   ├── index.scss
│   └── theme.scss
├── test
│   └── reducers
│       └── counter.spec.js
└── webpack.config.js
```

相对于之前的目录结构多了两个目录 `containers` `components` 分别对应了 `container` 和 `presentational` 的组件。

首先我们定义一个 `presentational` 的组件 `Counter`

`components/Counter.js`:

```js
import React, { Component, PropTypes } from 'react';

class Counter extends Component {
  render() {
    const { value, onIncrement, onDecrement } = this.props;

    return (
        <p>
          Click {value} times.
          { ' ' }
          <button onClick={onIncrement}>+</button>
          { ' ' }
          <button onClick={onDecrement}>-</button>
        </p>
    )
  }
}

Counter.PropTypes = {
  value: PropTypes.number.isRequired,
  onIncrement: PropTypes.func.isRequired,
  onDecrement: PropTypes.func.isRequired
};

export default Counter;
```

注意 `PropTypes` 有点像是一个函数的参数说明，它明确的定义了在使用这个组件时需要提供什么样子的东西，`react` 官方建议一定要对每一个组件都明确的定义这样的参数说明，它也起到了文档的作用，方便与其他人协作。这里我们需要三个东西：

1. `value` 当前的计数
2. `onIncrement` 当点击 `+` 时的动作
3. `onDecrement` 当点击 `-` 时的动作

然后对 `Counter` 进行包装

`containers/VisibleCounter.js`:

```js
import { connect } from 'react-redux';
import Counter from "../components/Counter";
import { increment, decrement } from '../actions/index';

function mapStatToProps(state) {
  return {
    value: state
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onIncrement: () => {
      dispatch(increment())
    },
    onDecrement: () => {
      dispatch(decrement())
    }
  }
}

const VisibleCounter = connect(
    mapStatToProps,
    mapDispatchToProps
)(Counter);

export default VisibleCounter;
```

这里用到了一个 `react-redux` 提供的方法 `connect` 它和下文提到的 `Provider` 配合使用，用于为 `react` 传递全局的 `store`。`connect` 需要两个函数 `mapStatToProps` 与 `mapDispatchToProps` 分别将 `store` 里的属性和 `store` 的 `dispatch` 动作传递给 `presentational` 组件。上面的代码就分别将 `store` 的 `state` 对应给组件的 `value` 属性，将两个 `action` 的 `dispatch` 对应到 `onIncrement` 与 `onDecrement`。

然后还有一个 `App` 组件，用于包装 `VisibleCounter`，它没有任何依赖的属性。

`components/App.js`:

```
import React, { Component } from 'react';
import VisibleCounter from '../containers/VisibleCounter';

class App extends Component {
  render() {
    return (
        <div>
          <VisibleCounter />
        </div>
    )
  }
}

export default App;
```

最后我们修改 `entry.js` 将 `store` 与我们的视图绑定起来。

`entry.js`:

```
require('./styles/index.scss');

import React from "react";
import ReactDOM from 'react-dom';
import counter from './reducers/counter';
import { Provider } from 'react-redux';
import App from './components/App';
import { createStore } from 'redux';

const store = createStore(counter);
const rootEl = document.querySelector("#root");

function render() {
  ReactDOM.render(
      <Provider store={store}>
        <App />
      </Provider>,
      rootEl
  )
}

render();
store.subscribe(render);
```

这里就用到了 `Provider` 方法，将 `store` 传递给 `App`，然后用 `ReactDOM` 在页面上生成 `react` 组件。

## 参考

1. [redux](https://redux.js.org)
2. [redux counter example](https://github.com/reactjs/redux/tree/master/examples/counter)
3. [use with react](https://redux.js.org/docs/basics/UsageWithReact.html)
4. [babelrc](https://babeljs.io/docs/usage/babelrc/)

