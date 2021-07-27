---
layout:     post
title:      "用 Feign Hystrix 进行服务集成"
date:       2017-10-16 17:32:00 +08:00
author:     "Eisen"
tags:       [java, spring, springboot, feign, hystrix]
---

不论是否采用微服务的架构，我们都有将自己的服务与其他的服务集成的需求。比如我这里有一个需求就是在系统中创建一个项目的时候通过其所提供的 GitHub 项目的地址获取其默认的 `README.md` 文件内容作为项目的描述。再比如现在很多的项目都将其**用户管理系统**作为一个独立的系统，当我自己的系统需要用户认证的时候需要从**用户系统**特定的接口获取用户信息。这篇文章就介绍如何使用 Feign，Hystrix 这些 spring cloud 所使用的依赖与其他服务做集成，当然，为了更好的保证服务的可靠性，我这里还展示了通过 wiremock 建立了一系列测试保证我们可以覆盖各种特殊的情况。

项目代码在 [GitHub](https://github.com/aisensiy/demo-for-feign-and-hystrix)。

# 声明式 http 客户端 Feign

Feign 是一个声明式的 Http 客户端。其优势自然是它的"声明式"：可以更清晰更简单的对其他服务进行请求。虽然目前 Feign 类库已经放在了 OpenFeign 这个 Github 账号之下，但是鉴于更多的人是将其作为 spring cloud 的一环一起使用的，所以这里我所使用的代码也都是引入的 spring cloud 的 `org.springframework.cloud:spring-cloud-starter-feign` 而不是其 `io.github.openfeign:feign-core` 的独立依赖。

`build.gradle`:

```java
...

dependencies {
    compile('org.springframework.cloud:spring-cloud-starter-feign')
    compile('org.springframework.boot:spring-boot-starter-web')
    compileOnly('org.projectlombok:lombok')
    testCompile('org.springframework.boot:spring-boot-starter-test')
}

...
```

然后，创建我们的 GitHubService:

```java
@FeignClient(value = "github", url = "${github.url}")
public interface GitHubService {

    @GetMapping("/{git}/master/{filename}")
    String fetchRawFile(
        @PathVariable("git") String git,
        @PathVariable("filename") String filename);
}
```

然后在 `@SpringBootApplication` 注解的类添加注解 `@EnableFeignClients`:

```java
@SpringBootApplication
@EnableFeignClients
public class DemoForFeignAndHystrixApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoForFeignAndHystrixApplication.class, args);
	}
}
```

Feign 本身是可以支持很多套语法的，在 spring cloud 下默认使用的 SpringMVC 的方式。

# 用 wiremock 测试 Feign Client

在有了 `GitHubService` 之后，如果想要对其进行测试就需要一种 mock 服务端请求的方式。这里我们采用 [WireMock](https://wiremock.org/) 来实现。

首先在 `build.gradle` 引入依赖：

```groovy
...

dependencies {
    compile('org.springframework.cloud:spring-cloud-starter-feign')
    compile('org.springframework.boot:spring-boot-starter-web')
    compileOnly('org.projectlombok:lombok')
    testCompile('org.springframework.boot:spring-boot-starter-test')
+    testCompile('com.github.tomakehurst:wiremock-standalone:2.7.1') 
}

...
```

然后在 resources 目录下定义 application-test.yml 文件，定义 `github.url` 在测试环境下的地址：

```
github:
  url: http://localhost:10087
```

最后我们编写相应的测试：

```java
@ActiveProfiles("test")
@RunWith(SpringRunner.class)
@SpringBootTest // 1
public class GitHubServiceTest {
    @Rule
    public WireMockRule wireMockRule = new WireMockRule(wireMockConfig().port(10087)); // 3

    @Autowired
    private GitHubService gitHubService; // 2

    @Test
    public void should_fetch_meta_file_success() throws Exception {
        String rawMetaFileContent = "content";

        stubFor(
            get(urlEqualTo("/aisensiy/hello-project/master/meta.yml"))
                .willReturn(ok(rawMetaFileContent))); // 4

        String metaFile = gitHubService.fetchRawFile("aisensiy/hello-project", "meta.yml"); // 5
        assertThat(metaFile, is(rawMetaFileContent)); // 6
    }
}
```

1. 我们需要引入 SpringBoot 的环境帮助我们自动注入 [2] 的 `GitHubService`，因此添加了 `@SpringBootTest` 的注解，并指定 profile 为 `test` 以便加载 `application-test.yml` 的配置
2. 自动注入 GitHubService 并按照 test profile 做相应的配置
3. 创建 WireMockRule 并指定其端口与 `application-test.yml` 相同
4. 采用 WireMock 的语法指定在请求 "/aisensiy/hello-project/master/meta.yml" 时返回所需要的结果
5. 执行 FeighClient
6. 比较其结果是否与我们的预期符合

# 用 Hystrix 进行请求容错

可以看到 Feign 定义客户端是非常简单的，但是只做到上面的那些是不够的。对于这种网络请求为了保证系统的鲁棒性，还需要处理超时，请求错误等问题。正如 Hystrix 的文档中所提到的，如果你所访问的服务直接挂了，那没什么可怕的，你就直接报错就好了；最怕的是它没有挂但是它的访问速度比预期的要慢很多，这会导致你自身的服务也出现相应的延时，最终可能会导致你自身的一些异步调用的线程池被用尽。

为了增加 Feign 的鲁棒性，我们可以引入 hystrix 的依赖。

```java
...

dependencies {
    compile('org.springframework.cloud:spring-cloud-starter-feign')
+    compile('org.springframework.cloud:spring-cloud-starter-hystrix')
    compile('org.springframework.boot:spring-boot-starter-web')
    compileOnly('org.projectlombok:lombok')
    testCompile('org.springframework.boot:spring-boot-starter-test')
    testCompile('com.github.tomakehurst:wiremock-standalone:2.7.1') 
}

...
```

在添加 hystrix 依赖之后，如果在 `@FeignClient` 中不添加 Hystrix 的 fallback Hystrix 是默认不使用的，可以在 `application.yml` 添加配置启动：

```yaml
feign:
  hystrix:
    enabled: true
```

这样 feign 会默认使用 `HystrixFeign` 的 builder 构建 FeignClient，并为其添加默认的超时处理。其默认的超时时间为 1000 毫秒。我们可以通过为 WireMock 增加默认的延迟返回来测试这个超时处理：

```java
@ActiveProfiles("test")
@RunWith(SpringRunner.class)
@SpringBootTest
public class GitHubServiceTest {
    ...


    @Test(expected = HystrixRuntimeException.class) // 2
    public void should_fail_for_fetching_file() throws Exception {
        String rawMetaFileContent = "content";

        stubFor(
            get(urlEqualTo("/aisensiy/hello-project/master/meta.yml"))
                .willReturn(ok(rawMetaFileContent).withFixedDelay(5000))); // 1

        gitHubService.fetchRawFile("aisensiy/hello-project", "meta.yml");
    }
}
```

1. 我们通过 wiremock 所提供的 API 为其返回添加一个 5 秒的固定延时，其已经远远大于 Hystrix 默认 1 秒的超时了
2. 添加 expected，捕获超时产生的 `HystrixRuntimeException`


## hystrix fallback

对于一些应用，有了超时处理并在超时或请求失败的时候抛出异常就可以了。但是有的时候我们需要为请求添加一个默认的 fallback：也就是说如果请求失败了，我们需要给客户端返回点默认的结果，这个时候就可以使用 Hystrix 的 fallback 机制：

```java
@Component
public class GitHubServiceFallback implements AnotherGitHubService {
    @Override
    public String fetchRawFile(@PathVariable("git") String git, @PathVariable("filename") String filename) {
        return "NONE";
    }
}
```

我们声明一个和 `GitHubService` 一模一样的接口 `AnotherGitHubService` 用于测试 fallback 机制，然后创建一个 `GitHubServiceFallback` 类并实现相应的接口。

然后，我们在 `AnotherGitHubService` 中声明需要的 fallback 类：

```java
@FeignClient(
    value = "github", 
    url = "${github.url}", 
    fallback = GitHubServiceFallback.class)
public interface AnotherGitHubService {

    @GetMapping("/{git}/master/{filename}")
    String fetchRawFile(
        @PathVariable("git") String git,
        @PathVariable("filename") String filename);
}
```

然后我们在添加一个测试验证这个 fallback 是否工作：

```java
@Test
public void should_get_fallback_result() throws Exception {

    String rawMetaFileContent = "content";

    stubFor(
        get(urlEqualTo("/aisensiy/hello-project/master/meta.yml"))
            .willReturn(ok(rawMetaFileContent).withFixedDelay(5000)));

    String result = serviceWithFallback.fetchRawFile("aisensiy/hello-project", "meta.yml");
    assertThat(result, is(new GitHubServiceFallback().fetchRawFile("aisensiy/hello-project", "meta.yml")));
}
```

这次虽然添加了 5000 毫秒的延迟，但是一旦超过默认的 1 秒延时后就会使用默认的结果返回而不会抛出任何异常了。

## hystrix 断路器

讲到这里才了解到了 hystrix 的一些基本用法，Hystrix 自己实现了断路器的机制：通过请求窗口周期性判定调用服务的可靠性并按照一定的策略屏蔽不健康的系统，从而保证了自身系统的可靠性。

这里我们还是用过一些接口来展示其断路器的效果：

首先我们定义一个假的第三方服务：

```java
@Component
public class OtherService {
    public String run() {
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "OK";
    }
}
```

然后定义两个 API 对其进行调用：

```java
@RestController
public class Api {
    private OtherService otherService;

    public Api(OtherService otherService) {
        this.otherService = otherService;
    }

    @GetMapping("/safe")
    public String safe() {
        return new com.netflix.hystrix.HystrixCommand<String>(setter()) {
            @Override
            protected String run() throws Exception {
                otherService.run();
                return "OK";
            }
        }.execute();
    }

    @GetMapping("/unsafe")
    public String unsafe() {
        return otherService.run();
    }

    private com.netflix.hystrix.HystrixCommand.Setter setter() {
        return HystrixCommand.Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("External"))
            .andCommandKey(HystrixCommandKey.Factory.asKey("/safe"));
    }
}
```

其中 `/unsafe` 接口直接请求 OtherService 而 `/safe` 通过 Hystrix 包装后请求 OtherService。我们启动这个 Spring Boot 项目，并用 [apachebench](https://httpd.apache.org/docs/2.4/programs/ab.html) 分别对两个接口进行压测看看效果。

首先访问 /unsafe 接口

```bash
$ ab -n 200 -c 5 http://localhost:8080/unsafe

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.1      0       1
Processing:  2002 2011  29.7   2006    2196
Waiting:     2001 2011  29.1   2006    2192
Total:       2002 2011  29.7   2007    2197

Percentage of the requests served within a certain time (ms)
  50%   2007
  66%   2008
  75%   2008
  80%   2008
  90%   2010
  95%   2012
  98%   2195
  99%   2196
 100%   2197 (longest request)
```

可以看到所有的请求都保持了 2 秒以上的请求时间。

然后我们再请求一下 /safe 接口：

```bash
$ ab -n 200 -c 5 http://localhost:8080/safe

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.4      0       2
Processing:     3  137 351.8      5    1248
Waiting:        3  137 351.7      4    1248
Total:          3  137 351.8      5    1248

Percentage of the requests served within a certain time (ms)
  50%      5
  66%      6
  75%      7
  80%      8
  90%   1014
  95%   1016
  98%   1248
  99%   1248
 100%   1248 (longest request)
```

你会发现并不是所有的请求都会是在超过 1 秒后进行超时处理并返回，这就是断路器的效果：当 Hystrix 发现所访问的请求不能达到预期的时候其依据自己周期内请求的成功比例定义是否开启断路器功能。一旦开启断路功能，外部服务将被默认是失败的，在此期间 Hystrix 不再尝试请求服务而是直接返回 fallback 结果（或者抛出异常）。在 [Hystrix – managing failures in distributed systems](https://www.youtube.com/watch?v=-gL-nO2cqwU) 中，演讲者给出了一个很详细的示例展示了这个功能，如果想要更进一步了解断路器可以看看这个演讲。


# 相关资料

1. [Open Feign](https://github.com/OpenFeign/feign)
2. [Hystrix](https://github.com/Netflix/Hystrix/wiki)
3. [WireMock Stub](https://wiremock.org/docs/stubbing/)
4. [Talk: Hystrix – managing failures in distributed systems](https://www.youtube.com/watch?v=-gL-nO2cqwU)
