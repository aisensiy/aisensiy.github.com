---
layout:     post
title:      "在用 Spring MVC 构建 RESTful API 时进行验证和异常处理"
date:       2017-05-07 02:00:00 +08:00
author:     "Eisen"
tags:       [java, springboot, spring-mvc, web, validation]
---

这一部分介绍一下我发现的在 Spring MVC 下进行输入处理以及验证信息反馈方面的一些思路。完整的示例代码见 [GitHub](https://github.com/aisensiy/demo-for-springmvc-and-mybatis)。

# 区别请求对象和实体对象

目前我所构建的 spring boot 的服务都是 REST 风格的 API 了，很多时候处理的都是 json 的数据。在获取的 HTTP 请求中，BODY 中所传的也都不再是表单而是一个 json 了。看了很多的例子发现在 demo 中喜欢直接把输入转化成一个实体对象。比如我要注册用户，那么我就直接把请求中的 json 映射成一个 `User`，多方便。但是很明显，它只能处理简单的情况，强行使用容易把真正的业务实体中加入很多诡异的功能，比如什么 `password confirm`，这都是以前很多代码中会出现的。实际上就算是处理表单型的数据，也早就有了 [form object](https://robots.thoughtbot.com/activemodel-form-objects) 的概念了，不能够说换成 json 就倒回去吧，说白了这依然是个表单而已。



# 区别表单验证和业务逻辑验证

有输入就要有验证，表单验证一直是一个非常蛋疼的问题，一方面它有很多内容很无聊，比如检查非空呀，控制输入的类型呀，判断长度呀，需要一个标准的方法避免这种重复的代码。另一方面，有的时候验证中又存在业务逻辑，那到底把这个验证放到哪里以及用神马方法验证都是一个很容易让人犹豫不决的事情。

要解决这个，最好的办法就是明确的区分那种和业务逻辑关系不大的格式的验证以及业务逻辑中的验证。对于长度、必选、枚举、是不是电子邮箱、是不是 URL 用 [Bean Validation](https://beanvalidation.org/1.0/spec/) 解决。对于有关业务逻辑的，比如是不是合法的产品型号、是不是重复的注册名等都在 Controller 中进行处理。下面分别对两种验证方式进行说明。

## 1. Bean Validation 异常处理

Spring MVC 中对异常的处理基本都是在 Controller 中抛出一个具体的 Runtime 异常（比如 `ProductNotFoundException`，然后通过 ExceptionHandler 的方式去捕捉并转换为具体的报错请求。具体的示例见[这里](https://spring.io/blog/2013/11/01/exception-handling-in-spring-mvc)，我就不再重复了，我们在这里会使用 `ControllerAdvice` 的方式处理这种比较通用的情况，对于某些特殊处理的情况在 Controller 加 `ExceptionHandler` 即可。这里想强调的是如何把一个报错转化成一个格式良好的、便于 RESTful API 消费方处理的 JSON 的。

首先，有一个 `UsersApi` 用于创建用户的方法:

```java
@RestController
@RequestMapping("/users")
public class UsersApi {
    private UserRepository userRepository;

    @Autowired
    public UsersApi(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @RequestMapping(method = POST)
    public ResponseEntity createUser(@Valid @RequestBody CreateUser createUser, 
                                     BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            throw new InvalidRequestException("Error in create user", bindingResult);
        }
        User user = new User(UUID.randomUUID().toString(), createUser.getUsername());
        userRepository.save(user);
        return new ResponseEntity(HttpStatus.CREATED);
    }
}
```

可以看到，上面的 `createUser` 方法中，有两个参数 `CreateUser` 和 `BindingResult`。其中 `CreateUser` 是一个 `Form Object` 用于处理创建用户的输入，它通过 Bean Validation 的方式定义输入的一些要求，通过 `@Valid` 的注解可是让 java 自动帮我们进行表单验证，表单验证的结果就被放在 `BindingResult` 中了。**在这里处理报错的好处在于可以附上在当前 Controller 中特有的 message (Error in create user)**。`CreateUser` 类如下所示。

```java
@Getter // lombok 注解
public class CreateUser {
    @NotBlank // hibernate.validator 注解
    private String username;
}
```

接着，我们有一个测试用例覆盖错误输入的情况。可以看到 `should_400_with_wrong_parameter` 通过 `rest assured` 方法对我们想要获得的结果格式进行了测试，`setUp` 方法以及 rest assured 内容见 [在 Spring Boot 1.5.3 中进行 Spring MVC 测试](/spring-mvc-and-test)。

```java
@RunWith(SpringRunner.class)
public class UsersApiTest {

    private UserRepository userRepository;

    @Before
    public void setUp() throws Exception {
        userRepository = mock(UserRepository.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new UsersApi(userRepository))
                                         .setControllerAdvice(
                                             new CustomizeExceptionHandler()).build();
        RestAssuredMockMvc.mockMvc(mockMvc);
    }

    @Test
    public void should_400_with_wrong_parameter() throws Exception {

        Map<String, Object> wrongParameter = new HashMap<String, Object>() {{
            put("name", "aisensiy");
        }};

        given()
            .contentType("application/json")
            .body(wrongParameter)
            .when().post("/users")
            .then().statusCode(400)
            .body("fieldErrors[0].field", equalTo("username"))
            .body("fieldErrors.size()", equalTo(1));
    }
}
```

错误情况下 Api 的 Response 大概是这个样子：

```javascript
{
    "code": "InvalidRequest",
    "message": "Error in create user",
    "fieldErrors": [
        {
            "resource": "createUser", 
            "field": "username", 
            "code": "NotBlank",
            "message": "may not be empty"
        }
    ]
}
```

这里我们重点看 `InvalidRequestException` 的处理。

```java
@RestControllerAdvice
public class CustomizeExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler({InvalidRequestException.class})
    public ResponseEntity<Object> handleInvalidRequest(RuntimeException e, 
                                                       WebRequest request) {
        InvalidRequestException ire = (InvalidRequestException) e;

        List<FieldErrorResource> errorResources = 
        	ire.getErrors().getFieldErrors().stream().map(fieldError ->
            new FieldErrorResource(fieldError.getObjectName(), 
                                   fieldError.getField(), 
                                   fieldError.getCode(),
                                   fieldError.getDefaultMessage())
                                  ).collect(Collectors.toList());

        ErrorResource error = new ErrorResource("InvalidRequest", 
                                                ire.getMessage(), 
                                                errorResources);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        return handleExceptionInternal(e, error, headers, BAD_REQUEST, request);
    }
}
``` 

`handleInvalidRequest` 方法把一个 `InvalidRequestException` 中的 `FieldErrors` 转化为 `FieldErrorResource` 然后通过一个 `ErrorResource` 方法包装后交给 `handleExceptionInternal` 方法并最终转换为一个 `ResponseEntity`。

## 2. 业务逻辑错误处理

对于业务逻辑的报错，我们依然遵循上面的思路：将错误通过 `BingResult` 包装后抛出 `InvalidRequestException`。这里提供一个处理重复用户名的情况，需要在原来的 `UsersApi` 中做一些修改：

```java
@RestController
@RequestMapping("/users")
public class UsersApi {
    private UserRepository userRepository;

    @Autowired
    public UsersApi(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @RequestMapping(method = GET)
    public List<UserData> getUsers() {
        return new ArrayList<>();
    }

    @RequestMapping(method = POST)
    public ResponseEntity createUser(@Valid @RequestBody CreateUser createUser, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            throw new InvalidRequestException("Error in create user", bindingResult);
        }

        if (userRepository.findByUsername(createUser.getUsername()).isPresent()) {
            bindingResult.rejectValue("username", "Dupliated", "duplicated username");
            throw new InvalidRequestException("Error in create user", bindingResult);
        } // 处理重复用户名的问题
        User user = new User(UUID.randomUUID().toString(), createUser.getUsername());
        userRepository.save(user);
        return new ResponseEntity(HttpStatus.CREATED);
    }
}
```

可以看到，通过使用 `bindingResult.rejectValue` 方法可以把我们自定义的报错添加进去.这里的报错使用了 `UserRepository` 如果想要在别的地方去处理类似的验证就需要注入它，远不如在这里来的简单清晰。对其的测试如下：


```java
@Test
public void should_get_400_with_duplicated_username() throws Exception {
    User user = new User("123", "abc");
    when(userRepository.findByUsername(eq("abc"))).thenReturn(Optional.of(user));

    Map<String, Object> duplicatedUserName = new HashMap<String, Object>() {{
        put("username", "abc");
    }};

    given()
        .contentType("application/json")
        .body(duplicatedUserName)
        .when().post("/users")
        .then().statusCode(400)
        .body("message", equalTo("Error in create user"))
        .body("fieldErrors[0].field", equalTo("username"))
        .body("fieldErrors[0].message", equalTo("duplicated username"))
        .body("fieldErrors.size()", equalTo(1));
}
```

