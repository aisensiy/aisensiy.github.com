---
layout: post
---

# python namespace and package

最近使用了一下 python，用到了 package 去组织文件。但是用的很恼火。今天好好的查了一下相关的内容，算是搞的差不多了。

首先，python 的 package 通常是在文件 `__name__` 不是 `__main__` 的时候有效的。如果一个文件要以 main 直接执行，那么它就应该以绝对路径的方式引入。

```
├── __init__.py
├── main.py
├── importer
│   ├── __init__.py
│   ├── db_migrator.py
├── spider
│   ├── __init__.py
│   ├── fetcher.py
└── util
    ├── __init__.py
    ├── other.py
    └── tool.py
```

如上的结构

main.py:

```python
import spider.fetcher

if __name__ == '__main__':
  spider.fetcher.fetch()
```

spider.fetcher.py:

```python
import importer.db_migrator


def fetch():
  """docstring for fetch"""
  print 'fetch'
```

如果执行 `main.py` 而 `spider/fetcher.py` 永远以类库的形式被引用，那么这样的写法是没有问题的。

但是，如果 `spider/fetcher.py` 包含 `__main__` 部分的话，例如

```python
import importer.db_migrator

def fetch():
  """docstring for fetch"""
  print 'fetch'

if __name__ == '__main__':
  fetch()
```

直接执行 `python spider/fetcher.py` 是会报错的。应该为其提供绝对路径的 path 才可以。

```python
import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(PROJECT_ROOT)

import importer.db_migrator

def fetch():
  """docstring for fetch"""
  print 'fetch'

if __name__ == '__main__':
  fetch()
```

增加的内容就是强制将项目的路径添加到寻找 package 的路径列表里，使得在运行时可以找到需要的包。
