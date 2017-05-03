---
author: aisensiy
comments: true
date: 2013-01-29 03:12:23+00:00
layout: post
slug: rails-factory_girl-and-faker
title: rails -- factory_girl and faker
wordpress_id: 363
categories:
- 学习笔记
tags:
- factory_girl
- faker
- get-started
- rails
- ruby
---

昨晚写 high 了，本来想写写 factory_girl 和 faker 这两个 gem，结果一字未提。这里再写一篇好了。

factory_girl 与 faker 都是在那本在线的 rails tutorials 里面看到的。factory_girl 用于替换 fixtures 而 faker 用于生成各种随机的内容，这两个东西一个提供生成东西的框架，一个提供具体生产出来的内容，一起使用就显得非常合理了。刚刚纠结的在写相关的内容，反复的打开这两个 gem 的 github 页面翻来翻去，翻的好烦，决定总结一下！这里结合 rails tutorials 写一下自己感觉比较实用的内容。<!-- more -->

刚接触 rails 时看到 fixture 这个东西，感觉还是挺体贴的。不过，尽管是可以配合 erb 方式嵌入代码，但依然不够灵活。于是就有人（thoughtbot）做了个写 code 生成 fixture 的东西，叫做 factory_girl。用处和 fixture 是一样的，只是把 yaml 换成了 ruby code。既然，它的名字里面有 factory，那么我就把它认为是用于为每个类生成很多实例的。这里先给第一个例子。

```ruby
FactoryGirl.define do
  factory :user do
    email 'test@example.com'
    password '00000000'
    password_confirmation '000000000'
  end
end
```

这是一个等价于 fixture 的例子，用于生成一个静态的 user 记录。
不过 factory_girl 很灵活，不像 fixture 直接放进数据库，还可以有其他的方式。

```ruby
# Returns a User instance that's not saved
user = FactoryGirl.build(:user)

# Returns a saved User instance
user = FactoryGirl.create(:user)

# Returns a hash of attributes that can be used to build a User instance
attrs = FactoryGirl.attributes_for(:user)

# Returns an object with all defined attributes stubbed out
stub = FactoryGirl.build_stubbed(:user)
```

build create attributes_for 都比较容易理解，而最后这个 build_stubbed 就诡异了。我 search 了一下，发现了 thoughtbot 自己写的一篇文章 [Use Factory Girl’s build_stubbed for a Faster Test Suite](http://robots.thoughtbot.com/post/22670085288/use-factory-girls-build-stubbed-for-a-faster-test)，文章中提到


> build_stubbed is the younger, more hip sibling to build; it instantiates and assigns attributes just like build, but that’s where the similarities end. It makes objects look look like they’ve been persisted, creates associations with the build_stubbed strategy (whereas build still uses create), and stubs out a handful of methods that interact with the database and raises if you call them. This leads to much faster tests and reduces your test dependency on a database.


差不多是说 很多测试的时候，虽然数据保存到了数据库，但是并不会和数据库打交道，你要的内容已经在这个对象里面了。那么，为了加速测试，你其实不用真的把数据写到数据库里面。build_stubbed 假装已经把数据保存到数据库了（伪装的create）。然后你在继续别的测试就行了。当然，既然是假装保存到数据库里面了，那么如果你真的用到保存后的信息，它会报错的。不过到目前为止，我并没有实用过这个方法。

[update]学到老活到老，写这个的时候居然都不知道 stub 是什么，现在知道了。看了 mocha 就什么都知道了。

额，刚才我还想写我对于 attributes_for 的实用呢，因为我以为 user model 保存之后，其 password 属性就不复存在了呢，不过刚才我尝试了一下，它依然建在，那么我之前为了得到原有的 password 而实用 attributes_for 就是徒劳的了。这么说来，这个方法就没什么用处了 o_o。因为 factory_girl 支持属性的重写。

```ruby
rails g scaffold comment content:text user_id:integer post_id:integer

FactoryGirl.define do
  factory :comment do
    content 'bla bla'
  end
end

@comment = FactoryGirl.create :comment, user_id: user_id, post_id: post_id
```

我仅仅为 comment 的 content 提供内容，在真正生产 comment 的时候，用重写的方式把 user_id post_id 补全即可。

到目前为止，factory_girl 差不多只是 fixture 等价功能的加强版，下面就要讲述它作为 工厂 的特性了。同时，有了工厂，就要有材料，Faker 就要登场了。

在 factory_girl 的 [readme](https://github.com/thoughtbot/factory_girl/blob/master/GETTING_STARTED.md) 中 有一个章节叫做 Lazy Attributes，是说一些属性在对象生成的时候才能定义，而不是用静态的定义。就比如 user，静态的 email 由于需要是唯一的，因此不能用于反复生成。需要我们提供一个方法可以生成不同的 email。那么 sequence 与 generate 就要登场了。

sequence 与 generate 方法是配合使用的。

```ruby
# Defines a new sequence
FactoryGirl.define do
  sequence :email do |n|
    "person#{n}@example.com"
  end
end

FactoryGirl.generate :email
# => "person1@example.com"

FactoryGirl.generate :email
# => "person2@example.com"
```

如果用 python 的模式来解释 sequence 像是一个生成器，而 generate 像是一个迭代器，这样配合实用可以生成无限多的 email 了。

上面的例子是 官方 readme 给出的。而我则把 sequence 与 faker 一起使用，就可每次生成随机的内容了。这部分内容在 rails tutorial 里面也有提及（[sample microposts](http://ruby.railstutorial.org/chapters/user-microposts#sec-sample_microposts)）。我的做法比较类似。

```ruby
FactoryGirl.define do
  sequence(:random_title) {|n| Faker::Lorem.words().join(' ')}

  sequence(:random_content) do |n|
    Faker::Lorem.paragraphs().map {|elem| "<p>#{elem}</p>"}.join("\n")
  end

  factory :post do
    title { generate :random_title }
    content { generate :random_content }
  end
end
```

faker 确实是个很方便的东西，而且没有什么难度，想要看具体的用法，直接来看 [docs](http://faker.rubyforge.org/rdoc/) 就好了。

最后，我结合这些，做了一个类似于 rails tutorials 里面的 populate task 的东西，用于生成初始数据。

```ruby
namespace :db do
  desc "Fill database with sample data"
  task populate: :environment do
    email1 = "normal@gmail.com"
    email2 = "example@example.com"
    email3 = "root@gmail.com"
    email4 = "mod@gmail.com"

    user1 = make_user(email1)
    user2 = make_user(email2)
    user3 = make_admin(email3)
    user4 = make_moderator(email4)

    2.times do
      post = make_posts(user1)
      [user1, user2, user3, user4].each do |u|
        FactoryGirl.create :comment, post_id: post.id, user_id: u.id
      end
    end

    2.times do
      make_posts(user2)
    end

  end

  def make_user(email)
    User.create!(
      email: email,
      password: "00000000",
      password_confirmation: "00000000"
    )
  end

  def make_admin(email)
    user = make_user(email)
    user.role = "admin"
    user.save!
    user
  end

  def make_moderator(email)
    user = make_user(email)
    user.role = "moderator"
    user.save!
    user
  end

  def make_posts(user)
    content = Faker::Lorem.paragraphs().map {|item| "<p>#{item}</p>"}.join("\n")
    user.posts.create!(title: Faker::Lorem.sentence(), content: content)
  end
end
```

每次需要用命令

    rake db:reset && rake db:populate

而且，前提是 seeds.rb 为空，因为 rake db:reset 重新跑所有的 migration 然后跑 seeds.rb。这让我觉得是不是这些 sample 数据放在 seeds.rb 会更好一些呢？单独的 task 粘和性并不是很好的样子。

（更新）我已经这么做了，把 populate 这个 task 干掉，把里面的代码稍作修改直接放到 seeds.rb 然后每次
只需

    rake db:reset


即可。

最后眼馋 factory_girl 里面 sequence generate 方法，自己写了一个 naive 版本的，挂在这里好了。

```ruby
class Factory
  @@generators = {}

  def self.sequence(name, &proc)
    @@generators[name] = {
      seq: 0,
      proc: proc
    }
  end

  def self.generate(name)
    @@generators[name][:seq] += 1
    @@generators[name][:proc].call(@@generators[name][:seq])
  end
end

Factory.sequence :email do |n|
  "example#{n}@exmple.com"
end

puts Factory.generate :email
# example1@example.com
puts Factory.generate :email
# example2@example.com
```

factory_girl 到目前为止，用的还是比较浅的，不过作为 fixture 的替代品，以后应该有很多打交道的时候。
