---
layout: post
title: "Hibernate 使用 UserType 存储 joda money"
date: 2022-03-15 00:00:00 +08:00
author: "Eisen"
tags:       
- "hibernate"
- "java"
- "jpa"
---

虽然一直非常喜欢 mybatis 但从效率的角度来看，hibernate 也是一个值得尝试的工具。最近开始做一些尝试，看看是不是的利用 jpa 来进一步的简化目前很多繁琐无聊的 sql 的编写。这里记录下今天遇到的有关自定义类型的一个知识点。

在 mybatis 里有 type handler 的概念，用于实现表结构和自定义的 java 对象之间的转换。而 hibernate 也有一个相似的概念，不过这里我只是记录下目前这种一个对象对应多个 column 的场景。

## joda moeny

joda money 是一个轻量级的货币类型，可以用来存储货币，比如人民币，美元，日元等。它有两个关键字段，一个是 amount，一个是 currency。那么很自然的就希望在数据库里对应两个 column 分别是 decimal 类型的 amount 和 varchar 类型的 currency。

## 定义 JodaMoneyType 

我在 [这篇文章](https://www.baeldung.com/hibernate-custom-types#2-implementingusertype) 找到了自己想要的东西。就是要实现一个 `JodaMoneyType` 实现 `joda money` 类型和数据库中两个列的映射。

```java
public class JodaMoneyType implements UserType {
  @Override
  public int[] sqlTypes() {
    return new int[] {Types.VARCHAR, Types.DECIMAL};                         // [1]
  }

  @Override
  public Class returnedClass() {
    return Money.class;
  }

  @Override
  public boolean equals(Object x, Object y) throws HibernateException {
    if (x == y) { return true; }
    if (x == null || y == null) { return false; }
    return x.equals(y);
  }

  @Override
  public int hashCode(Object x) throws HibernateException {
    if (x == null) { return 0; }
    return x.hashCode();
  }

  @Override
  public Object nullSafeGet(ResultSet rs, String[] names, SharedSessionContractImplementor session, Object owner) throws HibernateException, SQLException {                                                         
    if (rs.wasNull())                                                        // [2]
      return null;
    String currency = rs.getString(names[0]);
    BigDecimal amount = rs.getBigDecimal(names[1]);
    return Money.of(CurrencyUnit.of(currency), amount);
  }

  @Override
  public void nullSafeSet(PreparedStatement st, Object value, int index, SharedSessionContractImplementor session) throws HibernateException, SQLException {
    if (Objects.isNull(value)) {                                             // [3]
      st.setNull(index, Types.VARCHAR);
      st.setNull(index + 1, Types.DECIMAL);
    } else {
      Money money = (Money) value;
      st.setString(index,money.getCurrencyUnit().getCode());
      st.setBigDecimal(index+1,money.getAmount());
    }
  }

  @Override
  public Object deepCopy(Object value) throws HibernateException {
    if (value == null) { return null; }
    Money money = (Money) value;
    return Money.of(money.getCurrencyUnit(), money.getAmount());
  }

  @Override
  public boolean isMutable() {                                               // [4]
    return false;
  }

  @Override
  public Serializable disassemble(Object value) throws HibernateException {
    return (Serializable) value;                                             // [5]
  }

  @Override
  public Object assemble(Serializable cached, Object owner) throws HibernateException {
    return cached;                                                           // [6]
  }

  @Override
  public Object replace(Object original, Object target, Object owner) throws HibernateException {
    return original;                                                         // [7]
  }
}
```

按照注释标记做一些解释：

1. 定义对应的 sql 类型，这里是 varchar 和 decimal。
2. 这里是根据数据库数据创建 joda money
3. 这里是将 joda money 保存到数据库
4. 由于 money 是不可变的，这里就直接返回了 false 后续 6 7 由于不可变做了简单的处理
5. 将 joda money 返回序列化结果
6. 直接返回结果
7. 由于不可变，这里直接返回 original

然后使用的时候按照如下添加注解即可：

```java
public class Deposit {
  ...
  @Columns(columns = {@Column(name = "currency"), @Column(name = "amount")})
  @Type(type = "com.example.learnjpa.deposit.JodaMoneyType")
  private Money paidMoney;
  ...
}
```

## 支持日志展示

hibernate 可以通过设置日志级别以显示丰富的信息。通常在测试和开发过程中会在 `application.properties` 设置如下：

```
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

以上设置分别展示 sql 语句，对 sql 语句做一定个格式化，以及展示每一个 sql 语句的参数。但是在使用 UserType 的时候会出现如下的奇怪问题：

```
Hibernate: 
    update
        openbayes_deposits 
    set
        currency=?,
        amount=?,
        owner_id=?,
        price=? 
    where
        id=?
2022-03-14 23:16:50.548 TRACE 71555 --- [    Test worker] o.h.type.descriptor.sql.BasicBinder      : binding parameter [3] as [VARCHAR] - [aisensiy]
2022-03-14 23:16:50.548 TRACE 71555 --- [    Test worker] o.h.type.descriptor.sql.BasicBinder      : binding parameter [4] as [INTEGER] - [111]
2022-03-14 23:16:50.548 TRACE 71555 --- [    Test worker] o.h.type.descriptor.sql.BasicBinder      : binding parameter [5] as [VARCHAR] - [13123]
```

明明是 5 个参数，前两个 currency 和 amount 对应的 paramter 居然没有打印出来。这个行为甚让我一开始以为自己写的 UserType 是有问题的。

做了进一步了解后才了解到 hibernate 有 TypeDescriptor 的概念，而这里展示的参数也需要对应的 TypeDescriptor 支持才能展示出来。

```diff
  @Override
  public void nullSafeSet(PreparedStatement st, Object value, int index, SharedSessionContractImplementor session) throws HibernateException, SQLException {
    if (Objects.isNull(value)) {
      st.setNull(index, Types.VARCHAR);
      st.setNull(index + 1, Types.DECIMAL);
    } else {
      Money money = (Money) value;
      st.setString(index,money.getCurrencyUnit().getCode());
      st.setBigDecimal(index+1,money.getAmount());
+     session.remapSqlTypeDescriptor(new VarcharTypeDescriptor())
+         .getBinder(StringTypeDescriptor.INSTANCE)
+         .bind(st, ((Money) value).getCurrencyUnit().getCode(), index, session);
+     session.remapSqlTypeDescriptor(new DecimalTypeDescriptor())
+         .getBinder(BigDecimalTypeDescriptor.INSTANCE)
+         .bind(st, ((Money) value).getAmount(), index + 1, session);
    }
  }
```

通过如上代码可以添加 TypeDescriptor 支持，这样就可以展示出来了。

```
Hibernate: 
    update
        openbayes_deposits 
    set
        currency=?,
        amount=?,
        owner_id=?,
        price=? 
    where
        id=?
2022-03-14 23:16:50.547 TRACE 71555 --- [    Test worker] o.h.type.descriptor.sql.BasicBinder      : binding parameter [1] as [VARCHAR] - [USD]
2022-03-14 23:16:50.547 TRACE 71555 --- [    Test worker] o.h.type.descriptor.sql.BasicBinder      : binding parameter [2] as [DECIMAL] - [222.00]
2022-03-14 23:16:50.548 TRACE 71555 --- [    Test worker] o.h.type.descriptor.sql.BasicBinder      : binding parameter [3] as [VARCHAR] - [aisensiy]
2022-03-14 23:16:50.548 TRACE 71555 --- [    Test worker] o.h.type.descriptor.sql.BasicBinder      : binding parameter [4] as [INTEGER] - [111]
2022-03-14 23:16:50.548 TRACE 71555 --- [    Test worker] o.h.type.descriptor.sql.BasicBinder      : binding parameter [5] as [VARCHAR] - [13123]
```



