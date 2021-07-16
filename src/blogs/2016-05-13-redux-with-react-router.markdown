---
layout:     post
title:      "Redux with react router"
date:       2016-05-12
author:     "Eisen"
tags:       [webpack, js, flux, redux, react, router]
---

沿着上一部分 [Redux With React](/redux-with-react)，在利用 `redux` 与 `react` 构建了单个视图的 WebApp，这部分介绍 `redux` 与 `react-router` 结合实现多个视图的 WebApp，代码也是在上一部分的基础上做修改。

## prepare package for react-router

`react-router` 提供了 `react` 的路由机制，除了这个库之外还有另外一个库 `react-router-redux` 用官方文档的话来说，首先 `redux` 可以和 `react-router` 两个一起使用就可以解决路由的问题，但是如果考虑到一些辅助的功能（例如和 Redux DevTool 等一起使用），就很有必要使用 `react-router-redux` 了。而且其实两者的结合非常的简单，我这里就先把它加上了。

    $ npm install --save react-router react-router-redux

## 更新代码支持 Router

在不改变之前单个 `VisibleCounter` 的视图的前提下引入 `router`。首先看一下代码的目录结构。

```
.
├── actions
│   └── index.js
├── components
│   ├── App.js
│   └── Counter.js
├── containers
│   └── VisibleCounter.js ++
├── dist
│   ├── bundle.js
│   ├── index.html
│   └── styles.css
├── entry.js ++
├── package.json
├── reducers
│   ├── counter.js
│   └── index.js ++
├── routes.js ++
├── styles
│   ├── index.scss
│   └── theme.scss
└── webpack.config.js
```

其中新添加或者是有修改的文件都用 `++` 做了标记，可以看到作为 components(presentational) 在引入其他的组件的时候并没有收到影响，而 containers 则会因为 `store` 的变化而变化。

为了支持 `router` 需要做这么几件事情：

1. 用 `react-router` 提供的 `Route` 标签声明路由结构
   这里就是一个路由 `/` 对应组件 `App`，而 `App` 里面包含一个 `VisibleCounter`
   
   `routes.js`:
   
   ```js
   import React from 'react';
	import { Route } from 'react-router';
	import App from './components/App';
	
	export default (
	    <Route path="/" component={App}></Route>
	)
   ```
2. 在原有的 `reducer` 中添加 `react-router-redux` 所提供的路由的 `reducer`，这里通过 `redux` 所提供的 `combineReducers` 实现。
 
   `reducers/index.js`:
   
   ```js
   import counter from './counter';
	import { routerReducer as routing } from 'react-router-redux';
	import { combineReducers } from 'redux';
	
	export default combineReducers({
	  counter,
	  routing
	});
   ```
   
   由于 `reducer` 做了调整，那么在 `VisibleCounter` 与 `store` 链接时也会有改变，在下面的代码中我用 `++` 标识修改的部分
   
   `containers/VisibleCounter.js`:
   
   ```js
   import { connect } from 'react-redux';
   import Counter from "../components/Counter";
   import { increment, decrement } from '../actions/index';
	
	function mapStatToProps(state) {
	  return {
	    value: state.counter //++
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
3. 修改入口，用 `react-router` 所提供的 `<Router>` 标签包装整个应用，并以属性的方式传递路由结构(`routes`)和所需要的浏览器历史(`history`)支持（`hash` 或者是 `browser`）

   `entry.js`:
   
   ```
	require('./styles/index.scss');

	import React from "react";
	import ReactDOM from 'react-dom';
	import { Provider } from 'react-redux';
	import { hashHistory, Router } from 'react-router';
	import { syncHistoryWithStore } from 'react-router-redux';
	import { createStore } from 'redux';
	
	import reducer from './reducers/index';
	import routes from './routes';
	
	const store = createStore(reducer);
	const history = syncHistoryWithStore(hashHistory, store);
	const rootEl = document.querySelector("#root");
	
	function render() {
	  ReactDOM.render(
	      <Provider store={store}>
	        <Router routes={routes} history={history}/>
	      </Provider>,
	      rootEl
	  )
	}
	
	render();
	store.subscribe(render);
   ```

## 添加一个新的视图

现在添加一个新的视图 `About`

`containers/About.js`:

```
import React, { Component, PropTypes } from 'react';

class About extends Component {
  render() {
    return (
        <p>
          This is about page.
        </p>
    )
  }
}

export default About;
```

拆分 `App` 和 `VisibleCounter` 使得 `App` 作为支持所有子视图的框架

`containres/App.js`:

```
import React, { Component } from 'react';

class App extends Component {
  render() {
    const { children } = this.props.children;
    return (
        <div>
          { children }
        </div>
    )
  }
}

export default App;
```

更新路由，添加 `/` 下的两个子路由 `counter` 和 `about`

`routes.js`:

```
import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from './components/App';
import VisibleCounter from './containers/VisibleCounter';
import About from './components/About';

export default (
    <Route path="/" component={App}>
      <IndexRoute component={VisibleCounter}/>
      <Route path="/counter" component={VisibleCounter}/>
      <Route path="/about" component={About}/>
    </Route>
)
```

其中 `IndexRoute` 表明 `VisibleCounter` 为在 `/` 时的默认路由。

在执行 `npm start` 之后看看 `http://localhost:8080/` 是不是计数器？`http://localhost:8080/#/about` 是不是我们的 `About` 页面？

## 其他内容

这里讲解了基本的路由的构建，当然路由还不仅仅有这些内容啦，还有 `<Link>` `pushState` 等等内容，其中 `<Link>` 的内容可以到 <https://github.com/reactjs/react-router-tutorial>
来看，然后其他部分在以后遇到的时候再解释。

## 参考

1. [react-router-redux](https://github.com/reactjs/react-router-redux)
2. [react-router](https://github.com/reactjs/react-router)
3. [react-router-tutorial](https://github.com/reactjs/react-router-tutorial)

