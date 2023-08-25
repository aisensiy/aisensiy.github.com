---
layout:     post
title:      "压缩 flyway migration"
date:       2023-08-25 00:16:00 +08:00
author:     "Eisen"
tags:       ["mysql", "flyway", "java", "springboot"]
---

## 起因

![](<截屏2023-08-25 15.05.09.png>)

数据库的 migration 随着时间的迁移会越来越多，这会带来一些问题：

1. 很多老旧代码摆在那里看着很烦，在未来系统升级的时候可能会被标记为 `deprecated`` 成为累赘，比如在新的数据库里挂掉，比如 spring 版本升级了会挂掉
2. 数据库结构通过一系列 migraiton 才能完成，如果是像 openbayes 这种需要大量部署的情况会导致启动的速度变慢

## 解决方案

如果确认目前所有的生成环境都已经升级大于 migration 的某一个版本了就可以考虑把之前的 migration 都压缩掉了，这样可以减少一些不必要的麻烦。比如我们确定目前所有的环境的 migration 版本都大于 400 了，那么我们就可以压缩 400 以及之前的 migration。

### 准备一个 migration 到特定版本的环境

本地启动一个新的 mysql:

```bash
docker run --name some-mysql -e MYSQL_ROOT_PASSWORD=mysql -p 3306:3306 -d mysql:8
```

然后在本地启动一个 springboot 项目，配置好 flyway 的配置，然后把 migration 的版本设置为 400，这样就可以把 migration 生成到 400 了：

```bash
./gradlew flywayMigrate -Dflyway.target="400"
```

这里我发现一个奇怪的问题，如果这里 400 这个版本不是一个 sql 而是一个 java 脚本类型的 migration 则会报错，不知道是不是我配置的问题。

### 将数据 dump 出来

```bash
mysqldump -u<username> -p<password> db > dump.sql
```

### 抽取需要的数据导入到 V1 版本的 migration

这里我只保存两部分内容：

1. create table 的 sql
2. insert into 的 sql

我会让 chatgpt 分别给我写两个脚本帮我抽取其中的内容然后贴到我的项目里。

```py
"""
抽取 create table 的 sql
"""

import re

def extract_create_table_statements(dump_file):
    create_table_statements = []
    create_table_pattern = r'CREATE TABLE.*?;'

    with open(dump_file, 'r') as file:
        dump_content = file.read()
        create_table_matches = re.findall(create_table_pattern, dump_content, re.DOTALL)

        for match in create_table_matches:
            create_table_statements.append(match.strip())

    return create_table_statements

# Example usage
dump_file = 'dump.sql'
create_table_statements = extract_create_table_statements(dump_file)

for statement in create_table_statements:
    print(statement)
    print()
```

```py
"""
抽取 insert into 的 sql
"""
import re

def extract_insert_statements(file_path):
    with open(file_path, 'r') as file:
        dump_data = file.read()

    insert_pattern = r'INSERT INTO .*?;'
    insert_statements = re.findall(insert_pattern, dump_data, re.DOTALL)

    return insert_statements

# Usage example
file_path = 'dump.sql'
insert_statements = extract_insert_statements(file_path)

# Print the extracted insert statements
for statement in insert_statements:
    print(statement)
    print()
```

这里记得手工剔除掉 migration 的 table。

### 删掉 V400 以及之前的 migration

这样就结束了。

## 注意

flyway 会有一个 sql 的[校验](https://documentation.red-gate.com/fd/validate-184127464.html)它会阻止你修改已经做过的 migration。这个机制是为了避免手贱不小心修改了老的 sql 不过我们这里是刻意为之，所以就需要把这个关掉了。

`application.yaml`:

```yaml
spring:

...

  flyway:
    validate-on-migrate: false

...
```
