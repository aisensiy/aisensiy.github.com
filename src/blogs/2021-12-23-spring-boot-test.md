---
layout:     post
title:      "spring boot 整理 SpringBootApplication"
date:       2021-12-23 17:15:00 +08:00
author:     "Eisen"
tags:       [springboot, spring, test]
---

早在 2017 年有写过一些 spring boot 测试相关的内容，比如 [在 Spring Boot 1.5.3 中进行 Spring MVC 测试](/spring-mvc-and-test)，再比如 [把 Spring Boot 1.5.3 与 MyBatis 集成](/spring-mvc-and-mybatis)。现在都 2021 年马上 2022 年了，spring boot 的最新版本已经来到了 2.6，其所依赖的一系列东西也发生了不少变化。同时随着我们项目变得越来越大，测试用例越来越多，对测试的性能、标准化的要求也越来越迫切。从这篇开始记录一些自己最近翻看 spring test 以及 spring boot test 了解到的有关 spring 测试体系的内容。

spring 以及 spring boot 测试相关的内容简单 google 一下就能看到很多，但我个人感觉非常不成体系，这个应该也和 spring 不断的更迭关系很大，很多新旧知识掺杂在一起，有点摸不清楚。这里我参考的核心资料是如下两个:

1. [Spring Testing](https://docs.spring.io/spring-framework/docs/current/reference/html/testing.html)
2. [Spring Boot Testing](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing)

翻看了这两部分内容后感觉 Spring 的文档写的还是比较全面的，不过很遗憾 Spring Testing 的内容写的还是不够细致，可能需要自己去结合源码和其他资料才能更好的消化吸收。但我觉得确实比直接在其他地方要系统一些。

今天先介绍最近消化的第一个 Tips 什么不应该放进 `@SpringBootApplication`。

## @SpringBootApplication 简单介绍

`@SpringBootApplication` 是一个集成注解，翻看源码可以看到它包含了额外三个注解：

- `@SpringBootConfiguration`: 作为 SpringBoot 默认的 Configuration Class
- `@EnableAutoConfiguration`: 允许 Auto Configuration
- `@ComponentScan`: 支持 Component Scan 的方式提供各种 `Bean`

添加这个注解的 Class 也通常就是整个应用的入口了。在这里可能会放一些全局初始化的东西，不过根据 Spring Boot Testing 的 [User Configuration and Slicing](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing.spring-boot-applications.user-configuration-and-slicing) 介绍，这里反而不是那种什么都可以放的地方，随便放各种东西会影响你的测试依赖。

## 为什么 SpringBootApplication 不能添加各种依赖

这样从 Spring Boot 写测试通常使用的 `@SpringBootTest` 和 `@WebMvcTest` 注解的行为做解释了。

通常来说，如果我们的依赖链条都是靠我们自己去切断，不依赖 Spring 的 ApplicationContext 那么这种测试就算是 Unit Test 。反之任何需要依赖 ApplicationContext 的都可以称为 Integration Test。面向 WebMvc 或者需要和数据库接触的测试都需要 ApplicationContext 而这个 ApplicationContext 如何建立就是靠的 `@SpringBootTest` 或者 `@WebMvcTest` 这样的注解了。

标记 `@SpringBootTest` 或者其他 Spring Boot 提供的 `@*Test` 注解的测试会尝试寻找从根目录开始寻找标记了 `@SpringBootApplication` 或者 `@SpringBootConfiguration` 的类，并以它为起点加载完整的 ApplicationContext 。在 Spring Boot 的 [Detecting Test Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing.spring-boot-applications.detecting-configuration) 文档里也做了说明：

> When testing Spring Boot applications, this is often not required. Spring Boot’s @*Test annotations search for your primary configuration automatically whenever you do not explicitly define one.
>
> The search algorithm works up from the package that contains the test until it finds a class annotated with @SpringBootApplication or @SpringBootConfiguration. As long as you structured your code in a sensible way, your main configuration is usually found.

当然也可以通过增加 `classes` 参数 explicitly define 一个 Configuration 修改其默认搜索的行为：

```java
@SpringBootTest(classes = {GraphQLTestConfiguration.class, DgsAutoConfiguration.class})
@Import(CustomDataFetchingExceptionHandler.class)
@RunWith(SpringRunner.class)
public abstract class GraphQLTestBase extends TestBase {}
```

## 应该如何修改

在文档的 [User Configuration and Slicing](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing.spring-boot-applications.user-configuration-and-slicing) 部分有做介绍:

> Test slices exclude @Configuration classes from scanning. 

但是 `@SpringBootApplication` 默认的 `@ComponentScan` 可不会跳过任何 `@Configuration` 因此，为了让全局的依赖注入不要污染不必要的 `Test Slices` 可以把额外的依赖注入放在单独的 `@Configuration` 下，这里我直接超文档的内容：

```java
@SpringBootApplication
@EnableBatchProcessing
public class MyApplication {

    // ...

}
```

修改为 

```java
@Configuration(proxyBeanMethods = false)
@EnableBatchProcessing
public class MyBatchConfiguration {

    // ...

}
```

## 总结

1. `@SpringBootApplication` 自带 `ComponentScan` 会收集自己 package 下所有的 Beans 和 Configurations
2. Spring Boot 提供的 `@*Test` 会自己搜索 `@SpringBootApplication` 或者 `@SpringBootConfiguration` 作为默认的 `Configuration`，除非你主动做覆盖
3. 为了让 2 的行为不要导致过量的 `ApplicationContext` 在测试阶段被创建，可以把一些只有在生成环境才需要的额外的 Bean 放在独立的 `@Configuration` 类下，因为 Spring Boot 的 Testing slices 不会扫其他的 `@Configuration`
