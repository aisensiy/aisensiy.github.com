---
layout:     post
title:      "Jackson 在 Spring Boot 中的使用小结 1"
date:       2017-09-18 17:59:00 +08:00
author:     "Eisen"
tags:       [java, spring, springboot, jackson, json]
---

Json 数据格式由于其和 js 的亲密性等原因，目前算是比较主流的数据传输格式。Spring Boot 也默认集成了 jackson 用于 `application/json` 格式的序列化与反序列化，在写这种 restful json api 的时候势必会需要使用其 api（尤其是它所支持的注解）对输入输出的数据进行各种各样的修改和加工。这里总结了一些常见到的场景、应对的方法并提供了一些额外的学习资料，写着写着发现内容还有点点多，先完成了序列化中的三个情况，后面的博客再补充。

所有的代码可以在[GitHub](https://github.com/aisensiy/demo-for-jackson)找到。

## 样例的形式

和之前的博客类似，这次也是单独创建了一个用于演示的项目，然后通过测试的形式展示项目。在演示 jackson 时，为了方便测试，我们都将提供一个期望的 json 文件进行比对：

```java
public class NormalJavaClass {
    private String name;
    private int number;

    public NormalJavaClass(String name, int number) {
        this.name = name;
        this.number = number;
    }

    public String getName() {
        return name;
    }

    public int getNumber() {
        return number;
    }
}

@RunWith(SpringRunner.class)
@JsonTest
public class NormalJavaClassTest {
    @Autowired
    private JacksonTester<NormalJavaClass> json;
    private NormalJavaClass obj;

    @Before
    public void setUp() throws Exception {
        obj = new NormalJavaClass("aisensiy", 18);
    }

    @Test
    public void should_serialize_success() throws Exception {
        assertThat(this.json.write(obj)).isEqualToJson("normaljavaclass.json");
    }
}
```

其中 `normaljavaclass.json` 为:

```json
{
  "number": 18,
  "name": "aisensiy"
}
```

后面为了简洁，就不再展示这种不必要的测试了，仅仅展示最终的 json 文件。

## 驼峰格式变下划线格式

`User.java`:

```java
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

为了将其属性 `firstName` 和 `lastName` 在展示时从驼峰式转换为下划线分割，可以对需要转换的属性上配置 `@JsonProperty("<the_underscoe_version_name>")`，其序列化结果为：

```json
{
  "id": "123",
  "first_name": "eisen",
  "last_name": "xu"
}
```

当然，spring boot 中还可以通过对 jackson 对配置实现驼峰到下划线格式的转换，需要在 `application.properties` 中增加一个 jackson 的配置：

    spring.jackson.property-naming-strategy=CAMEL_CASE_TO_LOWER_CASE_WITH_UNDERSCORES

对于 `CamelExample` 这样的类

```java
public class CamelExample {
    private String aVeryLongCamelCaseName;

    public CamelExample(String aVeryLongCamelCaseName) {
        this.aVeryLongCamelCaseName = aVeryLongCamelCaseName;
    }

    public String getaVeryLongCamelCaseName() {
        return aVeryLongCamelCaseName;
    }
}
```

就会匹配如下的 json 文件：

```json
{
  "a_very_long_camel_case_name": "test"
}
```

## 用单一值作为值对象的序列化结果

DDD 中提倡使用 Value Object，那么项目中可能会出现以下这样的类：

```java
public class UserWithEmail {
    private String username;
    private Email email;

    public UserWithEmail(String username, Email email) {
        this.username = username;
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public Email getEmail() {
        return email;
    }
}
```

其中 `Email` 是一个 Value Object 它有 `username` 和 `domain` 两个属性。

在序列化的时候，我们其实不需要 `username` + `domain` 的组合，我们想要的就是 `username@domain` 的样子。这个时候，我们可以用 `@JsonValue` 注解：

```java
public class Email {
    private String username;
    private String domain;

    public Email(String value) {
        if (value == null) {
            throw new IllegalArgumentException();
        }

        String[] splits = value.split("@");
        if (splits.length != 2) {
            throw new IllegalArgumentException();
        }
        username = splits[0];
        domain = splits[1];
    }

    @JsonValue
    @Override
    public String toString() {
        return String.format("%s@%s", username, domain);
    }

    public String getUsername() {
        return username;
    }

    public String getDomain() {
        return domain;
    }
}
```

它的意思就是在序列化这个对象的时候采用标有 `JsonValue` 的方法的值作为其序列化的结果。

当然，另外一个比较通用的办法就是采用自定义的序列化器：

`Address`:

```java
@JsonSerialize(using = AddressSerializer.class)
public class Address {
    private String City;
    private String Country;

    public Address(String city, String country) {
        City = city;
        Country = country;
    }

    public String getCity() {
        return City;
    }

    public String getCountry() {
        return Country;
    }
}
```

`AddressSerializer`:

```java
public class AddressSerializer extends StdSerializer<Address> {

    public AddressSerializer() {
        this(Address.class);
    }

    public AddressSerializer(Class<Address> t) {
        super(t);
    }

    @Override
    public void serialize(Address value, JsonGenerator gen, SerializerProvider provider) throws IOException {
        gen.writeString(String.format("%s, %s", value.getCity(), value.getCountry()));
    }
}
```

要序列化的类：

```java
public class UserWithAddress {
    private String username;
    private Address address;

    public UserWithAddress(String username, Address address) {
        this.username = username;
        this.address = address;
    }

    public String getUsername() {
        return username;
    }

    public Address getAddress() {
        return address;
    }
}
```

其序列化的结果为：

```json
{
  "username": "test",
  "address": "Beijing, China"
}
```

## 提升内嵌属性的层级

如果所提供的 rest json api 需要支持 hypermedia 那么就需要将通过 GET 获取的暴露给外部的资源的状态迁移以链接的形式提供出来。这个时候在我们 API 的内部实现时需要将从数据库中查询的 Data Object 再次用一个修饰类包装（如在 spring-hateoas 中就提供了一个 `Resource` 的修饰器用于处理这种情况）并为其提供额外的状态迁移链接：

```java
public class Resource<T> {
    private T content;

    private Map<String, URI> links = new TreeMap<>();

	...

    public T getContent() {
        return content;
    }

    public Map<String, URI> getLinks() {
        return Collections.unmodifiableMap(links);
    }
}
```

但是这样会有一个问题：原有的 Data Object 成为了 Resource 类中的一个属性。其默认的序列化会成为这个样子：

```json
{
  "content": {
    "property1": "xxx",
    "property2": "xxx",
    ...
  },
  "links": {
    "self": "xxx",
    ...
  }
}
```

我们不希望这样的代理模式导致原有的对象数据层级下降到 `content` 中，这里可以采用 `@JsonUnwrapped` 注解：

```java
public class Resource<T> {
    private T content;

    private Map<String, URL> links = new TreeMap<>();

	...

    @JsonUnwrapped
    public T getContent() {
        return content;
    }

    public Map<String, URL> getLinks() {
        return Collections.unmodifiableMap(links);
    }
}
```

对之前的 User 进行包裹：

```java
User user = new User("123", "eisen", "xu");
Link link = new Link(
    "self",
    UriComponentsBuilder.newInstance()
        .scheme("http").host("localhost")
        .path("/users/{id}")
        .buildAndExpand(user.getId()).toUri());
userResource = new Resource<>(user, link);
```

其序列化的结果为：

```json
{
  "id": "123",
  "first_name": "eisen",
  "last_name": "xu",
  "links": {
    "self": "http://localhost/users/123"
  }
}
```

## 相关资料

* [Jackson Annotation Examples](https://www.baeldung.com/jackson-annotations)
* [Jackson Annotation document](https://github.com/FasterXML/jackson-annotations)
* [spring hateoas](https://github.com/spring-projects/spring-hateoas/)
