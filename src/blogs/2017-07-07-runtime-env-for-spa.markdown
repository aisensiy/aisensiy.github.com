---
layout:     post
title:      "为 Single Page App 提供运行时环境变量"
date:       2017-07-07 15:22:00 +08:00
author:     "Eisen"
tags:       [frontend, react, docker]
---

最近攻克了一个之前部署 single-page-app 的一个痛点：支持在运行时环境变量。这里讲述一下问题以及目前的解决方案。

## SPA 没有运行时环境变量的痛点

目前我的绝大部分的项目都是一个前后端分离的方式开发的。其中前端基本都是用 `create-react-app` 创建出来的标准的 react 的 spa 应用。这种 spa 在部署是将所有的 js 和 css 打包成一个或多个文件然后用 `serve` 或者其他类似的 http server 以静态文件的形式对外提供服务，但是这种前端静态文件话的应用没有 nodejs 的支持，没办法使用 `process.env` 这样的运行时注入环境变量的功能。

目前 `create-react-app` 提供了一个编译运行时环境变量的方案，因为在 `build` 的时候是有 `nodejs` 支持的，通过 `REACT_APP_API_URL=http://xxx.com yarn run build` 的方式在编译 spa 的时候注入环境变量。那么编译时的环境变量能不能解决问题呢？看情况了...可以做一个简单的对比。

1. 要知道我们通常要把什么样子的环境变量注入到 spa 中。额，我这里的需求很有限，为了让前后端一起运作，我所需要的环境变量就是后端 API 的入口。对于部署流程简单到之后生产环境且生产环境固定（尤其是后端生产环境 IP、域名固定）的情况，直接在编译时将后端的入口写死注入就行了。但如果有多个环境（staging）的需求就不适用了，假如没有运行时环境变量的支持为不同的环境提供不同的入口只能重新编译应用并注入不同的变量。

2. 有没有需求在应用运行时修改我们的环境变量。很明显运行时的环境变量支持通过重启就能修改环境变量的功能，如果有这种灵活修改环境变量的情况，编译时环境变量很明显也不能满足。

3. 在编译时对代码选择和裁剪。很明显，这个是最应该使用编译时环境变量的地方了。

说白了，其实不同时期的环境变量的作用是不一样的。两者不可能做到相互替代，在 `[1]` `[2]` 两个场景都是使用运行时环境变量比较舒服的地方，采用编译时的环境变量实在是不太方便。下面就介绍一下目前让 spa 应用支持运行时环境变量的方法，这里还是以 `create-react-app` 的模板为示例。

## 全局配置 + Docker 化部署

前端没有 `process.env` 这样的东西，我们只能用 javascript 的全局变量模拟。在将这个打包好的 spa 运行起来的时候，我们需要利用 shell 脚本生成这个 config.js 文件，让它把必要的环境变量翻译成全局变量。然后让默认的入口 html 文件引入这个全局变量文件。


首先，我们需要一段 shell 脚本，把环境变量翻译成 `config.js` 文件：

```bash
#!/bin/bash

if [[ $CONFIG_VARS ]]; then

  SPLIT=$(echo $CONFIG_VARS | tr "," "\n")
  ARGS=
  for VAR in ${SPLIT}; do
      ARGS="${ARGS} -v ${VAR} "
  done

  JSON=`json_env --json $ARGS`

  echo " ==> Writing ${CONFIG_FILE_PATH}/config.js with ${JSON}"

  echo "window.__env = ${JSON}" > ${CONFIG_FILE_PATH}/config.js
fi

exec "$@"
```

如果我们提供这样的环境变量

```bash
export REACT_APP_API_PREFIX=http://petstore-backend.example.com
export CONFIG_VARS=REACT_APP_API_PREFIX
```

那么所生成的 `config.js` 文件是这个样子的：

```javascript
window.__env = {
  'REACT_APP_API_PREFIX': 'http://petstore-backend.example.com'
}
```

然后，我们需要在 原来的 `index.html` 模板文件中引入这个我们生成的 `config.js` 文件：

```html
<!doctype html>
<html lang="en">
  <head>
  ...
  </head>
  <body>
    <noscript>
      You need to enable JavaScript to run this app.
    </noscript>
    <div id="root"></div>
    <script type="text/javascript" src="config.js"></script>
  </body>
</html>
```

这样，我们就拥有了一个 `window.__env` 的全局对象，它包含了所有的运行时环境变量。我们可以以如下的方式使用它：

```javascript
axios.defaults.adapter = httpAdapter;

let baseUrl;
let env = window.__env || {}; // 1

if (process.env.NODE_ENV === 'test') {
  baseUrl = 'http://example.com';
} else if (process.env.NODE_ENV === 'development') {
  baseUrl = env.REACT_APP_API_PREFIX || 'http://localhost:8080'; // 2
} else {
  baseUrl = env.REACT_APP_API_PREFIX;
}

const fetcher = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

1. 直接在文件中引入 `window.__env` 全局变量
2. 在需要的地方引用其中的变量即可

当然，这种依赖 shell 生成 `config.js` 的方案只有我们将 spa 打包好的之后才会使用，为了更好的使用这个 shell 我们可以采用 docker 化的方式把其启动流程以 entrypoint 的方式固化在应用的启动流程中。[SocialEngine/docker-nginx-spa](https://github.com/SocialEngine/docker-nginx-spa) 就实现了这个方案，是一个很好的用 base image。如果我们需要创建一个支持运行时环境变量的 create-react-app spa 的时候，首先按照上面的步骤修改 `public/index.html` 并且用 `window.__env` 作为环境变量使用。然后提供一个继承自 `SocialEngine/docker-nginx-spa` 的 `Dockerfile` 即可。

```
FROM socialengine/nginx-spa

COPY build/ /app
```

其中 `build/` 是 `create-react-app` 编译生成静态文件的默认目录。然后打包运行这个应用的方式如下：

```bash
$ yarn run build
$ docker build -t spa-app .
$ docker run -e CONFIG_VARS=REACT_APP_API_PREFIX -e REACT_APP_API_PREFIX=http://petstore-backend.example.com -p 3000:80 spa-app
```

当然，我们本地开发环境不用这么麻烦。只需要在 `public/` 目录下自己创建一个 `config.js` 然后把开发需要的环境变量塞进去就可以了。在 docker 化后，entrypoint 触发的命令会自动覆盖这个 config.js 文件。

[这里](https://github.com/aisensiy/pet-store-front-end) 是一个样例项目。

## 相关资料

1. [create-react-app](https://github.com/facebookincubator/create-react-app)
2. [compile-time-vs-runtime](https://github.com/mars/create-react-app-buildpack#user-content-compile-time-vs-runtime)
2. [serve](https://www.npmjs.com/package/serve)
3. [SocialEngine/docker-nginx-spa](https://github.com/SocialEngine/docker-nginx-spa)