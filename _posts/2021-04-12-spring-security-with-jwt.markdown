---
layout:     post
title:      "Spring Security Jwt 的实现"
date:       2021-04-12 11:50:11 +08:00
author:     "Eisen"
tags:       [web, spring, springboot, jwt]
---

突然发现除了[跨域问题]({% post_url 2017-11-08-spring-cors-and-security %})之外从来没有好好记录过 Spring Security 的其他内容。最近也是比较系统的看了些资料，这里就算是做一个总结吧，方便后面忘记了回看。

这里只介绍怎么把 jwt 的流程跑通以及对关键的代码做解释，不涉及 Authorization 部分，同时也只有 username password 单一的 authentication 流程，不涉及其他。

## 关键概念解释

首先要明白 spring security 主要通过 filter 拦截请求并做处理的，在 [有关 servlet 和 filter 的基础知识]({% post_url 2017-08-13-servlet-and-filter-with-web-framework %}) 已经做了介绍。

在 Spring Security 有一个概念 `Authentication` 它同时记录了一个用户授权的凭证（Credentials）以及验证通过后的产物（Principal）。而负责这个凭据验证并基于 Principal 的东西就是 `AuthenticationProvider`。

![](/img/in-post/spring-security-with-jwt/2021-04-12-23-24-37.png)

然后一个系统可能会支持多种凭据，比如最典型的 UsernamePasswordAuthentication 也可以是通过 OAuth 的 Authentication。为了处理不同的授权流程，Spring Security 有另外一个概念 `AuthenticationManager` 用于管理多个 `AuthenticationProvider`：

![](/img/in-post/spring-security-with-jwt/2021-04-12-23-32-28.png)

而具体到我们这次要构建的 JwtUsernamePassword 的流程，当我们登录的时候需要拿着登录信息（username + password）去数据库（或者其他地方）校验有没有这样子的组合，而这个地方 Spring Security 也抽取了概念叫做 `UserDetailsService`:

![](/img/in-post/spring-security-with-jwt/2021-04-12-23-37-33.png)

Spring Security 有提供一个名为 `WebSecurityConfigurerAdapter` 的基类，它已经提供了基本的框架，我们通常只需要对需要自定义的地方做覆盖即可。

那么总结下具体要做什么：

1. 增加一个 InMemoryUserDetailsManager 假装是个数据库。
1. 完成两个 Filter：
   1. `JwtUsernameAndPasswordAuthenticationFilter` 覆盖默认的 `UsernamePasswordAuthenticationFilter` 支持依据请求生成 jwt token
   1. `JwtTokenVerifier` 检查请求的 header `Authorization` 获取并验证所附带的 token 判断这个 token 是否合法并返回对应的 Principle
1. 覆盖 `WebSecurityConfigurerAdapter.configure` 把以上配置传起来

## 基本依赖

首先 gradle 依赖如下：

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    compileOnly 'org.projectlombok:lombok'

    compile 'io.jsonwebtoken:jjwt-api:0.11.2'
    runtime 'io.jsonwebtoken:jjwt-impl:0.11.2',
            // Uncomment the next line if you want to use RSASSA-PSS (PS256, PS384, PS512) algorithms:
            //'org.bouncycastle:bcprov-jdk15on:1.60',
            'io.jsonwebtoken:jjwt-jackson:0.11.2' // or 'io.jsonwebtoken:jjwt-gson:0.11.2' for gson

    annotationProcessor 'org.springframework.boot:spring-boot-configuration-processor'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
}
```

通过 [start.spring.io](https://start.spring.io) 创建的项目，添加了以下依赖：

- web
- validation
- lombok
- spring security

同时增加了一个 jwt 解析的类库 [jjwt](https://github.com/jwtk/jjwt)。

## WebSecurityConfig

增加一个 `InMemoryUserDetailsManager`，只有一个用户：

```java
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
  ...
  
  @Override
  @Bean
  protected UserDetailsService userDetailsService() {
    return new InMemoryUserDetailsManager(
        new User("test", passwordEncoder.encode("password"), Arrays.asList("NORMAL")));
  }
}
```

覆盖 `configure`，增加上述提及的 Filter:

```java
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http.csrf().disable() // disable csrf
        .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS) // 不再使用 cookie 管理 session
        .and()
        .addFilter(
            new JwtUsernameAndPasswordAuthenticationFilter(
                authenticationManager(), jwtConfig)) // 增加用户密码校验的 Filter
        .addFilterAfter(
            new JwtTokenVerifier(jwtConfig),
            JwtUsernameAndPasswordAuthenticationFilter.class) // 增加 token 校验的 Filter
        .authorizeRequests()
        .anyRequest().authenticated();
  }
}
```

## JwtUsernameAndPasswordAuthenticationFilter

```java
public class JwtUsernameAndPasswordAuthenticationFilter extends
    UsernamePasswordAuthenticationFilter {
  private AuthenticationManager authenticationManager;
  private JwtConfig jwtConfig;

  public JwtUsernameAndPasswordAuthenticationFilter(
      AuthenticationManager authenticationManager, // 1
      JwtConfig jwtConfig) {
    this.authenticationManager = authenticationManager;
    this.jwtConfig = jwtConfig;
  }

  @Override
  public Authentication attemptAuthentication(HttpServletRequest request,
      HttpServletResponse response) throws AuthenticationException { // 2
    try {
      UsernamePasswordRequest param = new ObjectMapper()
          .readValue(request.getInputStream(), UsernamePasswordRequest.class);

      Authentication authentication = new UsernamePasswordAuthenticationToken(
          param.getUsername(),
          param.getPassword()
      );
      return authenticationManager.authenticate(authentication);
    } catch (IOException io) {
      throw new RuntimeException();
    }
  }

  @Override
  protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response,
      FilterChain chain, Authentication authResult) throws IOException, ServletException { // 3
    String token = Jwts.builder()
        .setSubject(authResult.getName())
        .claim("authorities", authResult.getAuthorities().stream().map(
            GrantedAuthority::getAuthority).collect(toList()))
        .setIssuedAt(new Date())
        .setExpiration(java.sql.Date.valueOf(LocalDate.now().plusDays(jwtConfig.getDays())))
        .signWith(jwtConfig.getSecretKey())
        .compact();

    response.addHeader("Authorization", "Bearer " + token);
  }
}
```

1. 从 `WebSecurityConfig` 那边获取的 `AuthenticationManager` 里面其实就是一个默认的 `UsernamePasswordProvider` 里面用的就是我们上文配置的 `InMemoryUserDetailsManager`。
2. 尝试验证，可以看到就是把 `{"username": "username", "password": "password"}` 这种格式的 request body 做解析，然后让给 `AuthenticationManager`。
3. 生成 token，懂 jwt 的话就知道就是那么几个东西：
   1. subject 里面是 username
   1. claim 一些 key-value，这里塞了权限列表
   1. issueAt 创建时间
   1. expiration 过期时间

> **注意** 其实很多时候这个 Filter 可能是一个独立的 Controller 会比较舒服一些吧，相比下文的 JwtVerifier 这个 Filter 基本就是强行复用了 Spring Security 的逻辑。

## JwtTokenVerifier

```java
public class JwtTokenVerifier extends OncePerRequestFilter {

  private JwtConfig jwtConfig;

  public JwtTokenVerifier(JwtConfig jwtConfig) {
    this.jwtConfig = jwtConfig;
  }

  public boolean isNullOrEmpty(String str) {
    return str == null || str.isEmpty();
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String authorizationHeader = request.getHeader("Authorization");

    if (isNullOrEmpty(authorizationHeader) || !authorizationHeader.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }

    String token = authorizationHeader.replace("Bearer ", "");

    try {
      Jws<Claims> claimsJws =
          Jwts.parserBuilder()
              .setSigningKey(jwtConfig.getSecretKey())
              .build()
              .parseClaimsJws(token);
      Claims body = claimsJws.getBody();
      String username = body.getSubject();
      List<String> authorities = (List<String>) body.get("authorities");
      Set<SimpleGrantedAuthority> simpleGrantedAuthorities =
          authorities.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toSet());
      Authentication authentication = 
          new UsernamePasswordAuthenticationToken(username, null, simpleGrantedAuthorities); // 1
      SecurityContextHolder.getContext().setAuthentication(authentication); // 2
    } catch (JwtException e) {
      throw new IllegalStateException(String.format("Token %s cannot be trusted", token));
    }

    filterChain.doFilter(request, response);
  }
}
```

1. 创建一个 `UsernamePasswordAuthenticationToken` 注意，这里的第一个参数未必要 String 的，可以是任意类型的，这里只是一个 String 为例了
2. 把 `Authentication` 传递给 `SecurityContextHolder` 之后同一线程下就可以获取它并做进一步的权限验证了

## 参考资料

感觉最有用的就是这里的视频呢...

1. [How Spring Security Authentication works - Java Brains](https://www.youtube.com/watch?v=caCJAJC41Rk)
1. [Spring Security | FULL COURSE](https://www.youtube.com/watch?v=her_7pa0vrg)