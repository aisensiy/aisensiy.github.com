---
layout:     post
title:      "Nodejs with babel es2015"
date:       2016-09-21
author:     "Eisen"
tags:       [nodjs, js, babel, es6]
---

最近开始尝试用 nodejs 去写后端 api，和前端类似，为了采用 es6 的语法同样需要做一些 boilerplate 的工作。这里记录下来，加深一下记忆。

不过首先要先跑个题。其实 babel 不是第一个支持 js 变种的东西，最早出现过 coffeescript 目前比较流行的还有 typescript。typescript 支持强类型，支持 interface，尤其是 interface 这种 oo 的利器，真是让我跃跃欲试。但是有静静地想了想，其实目前 es6 作为一个未来的标准可能还是更有前途一些，并且目前的 es6 对于 oo 的支持已经相对来说好了一些了。应该还算凑合。

# Install Dependencies

首先当然是创建项目，安装依赖了。

```sh
npm init -y
npm i -D babel-cli babel-preset-es2015 nodemon
```

其中 `nodemon` 是用来检测项目下的文件自动重启 nodejs server 的。

# Create babelrc

然后创建一个 `.babelrc` 文件表明所支持的 `babel` 内容。

```sh
touch .babelrc
```

.babelrc:

```
{
  "presets": ["es2015"]
}
```

如果想要支持 `Object Spread Operator` 这样的功能（就是 `...` 这个语法）则需要额外安装一个 babel 的插件 `babel-plugin-transform-object-rest-spread`

```sh
npm install babel-plugin-transform-object-rest-spread -D
```

然后在 `.babelrc` 添加如下内容

```
{
  "plugins": ["transform-object-rest-spread"]
}
```

# Dev command to run es6 node js

在完成了 babel 的配置之后，我们就可以采用 es6 的语法去写 js 了。比如这里是一个样例。


`index.js`:

```js
import http from 'http';

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end("Hello, World\n");
}).listen(300, '127.0.0.1');
```

这里用到了 es6 的 `import` 以及 `=>` 方法。如果直接执行 `node index.js` 是会报错的。这里我们可以在 `package.json` 中的 `scripts` 下添加一个方法 `dev` 用 `babel-node` 命令执行我们的 es6 语法的文件。

`package.json`:

```
{
  "script": {
    "dev": "babel-node index.js"
  }
}
```

然后通过用 `nodemon` 包裹 `dev` 命令可以做到自动重启 nodejs 的 server。

```
{
  "script": {
    "dev": "nodemon --exec babel-node index.js"
  }
}
```

# Build command to create code for production

`babel-node` 仅仅是用于开发环境，每次修改代码后可以自动的编译文件。但是如果我们想要在生产环境部署代码的时候就需要一个专门的命令一次性将所有的代码编译成 `node` 支持的 es5 语法的文件了。

这里我们在 `package.json` 中再增加一个 `build` 命令

```
{
  "script": {
    "dev": "nodemon --exec babel-node index.js",
    "build": "babel src --out-dir dist"
  }
}
```

通过执行 `npm run build` 可以将 `src` 下的 `es6` 语法的文件编译成 `dist` 下支持 `es5` 语法的文件。

最后在添加一个 `start` 方法去启动 `nodejs` server。


```
{
  "script": {
    "dev": "nodemon --exec babel-node index.js",
    "build": "babel src --out-dir dist",
    "start" "node dist/index.js"
  }
}
```

为了保证每次执行 `npm run start` 命令前都会执行 `build` 命令，我们可以将 `build` 重命名为 `prestart`，`nodejs` 会自动的帮助我们在执行 `start` 之前执行它。


```
{
  "script": {
    "dev": "nodemon --exec babel-node index.js",
    "prestart": "babel src --out-dir dist",
    "start" "node dist/index.js"
  }
}
```

# 参考

1. [Object Spread Operator](http://babeljs.io/docs/plugins/transform-object-rest-spread/)
2. [nodemon](https://github.com/remy/nodemon)
3. [Using ES6 and beyond with Node.js - node Video Tutorial](https://egghead.io/lessons/node-js-using-es6-and-beyond-with-node-js)
