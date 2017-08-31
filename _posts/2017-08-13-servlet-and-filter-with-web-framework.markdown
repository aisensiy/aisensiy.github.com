---
layout:     post
title:      "有关 servlet 和 filter 的基础知识"
date:       2017-08-13 18:03:00 +08:00
author:     "Eisen"
tags:       [java, servlet, filter, spring]
---

用惯了抽象级别比较高的 web 框架的人在看一些相关的资料的时候也会时不时看到 filter 和 servlet 这样的名词，也会听到一个**容器**的概念。如果你想真正的明白整个 java web 的开发体系，还是需要了解一些古老的知识，以便明白 java web 整个的体系是什么样子的。

## servlet 的基础知识

这里只讲一些大概的概念，具体的操作以及最新的 servlet 注解的支持大多数人都不会使用，因此只要知道基本的体系即可，需要深究请看文档。

### servlet

servlet 是 java web 得以实现的基础，任何 java web 的框架都是通过对 servlet 加以封装实现的。java 最基础的 servlet 接口只定义了一下的几个方法：

```java
void init(ServletConfig config) throws ServletException
void service(ServletRequest request, ServletResponse response)
        throws ServletException, java.io.IOException
void destroy()
java.lang.String getServletInfo()
ServletConfig getServletConfig()
```

不过我们平时使用的是 `HttpServlet` 一个实现了 Http 处理并实现了 Servlet 接口的一个继承类。它针对 http 请求增加了 `doGet` `doPost` `doDelete` `doPut` 等方法。以用于处理不同类型的 http 请求。然后，通过一个 `web.xml` 定义 servlet 与请求路径之间的映射关系，以说明哪些请求被哪个 servlet 处理。这里我们展示一个例子：

```java
public class TestServlet extends HttpServlet {
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException { // 1
    PrintWriter out = response.getWriter();
    out.println("Hello, Servlet");
  }
}
```

```xml
<?xml version=”1.0” encoding=”ISO-8851-1” ?>
<web-app ...>
    <servlet> // 2
        <servlet-name>Test Servlet</servlet-name>
        <servlet-class>TestServlet</servlet-class>
    </servlet>
    <servlet-mapping> // 3
        <servlet-name>Test Servlet</servlet-name>
        <url-pattern>/Serv1</url-pattern>
    </servlet-mapping>
</web-app>
```

可以看到，

1. 实现了 doGet 方法，用于处理 `GET` 请求
2. 在 web.xml 声明一个 `servlet` 元素，并定义一个新的名字 `Test Servlet` 与实际的 `TestServlet` 类之间的映射关系
3. 定义 `servlet-mapping` 定义 `Test Servlet` 与具体的 `url-pattern` 之间的映射关系，这里定义到 `/Serv1` 路径的请求都由 `Test Servlet` 这个 servlet 处理

### servlet container

在完成了 servlet 以及 web.xml 的编写之后需要使用一个叫做 servlet container 的东西才能让服务运行起来。著名的 servlet container 有 tomcat，jetty。它们主要负责维护其生命周期并按照 web.xml 的规则将 http 请求分发到指定的 servlet 进行处理。

### filter

有的时候你需要一种机制来控制那些涵盖了多个 servlet 映射的请求，比如追踪每一次请求的执行时间，或者对一系列路径的访问做限制。java 有一个 Filter 的组件用于完成这样的工作。

![](/img/in-post/servlet-and-filter/filter.png)

它在将 request 传递给 servlet 前以及从 servlet 返回 response 后分别进行一系列的处理。并且 servlet 前后可以包含多个 filter。

![](/img/in-post/servlet-and-filter/multi-filters.png)

一个 filter 的例子如下：

```java
public class MyFilter implements Filter { // 1
  public void doFilter(HttpServlet Request request, HttpServletResponse response, FilterChain chain) {
    // this is where request handling would go
    chain.doFilter(request, respoonse);
    // this is where response handling would go
  }
}
```

```xml
<web-app ...>
    <filter> // 2
        <filter-name>BeerRequest</filter-name>
        <filter-class>com.example.web.BeerRequestFilter</filter-class> 
    </filter>
    <filter-mapping> // 3
    	<filter-name>BeerRequest</filter-name>
        <url-pattern>*.do</url-pattern>
	</filter-mapping>
</web-app>
```

可以看到，

1. java 同样已经提供了一个 `Filter` 的基类，并且每个 filter 都包含了处理 request 和处理 response 的双重任务：在 `chain.doFilter` 前的通常是处理请求的，当然你也可以根据一些情况直接返回异常结果而不允许请求继续传递下去；在 `chain.doFilter` 后的是 servlet 处理完之后返回的结果，这里可以对其进行进一步的加工。
2. filter 同样需要在 `web.xml` 进行声明，指定其名字和类的映射关系
3. filter 也需要对请求进行映射，和 servlet 类似

最后说明一些 filter 的顺序和其在 web.xml 的声明顺序有关。

## spring mvc 与 servlet 的关系

前面提到过，java web 的各种框架都是建立在 servlet 体系之上的，SpringMVC 也不例外。和 structs 等老牌的 web 框架类似，它也提供了一个 `DispatcherServlet` 作为 Front Controller 来拦截所有的请求，并通过自己的请求分发机制将请求分发到 SpringMVC 下实际的 controller 之中。

![](/img/in-post/servlet-and-filter/mvc.png)

```xml
<web-app>
    <servlet>
        <servlet-name>example</servlet-name>
        <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
        <load-on-startup>1</load-on-startup>
    </servlet>

    <servlet-mapping>
        <servlet-name>example</servlet-name>
        <url-pattern>/example/*</url-pattern>
    </servlet-mapping>
</web-app>
```

## spring security web 与 filter 的关系

spring security web 都是基于 servlet filter 建立起来的。其使用的方式和 SpringMVC 的 `DispatcherServlet` 非常类似，有一个 `DelegatingFilterProxy` 作为全局的 Filter 对所有的请求进行过滤，并在其层次之下实现 Spring Security 所提供的特有的 Filter（当然不再是继承自 java Filter 的类了）层次。

```xml
<filter>
    <filter-name>myFilter</filter-name>
    <filter-class>org.springframework.web.filter.DelegatingFilterProxy</filter-class>
    </filter>

    <filter-mapping>
    <filter-name>myFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
```


## 相关资料

1. [SpringMVC](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/mvc.html)
2. Head First Servlets and JSP
3. [Spring Security: Web Application Security](https://docs.spring.io/spring-security/site/docs/current/reference/htmlsingle/#web-app-security)
