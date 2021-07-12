---
layout:     post
title:      "Redux with react router update"
date:       2016-08-17
author:     "Eisen"
tags:       [webpack, js, flux, redux, react, router]
---

之前有写过一篇 [Redux With React Router](/redux-with-react-router)，介绍 `redux` 与 `react-router` 结合实现多个视图的 WebApp，但是最近才发现有很多地方已经和之前使用的方式不一样了，这里做一个更新。

## use react-router without redux

`react-router` 提供了 `react` 的路由机制，在之前的文章中讲到了它可以和 `react-router-redux` 一起使用。当时的目的是为了将路由的信息传递到 `redux store` 中，在做 `container component` 的 `connect` 时可以通过 `mapStateToProps` 的方式将路由中的信息提供给组件使用。但是随着 `react-router` 的不断更新以及 `react-router-redux` 的定位的不断明确，现在可以不适用 `react-router-redux` 而仅仅用 `redux-router` 完成将路由绑定到 `container component`。而 `react-router-redux` 成为了追朔包含了路由的用户行为的一个工具，而这个功能对于很多应用来说不是很有必要，其官方文档也强调:

> This library is not necessary for using Redux together with React Router. You can use the two together just fine without any additional libraries. It is useful if you care about recording, persisting, and replaying user actions, using time travel. If you don't care about these features, just use Redux and React Router directly.

## 采用 withRouter 的高阶组件实现路由的绑定

首先，对于直接在 `Router` 中出现的组件，`react-router` 通过 `context` 的方式为该组件提供了当前路由的信息（如 `params` `location` 等）。但是如果是嵌套在路由创建的组件下的其他容器需要使用路由的信息呢？这个时候就需要用到 `withRouter` 这个由 `react-router` 提供的高阶组件了。在[这里](https://egghead.io/lessons/javascript-redux-using-withrouter-to-inject-the-params-into-connected-components) 由 `redux` 的作者提供了一个视频教程介绍了这个方法。可是如果你直接 `npm install react-router --save` 之后就按着作者的来使用的话会发现根本没有 `params` 的参数...原因在于 `withRouter` 这个高阶参数在当前默认的最新版 `react-router` 中根本没有提供这个东西，它仅仅注入了 `router` 方便组件做导航而已...只有明确的指定 `"react-router": "^3.0.0-alpha.1"` 的版本之后才能这么做...坑爹呀。

## 参考

1. [How to use withRouter](https://egghead.io/lessons/javascript-redux-using-withrouter-to-inject-the-params-into-connected-components)
2. [react-router](https://github.com/reactjs/react-router)
3. [react-router-tutorial](https://github.com/reactjs/react-router-tutorial)

