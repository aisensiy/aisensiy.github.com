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

