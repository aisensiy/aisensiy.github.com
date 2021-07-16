---
author: aisensiy
comments: true
date: 2013-07-31 19:15:58+00:00
layout: post
slug: angluar-resource-rails-integration
title: angluar-resource rails integration
wordpress_id: 544
categories:
- 关注web
tags:
- angular
- js
- rails
- restful
---

最近本来是在折腾 parse angular rails 的一个项目。一直想把 parse 封装成和 rails 自带的 activerecord 那样的的 api 但是最终由于各种原因还是放弃了。整体来说还是因为 parse 的社区不够大，需求量不够大，导致周边做的不是很给力。要啥啥没有也就罢了，关键是 parse 目前处于高不成低不就的地步：要啥有啥，但是，做的不好，不完善。

浪费了一天在 `parse-resource` 上无果很是伤心。总想做点东西去弥补下损失，起码找到个可以用于目前项目的，简化项目开发的东西吧？那就从这个的周边入手吧。我一直都在想如果 backend restful 的这个接口搞定了，那前面就可以尝试 `angular-resource` 了。虽说目前后端没有搞定，但是我们依然可以去尝试它。

`angular-resource` 就是一个可以简化 `angular` 写 restful 接口的工具。之前不使用它是因为有这样一个疑问：我并不是仅仅有 restful CRUD 的接口。当我有其他的自定义的动作的时候 `angular-resource` 能支持吗？今天我终于把这个问题弄清楚了。

首先，要给 `angular-resource` 提供一个完整的 restful 的 backend。这里我就用 rails 做了一个。

```ruby
class PostsController < ApplicationController
  respond_to :json

  def index
    @posts = Post.all

    respond_with @posts
  end

  def show
    @post = Post.find_by_id(params[:id])

    respond_with @post, status: if @post.nil? then :not_found else 200 end
  end

  def create
    @post = Post.new(params[:post])
    @post.save

    respond_with @post
  end

  def update
    @post = Post.find_by_id(params[:id])
    @post.update_attributes(params[:post]) if @post

    respond_with @post, status: if @post.nil? then :not_found else 200 end
  end

  def destroy
    @post = Post.find_by_id(params[:id])
    @post.destroy if @post

    respond_with @post, status: if @post.nil? then :not_found else 200 end
  end

  def reset
    @post = Post.find_by_id(params[:id])
    if @post
      @post.body = 'reset as default content'
      @post.save
    end

    respond_with @post, status: if @post.nil? then :not_found else 200 end
  end

  def top2
    @posts = Post.limit(2)
    respond_with @posts
  end
end

```

这个 controller 在错误的处理以及 http code 的返回上可能还有一些问题，但是我们先忽略这些。关键的提供一个如下的 routes。

```ruby
resources :posts do
  member do
    post :reset
  end
  collection do
    get :top2
  end
end
```

```
$: rake routes

reset_post POST   /posts/:id/reset(.:format) posts#reset
top2_posts GET    /posts/top2(.:format)      posts#top2
     posts GET    /posts(.:format)           posts#index
           POST   /posts(.:format)           posts#create
  new_post GET    /posts/new(.:format)       posts#new
 edit_post GET    /posts/:id/edit(.:format)  posts#edit
      post GET    /posts/:id(.:format)       posts#show
           PUT    /posts/:id(.:format)       posts#update
           DELETE /posts/:id(.:format)       posts#destroy
```

好，有了这些之后，我们就可以用 `angular-resource` 构建一个 `Post` 的 module 来处理 restful 的请求啦。

首先 ngResource 的文档在这里 [http://docs.angularjs.org/api/ngResource.$resource](http://docs.angularjs.org/api/ngResource.$resource) 虽然大家都吐槽 angular 的文档很糟糕，但是没有别的办法，这个就是最官方的出处了。而且起码我觉得这篇讲的还算说的过去。

```js
App = angular.module 'App', ['ngResource']

App.factory 'Post', ($resource) ->
  $resource('/posts/:id/:verb', {id: '@id'},
    reset: { method: 'POST', params: {verb: 'reset'} }
    top2: { method: 'GET', params: {verb: 'top2'}, isArray: true }
  )
```

如上所示，对于有自定义的 restful 接口的情况，我提供了一个额外的参数 `verb`。对默认的 restful 接口 `angular-resource` 可以帮我们处理了，我们只需要处理额外的自定义的即可。

    reset: { method: 'POST', params: {verb: 'reset'} }

设置 verb: reset 就可以将这个动作和 url 绑定了。

```js
    post = new Post($scope.post)
    post.$reset(
      (data) ->
        alert('success!!')
        $scope.post = data
    )

```

同理，

    top2: { method: 'GET', params: {verb: 'top2'}, isArray: true }

verb: top2 就对应 posts/top2 的 url。不过这里有一个额外的参数 `isArray` 这个就好像 rails routes 里面声明的 `collection` 一样，说明不是针对单个元素的。

```
App.controller 'IndexController', ($scope, Post) ->
  $scope.posts = Post.top2()
```

----

虽然这里还没有涉及嵌套的情况，但是整体来说应该是类似的。

顺便说一句，项目用到了一个 gem `bower-rails` 把 bower 整合进来。可以更简单的安装 各种 css js 资源。[http://pete-hamilton.co.uk/2013/07/13/angularjs-and-rails-with-bower/](http://pete-hamilton.co.uk/2013/07/13/angularjs-and-rails-with-bower/) 的讲解推荐一看。

再多说一句，前面有一篇讲述 webapps 的文章，这篇其实和它也有一点关系。目前我比较看好 angularjs 希望用它作为 webapp 的开发框架。
