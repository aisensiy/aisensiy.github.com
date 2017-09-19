---
layout:     post
title:      "Jackson 在 Spring Boot 中的使用小结 2"
date:       2017-09-19 14:33:00 +08:00
author:     "Eisen"
tags:       [java, spring, spring-boot, jackson, json]
---

[上一篇]({% post_url 2017-09-18-jackson-practices %})介绍了三个用于 jackson 自定义序列化的场景。这一篇继续介绍其他一些实践。同样，所有的代码都可以在[GitHub](https://github.com/aisensiy/demo-for-jackson)找到。

## 清理输入数据的外层包装（unwrap）

json api 不单单是数据的输出格式为 json 通常数据的输入（POSt 或者 PUT 的 request body）也是 json 格式。很多情况下会需要默认将输入的 json 数据以一个父级对象包裹。例如在 [realworld](https://github.com/gothinkster/realworld/tree/master/api) 项目的 api 规范中在创建一个 `article` 时，其输入的数据格式为：

```javascript
{
  "article": {
    "title": "How to train your dragon",
    "description": "Ever wonder how?",
    "body": "You have to believe",
    "tagList": ["reactjs", "angularjs", "dragons"]
  }
}
```

其真正的数据被 `article` 这个属性包裹起来了。而在实际使用的时候，如果每次都要去自行解包这个层次实在是不够优雅。好在 jackson 可以通过配置自动帮我们 unwrap 这里的对象，只需要在 `application.(yml|properties)` 增加一个配置：

    spring.jackson.deserialization.unwrap-root-value=true

比如我有一个这样的输入格式：

```
{
  "wrap": {
    "name": "name"
  }
}
```

为了对其自动解包，我们对要解析的对象提供相应的 `@JsonRootName` 即可:

```java
@JsonRootName("wrap")
public class WrapJson {
    private String name;

    public WrapJson(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    private WrapJson() {
    }

    ...
}
```

**但是，要注意这个配置是全局有效的，意味着一旦设置了之后所有的解析都会尝试将数据解包，即使没有提供 `@JsonRootName` 的注解，其依然会尝试使用类名称等方式去解包。因此，除了这个测试使用 `spring.jackson.deserialization.unwrap-root-value` 外默认关闭它**。

## 处理枚举类型

在 java 为了展示的方便，我们通常是需要将枚举按照字符串来处理的，jackson 默认也是这么做的。

`OrderStatus`:

```java
public enum OrderStatus {
    UNPAID, PREPARING, COMPLETED, CANCELED
}
```

`OrderWithStatus`:

```java
class OrderWithStatus {
    private OrderStatus status;
    private String id;

    public OrderWithStatus(OrderStatus status, String id) {
        this.status = status;
        this.id = id;
    }

    private OrderWithStatus() {

    }

    public OrderStatus getStatus() {
        return status;
    }

    public String getId() {
        return id;
    }

    ...
}

OrderWithStatus order = new OrderWithStatus(OrderStatus.UNPAID, "123");
```

对于 `order` 来说，其默认的序列化为：

```json
{
  "id": "123",
  "status": "UNPAID"
}
```

当然对其进行反序列化也是会成功的，这是处理枚举最简单的情况了，不过 jackson 还支持自定义的序列化与反序列化，比如如果我们需要将原有的枚举变成小写：

```json
{
  "id": "123",
  "status": "unpaid"
}
```

我们可以写自定义的 serializer 和 deserializer:

```java
@JsonSerialize(using = OrderStatusSerializer.class)
@JsonDeserialize(using = OrderStatusDeserializer.class)
public enum OrderStatus {
    UNPAID, PREPARING, COMPLETED, CANCELED;
}

public class OrderStatusSerializer extends StdSerializer<OrderStatus> {
    public OrderStatusSerializer(Class<OrderStatus> t) {
        super(t);
    }

    public OrderStatusSerializer() {
        super(OrderStatus.class);
    }

    @Override
    public void serialize(OrderStatus value, JsonGenerator gen, SerializerProvider provider) throws IOException {
        gen.writeString(value.toString().toLowerCase());
    }
}

public class OrderStatusDeserializer extends StdDeserializer<OrderStatus> {
    public OrderStatusDeserializer(Class<?> vc) {
        super(vc);
    }

    public OrderStatusDeserializer() {
        super(OrderStatus.class);
    }

    @Override
    public OrderStatus deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
        return OrderStatus.valueOf(p.getText().toUpperCase());
    }
}
```

处理使用自定义的反序列化外或者我们也可以提供一个包含 `@JsonCreator` 标注的构造函数进行自定义的反序列化，并用上一篇提到的 `@JsonValue` 进行序列化：

```java
public enum OrderStatus {
    UNPAID, PREPARING, COMPLETED, CANCELED;

    @JsonCreator
    public static OrderStatus fromValue(@JsonProperty("status") String value) {
        return valueOf(value.toUpperCase());
    }

    @JsonValue
    public String ofValue() {
        return this.toString().toLowerCase();
    }
}
```

`@JsonCreator` 有点像是 MyBatis 做映射的时候那个 `<constructor>` 它可以让你直接使用一个构造函数或者是静态工厂方法来构建这个对象，可以在这里做一些额外的初始化或者是默认值选定的工作，有了它在反序列化的时候就不需要那个很讨厌的默认的无参数构造函数了。

当然枚举的处理还有一些更诡异的方式，[这里](http://www.baeldung.com/jackson-serialize-enums)有讲解，我就不再赘述了。

## 对多态的支持

在 DDD 中有领域事件（domain event）的概念，有时候我们需要将这些事件保存下来。由于每一个事件的结构是千差万别的，不论是存储在关系型数据库还是 nosql 数据库，在将其序列化保存的时候我们需要保留其原有的类型信息以便在反序列化的时候将其解析为之前的类型。jackson 对这种多态有很好的支持。

```java
@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = UserCreatedEvent.class, name = "user_created"),
    @JsonSubTypes.Type(value = ArticleCreatedEvent.class, name = "article_created")
})
public abstract class Event {
}

@JsonTypeName("user_created")
class UserCreatedEvent extends Event {
}

@JsonTypeName("article_created")
class ArticleCreatedEvent extends Event {
}
```

其中 `@JsonTypeInfo` 定义类型信息以什么方式保留在 json 数据中，这里就是采用了 `type` 的属性。`@JsonSubTypes` 定义了一系列子类与类型的映射关系。最后 `@JsonTypeName` 为每一个子类型定义了其名称，与 `@JsonSubTypes` 相对应。

那么对于 `UserCreatedEvent` 和 `ArticleCreatedEvent` 类型，其解析的 json 如下：

```json
{
  "type": "user_created"
}
```

```json
{
  "type": "article_created"
}
```

## 使用 mixin

这是我非常喜欢的一个功能，第一次见到是在 [spring restbucks](https://github.com/olivergierke/spring-restbucks) 的例子里。它有点像是 ruby 里面的 mixin 的概念，就是在不修改已知类代码、甚至是不添加任何注释的前提下为其提供 jackson 序列化的一些设定。在两种场景下比较适用 mixin:

1. 你需要对一个外部库的类进行自定义的序列化和反序列化
2. 你希望自己的业务代码不包含一丝丝技术细节：写代码的时候很希望自己创建的业务类是 POJO，一个不需要继承自特定对象甚至是不需要特定技术注解的类，它强调的是一个业务信息而不是一个技术信息

这里就提供一个解析 `joda time` 的 mixin 的示例，它提供了一个 `DateTimeSerializer` 将 `joda.DateTime` 解析为 ISO 的格式。代码见[这里](https://github.com/gothinkster/spring-boot-realworld-example-app/blob/master/src/main/java/io/spring/JacksonCustomizations.java)。

```java
@Configuration
public class JacksonCustomizations {

    @Bean
    public Module realWorldModules() {
        return new RealWorldModules();
    }

    public static class RealWorldModules extends SimpleModule {
        public RealWorldModules() {
            addSerializer(DateTime.class, new DateTimeSerializer());
        }
    }

    public static class DateTimeSerializer extends StdSerializer<DateTime> {

        protected DateTimeSerializer() {
            super(DateTime.class);
        }

        @Override
        public void serialize(DateTime value, JsonGenerator gen, SerializerProvider provider) throws IOException {
            if (value == null) {
                gen.writeNull();
            } else {
                gen.writeString(ISODateTimeFormat.dateTime().withZoneUTC().print(value));
            }
        }
    }

}
```

## 其他

### @JsonPropertyOrder

```java
@JsonPropertyOrder({ "name", "id" })
public class MyBean {
    public int id;
    public String name;
}
```

按照其指定的顺序解析为：

```json
{
    "name":"My bean",
    "id":1
}
```

### 展示空数据的策略

有这么一个对象:

```java
User user = new User("123", "", "xu");
```

我们希望其任何为空的数据都不再显示，即其序列化结果为：

```json
{
  "id": "123",
  "last_name": "xu"
}
```

而不是

```json
{
  "id": "123",
  "first_name": "",
  "last_name": "xu"
}
```

当然，遇到 `null` 的时候也不希望出现这样的结果：

```json
{
  "id": "123",
  "first_name": null,
  "last_name": "xu"
}
```

为了达到这个效果我们可以为 `User.java` 提供 `@JsonInclude(JsonInclude.Include.NON_EMPTY)` 注解：

```java
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class User {
    private String id;
    @JsonProperty("first_name")
    private String firstName;
    @JsonProperty("last_name")
    private String lastName;

    public User(String id, String firstName, String lastName) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getId() {
        return id;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }
}
```

除了 `NON_EMPTY` 还有很多其他的配置可以使用。

如果希望这个策略在我们的整个应用中都起效（而不是单个类）我们可以在 `application.properties | application.yml` 做配置：

    spring.jackson.default-property-inclusion=non_empty

### 自定义标注

如果一个注解的组合频繁出现在我们的项目中，我们可以通过 `@JacksonAnnotationsInside` 将其打包使用：

```java
@Retention(RetentionPolicy.RUNTIME)
@JacksonAnnotationsInside
@JsonInclude(Include.NON_NULL)
@JsonPropertyOrder({ "name", "id", "dateCreated" })
public @interface CustomAnnotation {}

@CustomAnnotation
public class BeanWithCustomAnnotation {
    public int id;
    public String name;
    public Date dateCreated;
}

BeanWithCustomAnnotation bean 
      = new BeanWithCustomAnnotation(1, "My bean", null);
```

对于对象 `bean` 来说，其解析结果为

```json
{
    "name":"My bean",
    "id":1
}
```

## 相关资料

* [Jackson Annotation Examples](http://www.baeldung.com/jackson-annotations)
* [Jackson Annotation document](https://github.com/FasterXML/jackson-annotations)
* [How To Serialize Enums as JSON Objects with Jackson](http://www.baeldung.com/jackson-serialize-enums)
* [spring restbucks](https://github.com/olivergierke/spring-restbucks)
* [mixin code](https://github.com/gothinkster/spring-boot-realworld-example-app/blob/master/src/main/java/io/spring/JacksonCustomizations.java)
