---
layout:     post
title:      "Spring Boot ConfigurationProperties 与 Value"
date:       2017-08-31 14:27:00 +08:00
author:     "Eisen"
tags:       [java, spring, spring-boot, configuration]
---

`@ConfigurationProperties` 和 `@Value` 都是 Spring 提供的用于从配置文件注入配置信息的方式。很显然，`@Value` 比较适用于配置比较少的场景，而 `@ConfigurationProperties` 则更适用于有很多配置的情况。之前写项目的时候从来都没有使用过 `@ConfigurationProperties` 几乎每次都是使用 `@Value`。这次遇到了一个比较适合它的场景，在使用的时候还真遇到了一些令人讨厌的小问题，导致开发速度受到了一定的影响。这里记录下来他们之间的使用方式和可能出现的坑，加深一下印象。

**注意**，我们这里使用 `application.yml` 而不是 `application.properties` 不过他们基本是可以相互替代的。

## Demo for @Value

```yaml
sso:
  clientId: clientId
  clientSecret: clientSecret
```

```java
@Component
@Data
public class ValueConfiguration {
    private String clientId;
    private String clientSecret;

    @Autowired
    public ValueConfiguration(
        @Value("${sso.clientId}") String clientId,
        @Value("${sso.clientSecret}") String clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }
}
```

可以看到 `@Value` 是使用非常的简单，只要将注解添加在参数前即可。

## Demo for @ConfigurationProperties

在有大量参数的时候，一个个添加 `@Value` 就显得麻烦了一点，Spring 提供了另一种方式。

```java
@SpringBootApplication
@EnableConfigurationProperties // 1
public class DemoForSpringBootConfigurationApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoForSpringBootConfigurationApplication.class, args);
	}

	@Bean
	CommandLineRunner run(ValueConfiguration valueConfiguration) {
		return args -> {
			System.out.println(valueConfiguration.toString());
		};
	}

	@Bean
	CommandLineRunner config(PropertiesConfiguration configuration) {
	    return args -> {
            System.out.println(configuration);
        };
    }
}

@Component
@ConfigurationProperties(prefix = "oauth") // 2
@Getter
@Setter  // 3
@ToString
public class PropertiesConfiguration {
    private String clientId;
    private String clientSecret;
    private String redirectUri;
    private String grantType;
}
```

```yaml
sso:
  clientId: clientId
  clientSecret: clientSecret

oauth:
  client_id: id                           // 4
  client-secret: secret
  redirect_uri: http://aisensiy.github.io
  grantType: code
```

1. 为了使用 `@ConfigurationProperties` 需要在 spring boot application 上添加 `EnableConfigurationProperties` 的注解，这里遇到的第一个坑
2. `@ConfigurationProperties` 可以添加前缀，然后其属性就会按照变量的名称默认在 `application.*` 中寻找指定的变量。这里就是去寻找 `oauth.clientId` 这样的配置。** 如果想要从其他配置文件获取配置内容，可以添加一个额外的注释 `@PropertySource("classpath:xxx.yml")`**
3. 这里的 `@Setter` 是来自 lombok 的注解，它可以自动的帮助添加默认的属性的 setter 方法。注意，**这里的 setter 方法是必须的，如果没有 setter 方法，是无法成功获取配置的**，这也是我在使用它的时候遇到的又一个坑
4. `@ConfigurationProperties` 与 `@Value` 的一个重大区别在于它采用比较灵活的方式寻找配置。可以看到这里的配置可以是驼峰形式，也可以是下划线分割的，还可以是中横线分割的

## 添加参数验证

`@ConfigurationProperties` 是可以和 validation 注解一起使用的，这样的好处显而易见：对于一些配置是必须的或者是对格式有要求的，在运行开始的时候就能检测到这些问题可以避免上线之后因为配置不符合有找不到头绪而导致的 debug 的痛苦过程。

```java

@Component
@Getter
@Setter
@ToString
@ConfigurationProperties(prefix = "oauth")
public class PropertiesConfiguration {
    @NotBlank
    private String clientId;
    @NotBlank
    private String clientSecret;
    @URL
    private String redirectUri;
    @NotBlank
    private String grantType;
}
```

直接在成员变量上添加注解就可以了，非常的简单。然后可以去尝试添加一些非法的配置试试效果。

完整的 demo 项目在[这里](https://github.com/aisensiy/demo-for-spring-boot-configuration)。

## 相关资料

* [lombok](https://projectlombok.org/)
* [relaxed binding](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-external-config.html#boot-features-external-config-relaxed-binding)
* [@ConfigurationProperties vs. @Value](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-external-config.html#boot-features-external-config-vs-value)
* [Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-external-config.html)