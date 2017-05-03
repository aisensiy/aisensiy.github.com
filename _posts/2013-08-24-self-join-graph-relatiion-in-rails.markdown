---
author: aisensiy
comments: true
date: 2013-08-24 02:43:07+00:00
layout: post
slug: self-join-graph-relatiion-in-rails
title: Self join graph relation in rails
wordpress_id: 552
categories:
- 学习笔记
tags:
- rails
---

最近有一个诡异的需求，需要做一个多对多的图关系。情况是这样的，有一堆本来是扁平关系的标签，现在需要给他们组织出来层级关系了。那么一个 tag 就会有很多的 父节点 以及 子节点。那么，简单来看，其实就是一个自身元素的多对多关系了。

通常的，针对两个 model 的多对多关系是这样的。[link here](http://guides.rubyonrails.org/association_basics.html#the-has-and-belongs-to-many-association)

```ruby
class Physician < ActiveRecord::Base
  has_many :appointments
  has_many :patients, through: :appointments
end

class Appointment < ActiveRecord::Base
  belongs_to :physician
  belongs_to :patient
end

class Patient < ActiveRecord::Base
  has_many :appointments
  has_many :physicians, through: :appointments
end
```

而对于通常的，对于自身做树级关系的 model 如下: [link here](http://guides.rubyonrails.org/association_basics.html#self-joins)

```ruby
class Employee < ActiveRecord::Base
  has_many :subordinates, class_name: "Employee",
                          foreign_key: "manager_id"

  belongs_to :manager, class_name: "Employee"
end
```

那么，我现在所需要的差不多就是把这两个结合一下。

```ruby
class Word < ActiveRecord::Base

  has_many :parent_relations, class_name: :WordRelation, foreign_key: :child_id
  has_many :child_relations, class_name: :WordRelation, foreign_key: :parent_id

  has_many :parents, through: :parent_relations
  has_many :children, through: :child_relations
end

class WordRelation < ActiveRecord::Base
  attr_accessible :child_id, :parent_id, :parent, :child

  belongs_to :parent, class_name: :Word
  belongs_to :child, class_name: :Word
end

```

两个 model `word` 以及 `word_relation`。对于这种 self join 的关系，通常是不能按照默认的外键的。那么就像第二个例子一样。我们需要自己指定 `foreign_key`。这里有个比较特别的地方。

```ruby
has_many :parent_relations, class_name: :WordRelation, foreign_key: :child_id
```

`parent_relations` 需要的外键居然是 `child_id` 感觉有点奇怪吧。不过理清 activerecord 帮你生成的 sql 是什么样子就明白了。为了找其父亲节点，那么 sql 语句大概如下:

```sql
select * from word_relations where [one column] = '[this word id]'
```

要找父亲节点，那么 where 中就是找 *哪个节点的子节点是这个 word*。所以就应当是反着的才对的。

---

做了上述的工作之后，一个图状的 word 关系就可以搞定了。