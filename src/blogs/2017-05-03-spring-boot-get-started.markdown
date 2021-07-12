---
layout:     post
title:      "Spring Boot Getting Started"
date:       2017-05-03
author:     "Eisen"
tags:       [java, springboot, jersey, web]
---

前一阵子去了联想的项目去做性能调优，顺便也正儿八经的接触了一下 spring boot 的体系（当然也使用了很多 spring cloud 的内容，这个以后再讲）。这里简单的对比一下它和我之前主要使用的 jersey 体系，讲一下我看到的它们两者之间的差异以及 spring boot 相比 jersey 的一些优势和个别的不足。

再次回到 `spring` 的主题也是感慨万千，这让我想起来本科时候刚开始接触 web 开发的情况。那时候 `spring + hibernate + structs` 是 web 开发的主流框架。不过鉴于当时我自己水平有限，`spring` 的水平基本上提留在了 `Spring in Action` 前三章的水平。在经历了 PHP Python（Django），ruby（Rails），Jersey 之后又能回到 Spring 不得不说 Pivotal 旗下的 Spring 团队功不可没。Spring boot 自己的 Reference 所说的，Spring boot 给了开发者一个很好的 getting started 的体验并且并且了大量 xml 配置的实现方式，本来我以为之前我所看到的如此简洁的 `main` 只是因为是 demo 但是当我看到联想这边的生产代码也依然优雅的时候敬畏之心油然而生。

## spring 拥有完备的生态体系

目前来看 Spring 的体系非常的完备，一方面其核心 DI 和 AOP 组件本来就是 java 语言的标配，再加上与各种持久化框架、模板引擎的完美整合已经称得上包罗万象。另一方面，微服务架构逐渐成为主流的今天，spring cloud 体系的构建也非常的及时，大量的组件解决了云环境、微服务的诸多问题。与 spring  强大的生态相比，jersey 作为一个纯粹的 web framework 来说实在是太无力了，并且其与其他模块的组合也显得捉襟见肘。jersey 自己采用一个叫做 `hk2` 的依赖注入框架，它用起来并不那么方便，在之前的多个项目中，我们甚至需要把 hk2 和 guava 的容器建立一个 bridge 才能让它们一起工作，需要大量的模板代码，我曾经试图把之前遗留的模板代码进行重构但由于担心影响到生产环境的稳定性最终还是放弃了。

## Jersey 的 sub resource

当时和 Jersey 相比，Spring MVC 绝对是 spring 体系中的一个弱势。Jersey 实现了 `JAX-RS` 的标准，很明显这套标注的实现比 Spring MVC 的要好用，并且 jersey 中有一个非常重要的概念：sub resource，它允许一个 `url` 进行链式解析。比如下面的 url:

    /users/1234/posts/123
    
可以理解为用户 `1234` 的 id 为 `123` 的文章。在 jersey 中，我们可以用一下的方式实现：


```java

//UsersApi.java
@Path("users") // [1]
public class UsersApi {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<User> getUsers(@Context UserRepository users) {
        return users.getAll();
    }
    
    @GET
    @Path("{userId}")
    public String getOneUserById(@PathParam("userId") String userId, 
                                 @Context UserRepository userRepository) {
        return userRepository.getUserById(userId)
                            .map(UserApi::new)   // [2] 
                            .orElseThrow(() -> new UserNotFoundException()); // [3]
    }
}

//UserApi.java
public class UserApi { 
    private User user;

    public UserApi(User user) {
        this.user = user;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public User getUser() {
        return user;
    }

    @Path("posts")
    public UserEvaluationsApi userEvaluationsApi() {
        return new UserPostsApi(user);
    }
}

//UserPostsApi.java
@Path("projects")
public class UserPostsApi.java {
    @Path("{postId}")
    public ProjectApi getPostApi(@PathParam("postId") String postId,
                                 @Context PostRepository postRepository) {
        return postRepository
                .findById(postId)
                    .map(UserPostApi::new)
                    .orElseThrow(() -> new PostNotFoundException();
    }
}

//UserPostApi.java
public class UserPostApi.java {
    private Post post;
    
    public UserPostApi(Post post) {
        this.post = post;
    }
     
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Post getPost() {
        return post;
    }
}
```

如上所示，四个类 `UsersApi` `UserApi` `UserPostsApi` `UserPostApi` 将整个流程切分成了四块，每个流程按照 url 逐步解析，其中：

1. `UsersApi` 为入口（EntryPoint），只有它拥有类级别的 `@Path`
2. 当需要进行下一步的 url 处理时，可以主动创建 sub resource
3. 如果当前层次报错，则可以终止 url 的处理

而 Spring MVC 则完全不支持这样的方式，和大多数 mvc 框架一样，它只能老老实实的按照 pattern 对整个 url 解析，不论是在处理 `/users/123` 还是处理 `/users/123/posts/1234` 都需要捕捉 `UserNotFoundException` 的异常。

```java

// UsersApi.java
@RestController
@RequestMapping("/users")
public class UsersApi {
    private UserRepository userRepository;

    @Autowired
    public UsersApi(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @RequestMapping(method = GET)
    public List<User> getUsers() {
        return userRepository.findAll();
    }
}

// UserApi.java
@RestController
@RequestMapping("/users/{userId}")
public class UserApi {
    @Autowired
    private UserRepository userRepository;
    
    @RequestMapping(method = GET)
    return User getUser(@PathVariable("userId") String userId) {
        return userRepository.getUserById(userId)
                    .map(user -> user)
                    .orElseThrow(() -> new UserNotFoundException());
    }
}

// UserPostsApi.java
@RestController
@RequestMapping("/users/{userId}/posts")
public class UserPostsApi {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PostRepository postRepository;
    
    @RequestMapping("/{postId}", method = GET)
    return Post getPost(@PathVariable("userId") String userId,
                        @PathVariable("postId") String postId) {
        if (!userRepository.getUserById(userId).isPresent()) {
            throw new UserNotFoundException();
        }
        return postRepository
                .findById(postId)
                    .map(post -> post)
                    .orElseThrow(() -> new PostNotFoundException();
    }
}
```

## 将 jersey 和 spring boot 整合的尝试

前面已经提到了 spring 可以和很多其他的框架完美的结合，那么能不能让 jersey 和 spring boot 完美的结合在一起呢？这样的话既拥有了 spring boot 又能拥有 jersey 的 sub resource 的构建方式，一举两得呀。但现实给我泼了桶冷水。

首先，Jersey 自成体系，想要和其他框架结合会产生一定的工程摩擦。Spring mvc 和 spring core 自然是很好的集成了的，但是 jersey 中自己的那个 hk2 依赖注入框架和 spring 就不能那么好的相处了。使用的时候只能将其全部换成 spring 的依赖注入方式。同时 spring mvc 有一个 mock mvc 测试体系，它大大加速的测试的速度，然而它仅仅支持 spring mvc。并且到目前为止，我都没有找到任何一个很好的测试 jersey 的方式，其自身的测试框架在 spring 体系下的结合实例我就没见到过，而其他 mock 的支持也没走通过。

另一方面，spring 体系中 spring mvc 虽然在我看起来还是有很多的缺点，但是它遵循的是大量 web 框架的模式，比如 django 的 [url dispatcher](https://docs.djangoproject.com/en/1.11/topics/http/urls/) 比如 rails 的 [routes](http://guides.rubyonrails.org/routing.html) 都是类似的 url 映射模式。Spring MVC 同样是沿着 web 的发展趋势一路走来，作为一个历史悠久的框架自然也继承了大多数 web MVC 的特点，也应该会被更多的人所接受，实在是无可厚非。所以，我不知道我自己坚持使用 jersey 是不是会给项目中其他成员带来伤害。


如下所示，jersey 的测试需要将整个 server 启动，采用 `RANDOM_PORT` 的方式进行测试。

```java
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class UsersApiTest {

    @Value("${local.server.port}")
    int port;

    @MockBean
    UserRepository userRepository;

    @Before
    public void setUp() throws Exception {
        RestAssured.port = port;
    }

    @Test
    public void should_get_empty_user_lists() throws Exception {
        when(userRepository.getAll()).thenReturn(Arrays.asList(new User("123", "aisensiy")));
        io.restassured.RestAssured.when()
            .get("/users")
            .then()
            .statusCode(200);
    }
}

```

而 spring mvc 的测试则可以使用 mock mvc 测试速度快，并且支持 `standaloneSetup` 模式，对单个 controller 进行测试。

```java
@RunWith(SpringRunner.class)
public class UsersApiTest {

    private UserRepository userRepository;

    @Before
    public void setUp() throws Exception {
        userRepository = mock(UserRepository.class);
        // 只对 UsersApi 进行测试
        MockMvc mockMvc = MockMvcBuilders
                            .standaloneSetup(new UsersApi(userRepository))
                            .setControllerAdvice(new CustomizeExceptionHandler()).build(); 
        RestAssuredMockMvc.mockMvc(mockMvc);
    }

    @Test
    public void should_get_empty_user_lists_success() throws Exception {
        given().
        when().
            get("/users").
        then().
            statusCode(200);
    }
}
```

当然，优雅的测试是重头戏，后面的文章中会介绍一些我自己发觉的测试的模式。


## 参考

* [Spring Web MVC framework](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/mvc.html)
* [工程摩擦力 engineering friction](https://www.thoughtworks.com/radar)
* [Jersey Test Framework](https://jersey.java.net/documentation/latest/test-framework.html)
* [Jersey Resources and Sub-Resources](https://jersey.java.net/documentation/latest/jaxrs-resources.html)
* [Django url dispatcher](https://docs.djangoproject.com/en/1.11/topics/http/urls/)
* [Rails routes](http://guides.rubyonrails.org/routing.html)
* [HK2](https://hk2.java.net/)
