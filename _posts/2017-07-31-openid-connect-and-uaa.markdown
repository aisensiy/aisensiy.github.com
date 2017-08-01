---
layout:     post
title:      "OpenID connect 与用户管理/用户权限系统"
date:       2017-07-31 17:03:00 +08:00
author:     "Eisen"
tags:       [uaa, openid-connect, microservice]
---

几乎所有的系统里面都需要**用户**的概念。那么随之而来的就是一些各个系统都需要但是有非常类似的功能，比如登录、注册、账号密码重置、邮箱确认、修改基本信息...每个系统都要做一遍是不是很麻烦？有没有解决方案减少这些重复劳动？这部分功能我们可以成为账户系统。

另一方面，用户可以是内部用户或者是管理员，也可以是一般的服务使用者，每个用户由于其角色以及其自己创建的资源的私密性，系统需要提供相应的机制管理用户的访问权限，然而目前的微服务架构中多个系统之间如何传递这种用户的信息并执行相应的权限管理呢？处理这部分的系统我们可以成为认证系统。

可以看到，账号系统和认证系统是相互依赖的，用户系统和认证系统基本是要一起做的。（有些诡异的开源产品仅仅做了认证的工作虽然那部分工作做的很出色，但是依然是不完整的。）这里讨论一下有关这两个主题的一些内容，以及目前一些可以使用的解决方案。

## OpenID connect 作为认证系统的标准协议

微服务环境下的权限认证一直是我很头痛的一个问题：首先，账户系统理应是一个独立的服务，但是由于每个微服务都有用户权限检查的需求，那么每次对任意一个微服务的请求就有会包含一个额外的去账户系统的请求，这样的账户系统压力该多大...然后，微服务涉及到服务之间的权限认证问题，即 A 服务有访问 B 服务的需求，但是 A 服务是不需要有神马真正的“人”去使用的，服务自身是一个特殊的用户，我们需要处理这种特殊的情况。

调研了一番，发现其实目前已经有一个很好的认证标准了，它就是 OpenId connect。它建立在 oauth 2.0 之上，首先它提供了一个除了 oauth2.0 的 `accesst_token` 外的另一个 `id_token`，它是 JWT 格式的，是我们减少大量鉴定用户请求的前提；并且其所遵循的 oauth2.0 的不同的认证流程也满足了我们对**人**和**服务**认证的需求；最后，其也为其授权的标准 `url` 制定了标准，使得各个实现了 openid connect 标准的任意系统都可以和其 client 轻松的集成。

### authorization code flow 处理用户认证

OpenID connect 的认证流程和 oauth2.0 是一致的，但是又比其多了 discovery 的部分。这里首先明确几个重要的接口：

1. `/.well-known/openid-configuration` 这是一个入口，指明了几个重要的链接。

   ```javascript
   {
		"issuer": "http://localhost:3000",
		"authorization_endpoint": "http://localhost:3000/oauth/authorize",
		"token_endpoint": "http://localhost:3000/oauth/token",
		"userinfo_endpoint": "http://localhost:3000/oauth/userinfo",
		"jwks_uri": "http://localhost:3000/oauth/discovery/keys",
		...
	}
   ```
2. `authorization_endpoint` 是登录界面，提供给人使用的
3. `token_endpoint` 用于获取 `access_token` 以及 `id_token` 
4. `userinfo_endpoint` 用于获取用户的信息
5. `jwks_uri` 提供了 `id_token` 签名的公钥信息（一定会使用非对称式的加密，否则密钥就暴露了）

然后，在实现流程之前需要创建一个 client：auth2.0 流程要求每个向认证系统请求用户信息的应用都必须是注册了的，注册时需要提供基本的名称，要求获取用户的信息范围以及合法的跳转链接（用户信息范围和跳转链接的使用在下文会提及），之后 client 会获取一个 `client_id` 和 `client_secret` 在后面的流程中会使用到这些内容。

#### 后端渲染的 authorization code 认证流程

1. 用户访问 client 页面，client 要求用户去认证系统登录，用户的浏览器就被重定向到上文提到的 `authorization_endpoint` 的页面，并附带了一些认证流程需要的信息，比如
  * `scope` 表明 client 需要获取的用户信息的范围，其中 openid 是必须的，然后还可以有额外的信息，比如 email 比如 profile，这些 scope 必须是在创建 client 时提供的
  * `redirect_uri` 在认证系统认证成功后要求认证系统跳转的 uri，这个 uri 必须是在创建 client 时提供的
  * `response_type` 要求认证系统返回的信息，在 authorization code 流程中就是 `code`
2. 在 `authorization_endpoint` 用户可以创建新的账号或者直接登录已有的账号，这些动作都是一个用户系统所应当提供的内容，在完成登录之后，认证系统会随着 `redirect_uri` 跳转会 client 并在 `query` 提供一个 `code` 的参数
3. client 在从认证系统获得了 `code` 参数后，连同 `client_id` `client_secret` `grant_type` 一起 POST 给上文提到的 `token_endpoint`，其中 `grant_type` = `authorization_code`，表明其所使用的认证流程。然后认证系统返回合法的 `accesss_token` 和 `id_token`:

   ```js
   {
     "access_token": "askdfjasdf",
     "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ..."
   }
   ```

在获取 `id_token` 和 `access_token` 之后，一方面可以通过 `access_token` 获取 `userinfo`，另一方面可以将 `id_token` 在各个系统之间传递。

#### 前后端分离时的 authorization code 认证流程

前面提的是一种后端渲染的认证流程，在用户被重定向到认证系统并返回来时面对的是一个 server。而在前后端分离的情况下只有一点点的变化：

1. 首先用户访问的一定是前端，然后实现用户重定向的也是前端
2. 在用户从认证系统重定向回来时，首先重定向的页面是前端的，但是在来到这个前端的页面时，后端会通过解析当前的 url 拿到 `code` 并调用一个后端接口在后端请求 `token_endpoint` 获取 `id_token` 以及 `access_token` 然后后端可以将 `id_token` 返回给前端，作为前端获取后端信息的认证。这样的好处就是 client_secret 始终不会因为暴露在前端而被他人获取

### password flow 与 client credentials 处理微服务认证

前面讲了人的认证流程，下面是一个机器的认证流程了。其中最大的区别在于没有人工输入密码的过程。oauth 2.0 提供了两个可以这么做的认证流程。一个是直接密码登录，一个是连账号和密码都不需要，直接通过 `client_id` `client_secret` 实现登录。

对于 password flow 我们是为 service 创建一个特殊的用户角色，而 client credentials 则更进一步：client_id 和 client_secret 本身就表明它是一个特殊的账号了。可见 client credentials 是更适合这种机器之间的通讯的。之所以还要强调 password flow 是因为并不是所有的 openid connect 体系都支持 client credentials 的，因为你可以认为它将 client 看做一个特别的 resource owner 和一般的用户认证体系有点格格不入。

```
+----------+
| Resource |
|  Owner   |
|          |
+----------+
     v
     |    Resource Owner
    (A) Password Credentials
     |
     v
+---------+                                  +---------------+
|         |>--(B)---- Resource Owner ------->|               |
|         |         Password Credentials     | Authorization |
| Client  |                                  |     Server    |
|         |<--(C)---- Access Token ---------<|               |
|         |    (w/ Optional Refresh Token)   |               |
+---------+                                  +---------------+

password flow
```

```
+---------+                                  +---------------+
|         |                                  |               |
|         |>--(A)- Client Authentication --->| Authorization |
| Client  |                                  |     Server    |
|         |<--(B)---- Access Token ---------<|               |
|         |                                  |               |
+---------+                                  +---------------+

client credentials flow
```

### JWT 实现去中心化的权限验证

前面提到微服务体系会导致用户每次访问都需要到认证系统认证权限，但是如果采用了 id_token 这样的 jwt 格式的令牌就可以避免这个问题了。

首先，认证系统的 `jwks_uri` 会将创建 `id_token` 签名的公钥暴露出来。那么，其他的微服务只需要将其保存在自己的服务中并在获得 `id_token` 时利用这个公钥检查其签名是否合法就能判断其是否来自自己的认证系统了。

并且，jwt 自己会涵盖一些基本的用户信息（当然，我们自己也可以控制里面承载的内容），这样每次想要获取基本的用户信息的时候直接从 jwt 中获取即可。

最后，jwt 自带 `exp` 的字段表明其失效的时间，每次请求微服务我们可以通过检测签名 + 失效时间判断是有效性。

## 实现方案

前面提到，用户系统和认证系统对于很多系统来说都是重复性的功能。我们系统找到一个解决方案可以避免这种重复工作。目前来看，市面上有三种可选择的方案。

### 1. 提供认知和账号管理的 SaaS 解决方案

`auth0` `okta` 都是比较著名的认证和账号管理解决方案（[auth0](https://auth0.com/) 的那个宣传视频很清楚的解释了重复性劳动的问题，推荐看看），服务稳定，功能优良。当然也价格昂贵...而且有 GFW 的存在导致任何国际访问流量都慢了一个档次...首先 Okta 本来就是我司使用的方案，其速度之慢我感受颇深，然后 auth0 我也在自己的方案中亲测过，各种 timeout。所以并不推荐在国内使用。

### 2. 开源解决方案

`keycloak` 以及 `cloudfoundry uaa` 等是做为其自身 PaaS 产品的账号解决方案，结果生产环境的考验，系统稳定，功能健全。是我们可以考虑的方案。尤其是 keycloak 可以说是功能非常完备，openid connect 所有的认证流程（包括 client credentials）都支持。目前来看是一个可行的方案，我们自己的系统也有采用它的。

它唯一的问题就是有点历史包袱：SAML有的时候它就有了，很多采用的技术有点古老，自己定制化修改要费一些功夫。

### 3. 开源类库

在 rails 社区有成熟的用户系统的类库 `devise`，有成熟的 oauth2.0 的类库 `doorkeeper`， 还有 openid-connect 的半成品类库 `doorkeeper-openid_connect`。如果把他们很好的组合起来应该是既灵活又功能完备的体系。但是...并没有被很好的集成在一起。

目前我自己正在做一个集成的 uaa 系统。


## 参考信息

1. [OAuth 2.0 筆記 (4.4) Client Credentials Grant Flow 細節](https://blog.yorkxin.org/2013/09/30/oauth2-4-4-client-credentials-grant-flow)
2. [OAuth 2.0 筆記 (4.3) Resource Owner Password Credentials Grant Flow 細節](https://blog.yorkxin.org/2013/09/30/oauth2-4-3-resource-owner-credentials-grant-flow)
3. [OAuth 2.0 筆記 (4.1) Authorization Code Grant Flow 細節](https://blog.yorkxin.org/2013/09/30/oauth2-4-1-auth-code-grant-flow)
4. [OpenID Connect Core 1.0](http://openid.net/specs/openid-connect-core-1_0.html#CodeFlowSteps)
5. [doorkeeper-connect](https://github.com/doorkeeper-gem/doorkeeper-openid_connect)
6. [doorkeeper](https://github.com/doorkeeper-gem/doorkeeper)
7. [devise](https://github.com/plataformatec/devise)
8. [keycloak](http://www.keycloak.org/)