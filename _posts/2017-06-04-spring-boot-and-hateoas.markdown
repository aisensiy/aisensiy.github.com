---
layout:     post
title:      "在 Spring Boot 中使用 HATEOAS"
date:       2017-06-04 10:00:00 +08:00
author:     "Eisen"
tags:       [java, springboot, spring-mvc, hateoas]
---

HATEOAS, Hypermedia as the Engine of Application State, 可以被简单的理解为为 REST API 中的 Resource 提供必要的链接，对，就像是 HTML 页面上的链接。我们在访问一个 web 站点的时候从来没有说要看一个说明文档并在其中找到我们所需要的资源的 URI，而是通过一个入口页面（当然，搜索引擎也提供了入口）所包含的链接，一步一步找到我们想要的内容。HATEOAS 是 REST 架构风格重要的组成部分，然而对于现在的诸多 REST 接口中却并没有它的身影。它被 [Richardson Maturity Model](http://martinfowler.com/articles/richardsonMaturityModel.html) 定义为 REST 的最终形态。

## HATEOAS 的优势

然而，使用 HATEOAS 可以带来什么样子的好处呢。从我自身的感受有以下两个方面。

### 1. 协议解耦

既然是 RESTful API 那么其用户一般来说不是写这个 API 的人，比如前端，比如其他的服务提供者。为了尽量避免不必要的资源浪费，需要他们之间协调一致。这个时候 RESTful API 的接口设计就显得尤为重要了：如何快速达成一致并保证其接口的稳定是项目快速进展的重要前提。

通常的做法是通过文档定义接口的路径、动作、Payload 等内容。然后，这个文档就成了多个人或者是多个人之间的一个协议：想要做任何的修改都需要多方达成一致。并且，事无巨细的打成一直：路径、动作、Payload。不过 RESTful API 就是在规约方法和动作了：路径是资源的名称、资源的状态，动作是 `GET` `PUT` `POST` `DELETE` 的其中之一。而支持 HATEOAS 的 REST API 则更进一步，将路径转换为行为以进一步增加 REST API 自身的灵活性，尽量少让后端的接口定义与其他系统形成耦合。这样做之后，API 就可以有一个逐条定义的，非常琐碎的契约变成了一个可发现式的契约。

这里引用一个在 [DDD & REST](https://speakerdeck.com/olivergierke/domain-driven-design-and-rest) 的一个例子：

![](/img/in-post/spring-boot-hateoas/raw-url-protocol.png)

![](/img/in-post/spring-boot-hateoas/semantic-protocol.png)

当然，探索式的 API 的问题在于原来一个步骤能完成的事情可能会变成多个步骤：从入口找到资源，再从资源中获取链接。

### 2. Passive View

[Passive View](https://martinfowler.com/eaaDev/PassiveScreen.html) 是以前后端渲染的 MVC 中 View 的一种实现方式。它强调 

>A screen and components with all application specific behavior extracted into a controller so that the widgets have their state controlled entirely by controller.

也就是说 View 仅仅负责数据的展示。任何业务逻辑都不应该在前端展示，因为一方面前端有可能会被跳过（比如我直接用 curl 去访问后端 API），另一方面，面对多个前端的时候会存在重复的代码，当业务逻辑需要修改也会是沉重的负担。这里先列举把后端逻辑暴露给前端的情况

1. 数据验证逻辑，比如哪些字段必须是唯一的，那些数据是必选的
2. 对后端发送请求的 payload 格式、路径、方法，比如创建一个订单时提交订单的数据格式
3. 对不同用户访问相同资源时的权限差异，比如论坛系统中，只有管理员才能删除帖子，而对于普通用户就不应当出现删除的按钮
4. 相同资源在不同状态下的不同的状态迁移方法，比如订单系统中，只有未付款的订单才需要支付的链接
5. 对返回数据的格式的依赖

其中想要对 1 2 解耦需要后端提供一个表单验证的 schema 我觉得将来还是可以解决的，但是目前没见到谁在做。5 的格式本来就存在于 API 返回的结果之中，不辩自明，所以称不上耦合。3 4 涉及了权限以及资源本身的状态迁移，是很难做到解耦的：需要前端知道资源的权限和状态迁移的方向。而 HATEOAS 恰好解决了这个问题：通过提供或者不提供向某个状态迁移的链接来表示当前用户是否有权限这么做。

## 在 Spring Boot 实现 HATEOAS

HATEOAS 的实现，有几个比较典型的场景。我们结合代码介绍都要怎么做。不过首先先放上 `gradle` 项目的 `build.gradle` 文件：

```groovy
buildscript {
	ext {
		springBootVersion = '1.5.3.RELEASE'
	}
	repositories {
		mavenCentral()
	}
	dependencies {
		classpath("org.springframework.boot:spring-boot-gradle-plugin:${springBootVersion}")
	}
}

apply plugin: 'java'
apply plugin: 'eclipse'
apply plugin: 'idea'
apply plugin: 'org.springframework.boot'

version = '0.0.1-SNAPSHOT'
sourceCompatibility = 1.8

repositories {
	mavenCentral()
}


dependencies {
	compile('org.springframework.boot:spring-boot-starter-hateoas')
	compile('org.springframework.boot:spring-boot-starter-web')
	compile('org.atteo:evo-inflector:1.2.2')
	runtime('org.springframework.boot:spring-boot-devtools')
	compileOnly('org.projectlombok:lombok')
	testCompile('org.springframework.boot:spring-boot-starter-test')
	testCompile 'io.rest-assured:rest-assured:3.0.2'
	testCompile 'io.rest-assured:spring-mock-mvc:3.0.2'
}

```

可以看到，这里引入了 spring boot 的 `hateoas` 的依赖。

### 1. 最基本的，包装数据，为其提供链接

还有以 spring boot 中 Greeting 的对象为例，我们首先定义一个数据对象:

```java
public class Greeting {
    private String content;

    public Greeting(String content) {
        this.content = content;
    }
}
```

然后有一个 API 可以访问到它：

```java
@RequestMapping("greeting")
@RestController
public class GreetingApi {
    private static final String TEMPLATE = "Hello, %s";

    @GetMapping
    public GreetingResource getGreeting(
        @RequestParam(value = "name", defaultValue = "World") String name) {
        GreetingResource resource = new GreetingResource(
            new Greeting(String.format(TEMPLATE, name))); // 1
        resource.add(
            linkTo(methodOn(GreetingApi.class).getGreeting(name)).withSelfRel()); // 2
        return resource;
    }
}
```

可以看到

1. 用 `GreetingResource` 对原始的 `Greeting` 对象进行了包装。
2. 通过 `linkTo` 方法，添加了一个 `self` link

该请求所获取的结果如下：

```javascript
{
    "content": "Hello, World",
    "_links": {
        "self": {
            "href": "http://localhost/greeting?name=World"
        }
    }
}
```

其中 `GreetingResource` 如下：

```java
class GreetingResource extends Resource<Greeting> {
    private Greeting greeting;

    public GreetingResource(Greeting content) {
        super(content);
    }
}
```

通过继承自 spring hateoas 所提供的 `Resource<T>` `GreetingResource` 默认将 `Greeting` 的 Get 方法都实现了。所以，上面的返回结果中会出现 `content` 字段。

### 2. 依据当前资源的状态，提供不同的链接

这里，我们有一个 Order 对象，对于其 Status 的不同，需要提供不同的 link

```java
@Getter
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class Order {
    private String id;
    private Status status;
    private List<LineItem> items;

    public Order(String id, List<LineItem> items) {
        this.id = id;
        this.items = items;
        status = Status.CREATED;
    }

    public void pay() {
        if (status != Status.CREATED) {
            throw new IllegalStateException("Only new order can be paid");
        }
        this.status = Status.PAID;
    }

    public boolean paid() {
        return status == Status.PAID;
    }

    @Value
    public static class LineItem {
        private String productId;
        private double price;
        private int amount;
    }

    public enum Status {
        CREATED, PAID, CANCELLED, FINISHED
    }
}
```

我们可以在 `OrderResource` 的构造函数中做手脚：

```java
public class OrderResource extends Resource<Order> {
    public OrderResource(Order order) {
        super(order);

        this.add(
            linkTo(methodOn(OrderApi.class).orderResource(order.getId()))
                .withSelfRel());

        if (!order.paid()) {
            this.add(
                linkTo(methodOn(OrderApi.class).pay(order.getId()))
                    .withRel("payment"));
        }
    }
}
```

当然，在 controller 中将 link 传入构造函数也是可行的，那样的好处是将 Controller 的信息都留在了 Controller，但是不好的地方在于 Resource 这个对象实在是有点贫血，然后 controller 就变得庞大了一些。对其的测试就不在这里展示了。

### 3. 处理集合

除了 `Resource<T>` spring hateoas 还有一个 `Resources<T>` 用于处理集合：

```java
@GetMapping
public ResponseEntity<?> all() {
    Resources<OrderResource> resources = new Resources<>(
        orderRepository
            .all()
            .stream()
            .map(OrderResource::new)
            .collect(Collectors.toList()));
    resources.add(linkTo(methodOn(OrderApi.class).all()).withSelfRel());
    return ResponseEntity.ok(resources);
}
```

其结果是这个样子的：

```javascript
{
    "_embedded": {
        "orders": [ // 1
            {
                "id": "123",
                "status": "CREATED",
                "items": [
                    {
                        "productId": "product1",
                        "price": 1.22,
                        "amount": 1
                    }
                ],
                "_links": {
                    "self": {
                        "href": "http://localhost/orders/123"
                    },
                    "payment": {
                        "href": "http://localhost/orders/123/payment"
                    }
                }
            }
        ]
    },
    "_links": {
        "self": {
            "href": "http://localhost/orders"
        }
    }
}
```

1. 资源 order 被默默转变为了 `orders` 这是因为在 `build.gradle` 中添加了 `compile('org.atteo:evo-inflector:1.2.2')` 它可以帮助我们为集合提供英文复数的转换。如果你感兴趣可以尝试一下把这个依赖删除后会是神马样子。

完整的代码见 [Github](https://github.com/aisensiy/demo-for-spring-boot-hateoas)

## 相关资料

* [DDD & REST](https://speakerdeck.com/olivergierke/domain-driven-design-and-rest)
* [Passive View](https://martinfowler.com/eaaDev/PassiveScreen.html)
* [Understanding HATEOAS](https://spring.io/understanding/HATEOAS)
* [Building a Hypermedia-Driven RESTful Web Service](https://spring.io/guides/gs/rest-hateoas/)
* [The Benefits of Hypermedia APIs](http://olivergierke.de/2016/04/benefits-of-hypermedia/)
