---
layout:     post
title:      "CORS with Spring Boot and Spring Security"
date:       2017-11-08 19:03:00 +08:00
author:     "Eisen"
tags:       [spring, springboot]
---

## Spring 对 CORS 的支持

在这篇[文章](https://spring.io/blog/2015/06/08/cors-support-in-spring-framework) spring 说明了自己在 Spring MVC 中所提供的 CORS 的支持。文中提到了三种 Spring 支持 CORS 的方式：

1. 对于单个方法的跨域支持，可以使用 `@CrossOrigin` 的注解实现，这种情况我基本没有用到过，也从来没有使用过
2. 采用 JavaConfig，尤其是在使用 Spring Boot 的时候，可以采用如下方式：

    ```java
    @Configuration
    public class MyConfiguration {
    
        @Bean
        public WebMvcConfigurer corsConfigurer() {
            return new WebMvcConfigurerAdapter() {
                @Override
                public void addCorsMappings(CorsRegistry registry) {
                    registry.addMapping("/**");
                }
            };
        }
    }
    ```
3. 采用 Filter

    ```java
    @Configuration
    public class MyConfiguration {
    
    	@Bean
    	public FilterRegistrationBean corsFilter() {
    		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    		CorsConfiguration config = new CorsConfiguration();
    		config.setAllowCredentials(true);
    		config.addAllowedOrigin("http://domain1.com");
    		config.addAllowedHeader("*");
    		config.addAllowedMethod("*");
    		source.registerCorsConfiguration("/**", config);
    		FilterRegistrationBean bean = new FilterRegistrationBean(new CorsFilter(source));
    		bean.setOrder(0);
    		return bean;
    	}
    }
    ```
    
看起来还是挺简单的？但是这里有个坑，在第二种方法后面的叙述中会强调：

> If you are using Spring Security, make sure to enable CORS at Spring Security level as well to allow it to leverage the configuration defined at Spring MVC level.

## CORS with Spring Security

Spring Security 本身是通过 Filter 实现的，如果没有对其单独做 CORS 的处理，在 Web Security 报错 401 的时候是不会返回相应的 CORS 的字段的。这会导致命名应该出现的 401 错误成为了一个无法进行跨域的错误，导致前端程序无法正常的处理 401 相应：

![](http://o8p12ybem.bkt.clouddn.com/15101476021097.jpg?imageView2/2/w/1200/q/75%7Cimageslim)

为了解决这个问题，自然是需要添加 [Spring Security 支持的 CORS 代码](https://docs.spring.io/spring-security/site/docs/current/reference/html/cors.html)：

```java
@EnableWebSecurity
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http
			// by default uses a Bean by the name of corsConfigurationSource
			.cors().and()
			...
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(Arrays.asList("https://example.com"));
		configuration.setAllowedMethods(Arrays.asList("GET","POST"));
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
```

当然这种边角旮旯的东西确实引起了不少的问题，甚至在 spring boot 上还有人报了 [issue](https://github.com/spring-projects/spring-boot/issues/5834)，并且很多人还讨论了半天...可见隐藏之深。

这里提供一个处理 CORS 的 [GitHub 项目](https://github.com/gothinkster/spring-boot-realworld-example-app)，这也是我发现这个问题的出处。

## Expose Header vs Allow Header

很多 POST 请求会返回 status code 201，并且包含一个 Response Header `Location` 指向新创建的资源的地址。在 CORS 请求时，如果没有设置 Access-Control-Expose-Headers 会导致 Ajax 请求无法获取 `Location` 这样的 Response Header，详细信息可以在 [developer.mozilla.org](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS#Access-Control-Expose-Headers) 看到：

> 在跨域访问时，XMLHttpRequest对象的getResponseHeader()方法只能拿到一些最基本的响应头，Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma，如果要访问其他头，则需要服务器设置本响应头。Access-Control-Expose-Headers 头让服务器把允许浏览器访问的头放入白名单。

因此，为了使得 `Location` 字段可以被访问，需要进行额外的设置：

```java
@Bean
CorsConfigurationSource corsConfigurationSource() {
	CorsConfiguration configuration = new CorsConfiguration();
	configuration.setAllowedOrigins(Arrays.asList("https://example.com"));
	configuration.setAllowedMethods(Arrays.asList("GET","POST"));
	configuration.addExposedHeader("Location"); // 暴露 Location header
	UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
	source.registerCorsConfiguration("/**", configuration);
	return source;
}
```

