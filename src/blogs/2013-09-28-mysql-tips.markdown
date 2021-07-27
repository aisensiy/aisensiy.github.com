---
author: aisensiy
comments: true
date: 2013-09-28 03:17:16+00:00
layout: post
slug: mysql-tips
title: mysql and python tips
wordpress_id: 556
categories:
- 学习笔记
tags:
- mysql
- Python
---

最近又写 python 了，感觉好久不写又手生了。用 mysql 导数据，记下点东西吧。

## python-MySQLdb 的安装

在安装 pip 之前需要执行

    apt-get install libmysqlclient-dev python-dev

## 关于中文

### table creation

要想让 mysql 很好的支持中文，在创建 table 的时候就要小心了。看了一下 ruby migration 生成的 sql table 是这个样子的:

```sql
CREATE TABLE `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `is_archived` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `index_projects_on_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
```

注意最下面的

    ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

是一定要加的。


### python lang support

python 2 3 分离确实是个很让人揪心的事情。虽说 python3 已经对于 unicode 做了很好的支持，但是可惜 python3 一直发展不起来。我还是要苦逼的用着 python2.7 每次对于 string 都要自己去做一下转换。在把 string 扔给 MySQLdb 之前都要搞成 unicode 的。

### setdefaultencoding

通常在 linux 系统中的默认编码是 'ascii' 这导致 `urllib2.urlopen().read()` 出来的结果会有一些问题。

```
reload(sys)
sys.setdefaultencoding('utf-8')
```

这样会避免很多问题。

然后 [HOWTO UNICODE](https://docs.python.org/2/howto/unicode.html) 对于编码问题讲的非常的透彻。



### python MySQLdb

MySQLdb 的一个 connection 是不支持多线程的。要想支持多线程，需要对每一个线程建立 connection。

## connect mysql from remote


在 `/etc/mysql/my.cnf` 里面有一个 bind_network 如果允许远程连接的话，一定不能是 `127.0.0.1`。

然后就是给用户提升权限，让他可以 remote 连接。

```sql
grant all on *.* to adminm@'%' identified by '123456'
```

## mysql text limit



```
  TINYBLOB, TINYTEXT       L + 1 bytes, where L < 2^8    (255 Bytes)
  BLOB, TEXT               L + 2 bytes, where L < 2^16   (64 Kilobytes)
  MEDIUMBLOB, MEDIUMTEXT   L + 3 bytes, where L < 2^24   (16 Megabytes)
  LONGBLOB, LONGTEXT       L + 4 bytes, where L < 2^32   (4 Gigabytes)
```
text 最多支持 16K。

## mysql text index

如果想要给 text 字段建立索引那就需要指定索引的长度。

```sql
CREATE UNIQUE INDEX index_name ON misc_info (key(10));
```

**UPDATE:** 我后来木有这么做了，我对 url 做了 md5 这样我就有了一个长度为 32 的十六进制字符串。我对 md5 做了索引。

## mysql OperationalError: (2006, 'MySQL server has gone away')

这个问题也困扰了我好久。先描述一下，大概是因为 mysql 的连接有一个最长的连接时间。然后由于爬虫需要长时间的连接或者是等待连接，因此会导致在某些时候这个连接就断开了。

先去 /etc/mysql/my.cnf 看一些所有有关 `timeout` 的参数。

```
connect_timeout         = 10
wait_timeout            = 180
net_read_timeout        = 30
net_write_timeout       = 30
```

这里的时间单位都是秒，我查了一下资料，有对这些参数的具体解释，在[这里](https://www.taobaodba.com/html/433_mysql_timeout_analyze.html)

`connect_timeout` 在很多地方都存在，就是连接 mysql 时候的超时时间。应该不是这个。
`wait_timeout` 在连接建立之后 mysql 等待一个连接有动作的时间。也就是说如果连接在这个时间之内没有动作就会断开连接了。

即使连接没有处于sleep状态，即客户端忙于计算或者存储数据，MySQL也选择了有条件的等待。在数据包的分发过程中，客户端可能来不及响应（发送、接收、或者处理数据包太慢）。为了保证连接不被浪费在无尽的等待中，MySQL也会选择有条件（net_read_timeout和net_write_timeout）地主动断开连接。

这就让我纠结了，我尝试了修改以上的参数却没有从根本上解决这个问题。最后我就采用了比较暴力的方式。

```python
  def execute(self, *args, **kvargs):
    try:
      cursor = self.conn.cursor()
      cursor.execute(*args, **kvargs)
    except (AttributeError, MySQLdb.OperationalError):
      self.connect()
      cursor = self.conn.cursor()
      cursor.execute(*args, **kvargs)
    return cursor
```

哈，就是如果断开，我就重连...

这个解决的不太好，但是确实有效。

## sql 性能问题

```sql
select url from taobao limit 1 offset 2000000;
```

这条语句在我有 300w 的表里要跑个十几秒...
explain 如下:

```
mysql> explain select url from taobao limit 1 offset 2000000;
+---------------+------+---------+------+---------+-------+
| possible_keys | key  | key_len | ref  | rows    | Extra |
|---------------|------|---------|------|---------|-------|
| NULL          | NULL | NULL    | NULL | 3298171 |       |
+---------------+------+---------+------+---------+-------+
```

换一种方式

```
mysql> explain select url from taobao where id < 2000001 and id >= 2000000;
+---------------+---------+---------+------+------+-------------+
| possible_keys | key     | key_len | ref  | rows | Extra       |
+---------------+---------+---------+------+------+-------------+
| PRIMARY       | PRIMARY | 4       | NULL |    1 | Using where |
+---------------+---------+---------+------+------+-------------+
```

0.05 秒的速度。
