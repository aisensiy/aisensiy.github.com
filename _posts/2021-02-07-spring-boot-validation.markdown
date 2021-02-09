---
layout:     post
title:      "spring boot validation"
date:       2021-02-07 23:16:00 +08:00
author:     "Eisen"
tags:       [spring, springboot, validation, web]
---

之前在 [当前的校验异常处理]({% post_url 2020-11-22-spring-boot-current-status%}) 提到了目前校验和异常处理的一些问题。最近找到了一些看起来更专业化的方案。这里首先对几种模式做一些罗列。文中大量的内容都是从 [naturalprogrammer](https://www.naturalprogrammer.com/) 学习到的，后文也会再去引用里面的内容。

有关预定义的 Bean Validation 注解（`@Email`, `@NotBlank` 之类的）就不再赘述了。

## Bean Validation 的异常处理时机

在 Spring Controller 中的方法里，标记有 `@Valid` 注解的字段会触发 Bean Validation。在 [spring boot 异常处理]({% post_url 2020-12-08-spring-boot-exception-handler%}) 也讲了，如果出现校验报错，会抛出异常 `MethodArgumentNotValidException`。

```java
@SpringBootApplication
@RestController
@RequestMapping("/")
public class ExceptionApplication {

  public static void main(String[] args) {
    SpringApplication.run(ExceptionApplication.class, args);
  }

  @PostMapping("hello")
  public Hello postHello(@RequestBody @Valid Hello hello) {
    return hello;
  }
}

class Hello {

  @NotBlank
  private String name;
  private int value;

  public String getName() {
    return name;
  }

  public int getValue() {
    return value;
  }
}
```

不过除了在 `Controller` 层级做校验外，可能在 `Application Service` 层级也经常有校验的需求。这部分的校验可以通过 `@Validated` 注解配合实现：

```java
@SpringBootApplication
@RestController
@RequestMapping("/")
public class ExceptionApplication {

  @Autowired
  private HelloService helloService;

  public static void main(String[] args) {
    SpringApplication.run(ExceptionApplication.class, args);
  }

  @PostMapping("hello")
  public Hello postHello(@RequestBody Hello hello) {
    helloService.processHello(hello);
    return hello;
  }

}

@Validated
@Service
class HelloService {
  public void processHello(@Valid Hello hello) {}
}
```

如上述代码所示，在 `HelloService` 上添加注解 `Validated` 并给其参数 `Hello` 增加注解 `@Valid` 在该参数传递时也会触发校验逻辑。如果报错就抛出异常 `ConstraintViolationException`。

## Bean Validation 自定义注解

### 包含自定义校验

除了预定义的注解之外，我们可以创建自定义的注解以及对应的校验，下面就直接给出这么一个例子（直接依葫芦画瓢而来）：

```java
@NotBlank()
@Size(min=4, max=255)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy=NameValidator.class)
public @interface Name {
  String message() default "Invalid name";
  Class[] groups() default {};
  Class[] payload() default {};
}

@Component
class NameValidator implements ConstraintValidator<Name, String> {
  private static Set<String> RESERVED_NAMES = new HashSet<String>() {{
    add("admin");
    add("administration");
    add("public");
    add("private");
  }};

  @Override
  public boolean isValid(String name, ConstraintValidatorContext context) {
    return name != null && !RESERVED_NAMES.contains(name.toLowerCase());
  }
}
```

可以看到 `@Name` 上面首先包含了两个预定义的校验注解 `@NotBlank` 和 `@Size` 然后引入一个自定义的 `NameValidator` 校验所注册的名字是否为我们的保留字段，如果是就报错。

![name validation](https://images-1300693298.cos.ap-beijing.myqcloud.com/20210208184451.png)

然后这里有一个没有解决的细节：

```java
  @Override
  public boolean isValid(String name, ConstraintValidatorContext context) {
    // 虽然明明有额外的 @NotBlank 字段，但是依然不能保证这里传递的 name 是非空，
    // 感觉是这个 Validator 的优先级要高于其他预定义的校验
    return name != null && !RESERVED_NAMES.contains(name.toLowerCase());
  }
```

### 不包含自定义校验

当然，也可以给一个不包含额外 Validator 的注解：

```java
@NotBlank()
@Size(min = 4, max = 255)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = {}) // validator 为空
public @interface Name {
  String message() default "Invalid name";
  Class[] groups() default {};
  Class[] payload() default {};
}
```

这样的好处自然就是把一些公共的校验逻辑抽取出来作为一个标准，方便理解，当然也方便复用。

### 跨字段校验

上面提到的是单个字段的校验，如果涉及到多个字段一起的校验，就需要用到类级别的标注了：

```java
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy=ConfirmValueValidator.class)
public @interface ConfirmValue {
  String message() default "Can not confirm value";
  Class[] groups() default {};
  Class[] payload() default {};
}

@Component
class ConfirmValueValidator implements ConstraintValidator<ConfirmValue, Hello> {
  @Override
  public boolean isValid(Hello value, ConstraintValidatorContext context) {
    return value.getConfirmValue() == value.getValue();
  }
}

// Hello
@ConfirmValue
class Hello {
  @Name
  private String name;
  private int value;
  private int confirmValue;
  public String getName() {
    return name;
  }
  public int getValue() {
    return value;
  }
  public int getConfirmValue() {
    return confirmValue;
  }
}
```

报错信息如下：

![](https://images-1300693298.cos.ap-beijing.myqcloud.com/20210208185553.png)

### Validator 中的依赖注入

最后，Validator 是可以像其他类一样做依赖注入的：

```java

@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy=UniqueEmailValidator.class)
public @interface UniqueEmail {
  String message() default "duplicated email";
  Class[] groups() default {};
  Class[] payload() default {};
}

@Component
class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {
  @Autowired EmailService emailService;
  @Override
  public boolean isValid(String email, ConstraintValidatorContext context) {
    return !emailService.containsEmail(email);
  }
}

@Component
class EmailService {
  public boolean containsEmail(String email) {
    return email.equals("a@b.com");
  }
}
```

也就是说，然后与数据库通讯的东西也是可以做校验的，仅仅是把与数据链接的对象注入就可以使用了。

## Error Message 的处理

另外 validation 的报错信息也是需要做自定义的。这里给一个我觉得还不错的方案。不过没有深究一些细节，仅仅是 work 而已。

### 国际化

首先，error message 是按照国际化的思路处理的：给一个 `ValidationMessages_<LANG>.properties` 文件。然后在注解的 `message` 字段通过 `{<KEY_NAME>}` 的方式给传递过来，这里给一些例子看就明白：

首先修改前面的 `@Name` 注解里面的 `message`:

```java
public @interface Name {
  String message() default "{validation.name.default}"; // <----- 修改了这里
  Class[] groups() default {};
  Class[] payload() default {};
}
```

然后给两个新的 `properties` 文件，放在 src/main/resources 目录下（就是默认的放资源文件的地方，懂的都懂）：

```java
// ValidationMessages_en.properties
validation.name.default=Invalid name

// ValidationMessages_zh_CN.properties
validation.name.default=错误的名字格式
```

发个请求试试看，报错信息已经成了中文：

![](https://images-1300693298.cos.ap-beijing.myqcloud.com/20210208194218.png)

当然，如果强行给一个 `Accept-Language: en` 的 http 头就可以返回对应的英文信息：

![](https://images-1300693298.cos.ap-beijing.myqcloud.com/20210208194626.png)

然后，再介绍下 message 中两种可以传递的参数：

1. 注解中的参数可以直接用 `{xx}` 的形式传递，例如对于 `@Size` 注解有两个参数 `min` 和 `max` 可以将 message 写成以下的样子：

```
// ValidationMessages_en.properties
validation.name.size=name long shound between {min} and {max}

// ValidationMessages_zh_CN.properties
validation.name.size=名字的长度要在 {min} 和 {max} 之间
```

然后还有一个 `${}` 可以做特殊的表达式解析，具体的文章可以看 [Spring Validation Message Interpolation](https://www.baeldung.com/spring-validation-message-interpolation)。最常用的自然是 `${validatedValue}` 其中 `validatedValue` 就是用户的输入。这个规则甚至是在 `Class Level Contraint` 也是工作的：

```java
// ValidationMessages_en.properties
validation.name.default=Invalid name
validation.name.size=name long shound between {min} and {max}
validation.confirm=value not equal: ${validatedValue.value} != ${validatedValue.confirmValue}
```

> **注意** 这里遇到一个小坑，如果这里的 `validatedValue` 所在的 `Class` 不是 `public` 的，那么反射会出问题，导致解析失败。目前我测试的就是必须要把上文中 `Hello.class` 移动到一个独立的文件并且标记为 `public` 才可以工作。

### 中文处理

既然用到了 `.properties` 文件自然就遇到了这个 java 中臭名昭著的编码问题了：中文显示乱码了。这里找了个[解决方案](https://my.oschina.net/LevelCoder/blog/1625594)，解决了。幸好是 Intellij ?

顺便提一句，Intellij 里面的 [Resource bundles](https://www.jetbrains.com/help/idea/resource-bundle.html) 也挺好用的。

![](https://images-1300693298.cos.ap-beijing.myqcloud.com/20210208212752.png)

这部分介绍就到这里了，后文会继续介绍如何建立自定义 exception handler 体系以捕捉各种层级的报错并统一返回格式了。