---
layout:     post
title:      "在 Spring Boot 1.5.3 中进行 Spring MVC 测试"
date:       2017-05-04 19:00:00 +08:00
author:     "Eisen"
tags:       [java, spring-boot, spring-mvc, web, test]
---

[上一篇文章]({% post_url 2017-05-03-spring-boot-get-started %}) 介绍了我从 Jersey 切换到 Spring Boot 的一些原因，虽然伴随着一些无奈，但是还是对 Spring Boot 充满了信心。但是在学习的过程中我也发现了一些问题。

首先，我发现 Spring Boot 的版本更迭非常的快，而不同的版本的很多语法和支持都有一定的区别，当遇到一个问题去 stackoverflow 搜索的时候经常会发现不同版本的解决方案，弄得我很是苦恼。（真是找到了用 npm 的感觉，每次升级包都会出问题。每到这个时候就念到了 rails 的好，一个成熟的、稳定、合理的生态体系是多么的重要！）。在这里我明确的在标题里提到了我所使用的版本 `1.5.3` 也希望 Spring Boot 在之后能够尽量的保持各个版本的一致性。

其次，Spring 官网提供了太多的 Getting Started 比如[这个](https://spring.io/guides/gs/rest-service/)或者是 Hello World 的示例。这些示例真的是太太太简单了，完全没办法作为学习的材料（再次强调，能不能看看人家 Rails 官方的 Guide 呀），而去其他地方搜索的内容又大多是过时（因为版本更迭快呀）的内容。所以我这里也希望尽量覆盖更全的场景，使得这里的内容可以作为实际开发中的参考。

>**注意** 这里所展示的测试的例子是对 RESTful API 的测试，众所周知，在前后端分离的今天，我们很少在 Spring MVC 中做模板的渲染了，我们主要处理的是 JSON 数据：我们的输入不是传统的表单数据而是 JSON，我们的输出不再是 HTML 而是 JSON。

测试的重要性在 ThoughtWorks 是老生常谈了，但实际上并不是所有的团队都会在写代码的同时写测试，在看到大量的 Spring Boot 的文章和代码的时候居然很难找到一个完整的、包含着测试的项目，真是恐怖。不过做了一些 search 之后我发现 Spring Boot 目前的测试真的是非常的简单，和 Jersey 比的话那真是好的太多了。一个基本的、纯粹的 Spring MVC 的测试长如下的样子，这里涉及多个例子，我会一点点做介绍。

```java
@RunWith(SpringRunner.class) // [1]
public class UsersApiTest {

    private UserRepository userRepository;

    @Before
    public void setUp() throws Exception {
        userRepository = mock(UserRepository.class);
        MockMvc mockMvc = MockMvcBuilders
                            .standaloneSetup(new UsersApi(userRepository))
                            .setControllerAdvice(new CustomizeExceptionHandler())
                            .build(); // [2]
        RestAssuredMockMvc.mockMvc(mockMvc); // [3]
    }

    @Test
    public void should_get_empty_user_lists_success() throws Exception {
        // [4]
        given().
        when().
            get("/users").
        then().
            statusCode(200);
    }

    @Test
    public void should_create_user_success() throws Exception {
        Map<String, Object> createUserParameter = new HashMap<String, Object>() {{
            put("username", "aisensiy");
        }};
        
        given() 
            .contentType("application/json")
            .body(createUserParameter)
            .when().post("/users")
            .then().statusCode(201);

        verify(userRepository).save(any()); 
    }

    @Test
    public void should_get_400_error_message_with_wrong_parameter_when_create_user() throws Exception {

        Map<String, Object> wrongParameter = new HashMap<String, Object>() {{
            put("name", "aisensiy");
        }};

        given()
            .contentType("application/json")
            .body(wrongParameter)
            .when().post("/users")
            .then().statusCode(400)
            .body("fieldErrors[0].field", equalTo("username")) // [5]
            .body("fieldErrors.size()", equalTo(1));
    }

    @Test
    public void should_get_one_user_success() throws Exception {
        User user = new User(UUID.randomUUID().toString(), "aisensiy");
        when(userRepository.findById(eq(user.getId())))
            .thenReturn(Optional.of(user));

        given()
            .standaloneSetup(new UserApi(userRepository)) 
            .when().get("/users/{userId}", user.getId()) // [6]
            .then().statusCode(200)
            .body("id", equalTo(user.getId()))
            .body("username", equalTo(user.getUsername()))
            .body("links.self", endsWith("/users/" + user.getId()));
    }
}
```

以上的代码包含了四个测试用例，测试内容如下：

1. `GET /users` 获取用户列表
2. `POST /users` 用合法的参数创建一个用户，返回创建成功
3. `POST /users` 用非法的参数创建一个用户，返回参数错误信息
4. `GET /users/{userId}` 获取单个用户的信息

下面我按照对代码中标注的点一个个做解释：

1. 老版本的 `SpringJUnit4ClassRunner` 被替换为更容易阅读的 `SpringRunner`，在 stackoverflow 中会找到大量的 `SpringJUnit4ClassRunner` 对我这种刚接触的人来说真是带来了很多的困惑。另外，我们在这里并没有使用一个 `SpringBootTest` 的注解，SpringBootTest 是只有需要一个比较完整的 Spring Boot 环境的时候（比如需要做集成测试，启动 `EmbeddedWebApplicationContext` 的时候）需要。而我们这里仅仅通过单元测试就可以完成任务了，这样的好处是可以大大提升测试的速度。
2. `MockMvcBuilders` 是 Spring MVC 提供的一个 mock 环境，使我们可以不启动 HTTP server 就能进行测试。这里我们通过 `standaloneSetup` 的方法创建我们要测试的 `UsersApi` 并且通过 `setControllerAdvice` 添加错误处理的机制。有关 `ControllerAdvice` 做异常处理的内容我们会在后面的文章中介绍。
3. 我们在 `build.gradle` 引入了 [rest assured](http://rest-assured.io/) 的两个包用于 json 的测试，我们通过这个语句将所创建的 mock mvc 提供给 rest assured。
4. 使用了 rest assured 的测试可读性大大的增强了，这里就是检查了请求所获取的 `status code`，实际的项目中可能需要做更详细的 json 内容的测试
5. `body("fieldErrors[0].field", equalTo("username"))` 这种直接读取 json path 的测试方式相对将 json 转化成 map 再一点点的读取字段来说真是方便的太多，有关这种测试的其他内容详见 [rest assured 官方文档](https://github.com/rest-assured/rest-assured/wiki/Usage)
6. 这里是一个包含动态 url 的例子，其使用方式和在 Spring MVC 中使用 `PathVariable` 类似

大多数情况下，通过 `standaloneSetup` 的方式就可以对 `Controller` 进行有效的单元测试了，当然 `MockMvcBuilders` 也可以引入外部的 `ControllerAdvice` 对错误处理进行测试。加上 *rest assured* 测试 json api 真是简单了太多了。不过这里并没有覆盖 filter 的测试，后面的有关安全的文章会补上。

最后附上项目所使用的 `build.gradle`，完整的项目内容可以在 [Github](https://github.com/aisensiy/demo-for-springmvc-and-mybatis) 找到。

```groovy
// build.gradle
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
apply plugin: 'org.springframework.boot'

version = '0.0.1-SNAPSHOT'
sourceCompatibility = 1.8

repositories {
    mavenCentral()
}


dependencies {
    compile('org.flywaydb:flyway-core')
    compile('org.mybatis.spring.boot:mybatis-spring-boot-starter:1.3.0')
    compile("org.springframework.boot:spring-boot-starter-hateoas")
    compile('org.springframework.boot:spring-boot-starter-web')
    runtime('com.h2database:h2')
    compileOnly('org.projectlombok:lombok')
    testCompile('org.springframework.boot:spring-boot-starter-test')
    testCompile('org.mybatis.spring.boot:mybatis-spring-boot-starter-test:1.3.0')
    testCompile 'io.rest-assured:rest-assured:3.0.2'
    testCompile 'io.rest-assured:spring-mock-mvc:3.0.2'
}
```
