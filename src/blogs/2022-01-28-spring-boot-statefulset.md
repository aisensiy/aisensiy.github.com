---
layout:     post
title:      "使用 statefulset 实现 spring boot 项目的主从区分"
date:       2022-01-28 16:44:11 +08:00
author:     "Eisen"
tags:       [statefulset, kubernetes, java, springboot]
---

最近在做几个小服务的重构，希望把拆出来的小服务放回主服务里面，有这么几个方面的考虑：

1. 小服务本身和主服务是从属关系，完全服务于主服务，合并回去完全没有什么业务上的障碍
2. 合并之后感觉业务的内聚性更好了，可以减少一些外部接口，改为模块间直接调用，获取更好的性能
3. 当然从部署上，部署一个东西总是比部署两个东西要好一些，而且这种小服务真的很小，没有为原来的系统增加什么负担

不过既然想到合并，那么就是回顾下当初为什么拆分成两个：

1. 感觉有点过度工程化思维了，本来以为这个功能会变得越来越复杂，但事实并没有
2. 技术上有点点小困难，因为这个小服务不能像主服务那样自由的创建多个副本，原则上一套服务应该只有一个运行，合并到一起似乎做不到，就干脆拿出来了，那合并回来就需要解决这个问题

这里记录的内容基本都是针对上面的多副本处理的，即如何让 spring boot 的项目在可以多副本的情况下只让其中一个副本运行额外的内容。

## 区分主 / 从服务

所有的服务都是部署在 k8s 里的，之前主服务是一个 `Deployment` 每个副本没有任何区别，既然考虑到有主从概念，那第一个想到的就是切换为 `Statefulset`。它每一个副本是的名字是固定的，比如服务叫 `main-server` 那第一个副本就是 `main-server-0` 第二个就是 `main-server-1` 依次类推。每一个副本是固定的，每次做新的部署都会从高序号开始逐个替换。因此，可以把序号 `0` 的认为是「主服务」，其他就是「从服务」。然后在「主服务」中运行额外的子服务，其他副本则不运行。

`Statefulset` 的 `Pod` 启动后其 `HOSTNAME` 会被修改为其 `Pod` 的名字，那么对于 `main-server-0` 在 `Pod` 里的每个容器里看到的 `HOSTNAME` 也就是这个名字了。因此 spring boot 就可以通过这个名字最后是不是以 `-0` 结尾来区分是不是「主服务」进而去做进一步的操作。

不过直接判断 `HOSTNAME` 就会让测试环境比较尴尬了，不能说每次修改 `HOSTNAME` 来实现不同的运行模式吧，因此这里还是在 `Statefulset` 启动的时候做了个处理去设置另外一个环境变量 `SERVER_ROLE`:

```diff
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: main-server
  labels:
    app: main-server
spec:
  serviceName: "main-server"
  replicas: 1
  selector:
    matchLabels:
      app: main-server
  template:
    metadata:
      labels:
        app: main-server
    spec:
      topologySpreadConstraints:
        - labelSelector:
            matchLabels:
              app: main-server
          maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
      containers:
      - name: main-server
        image: openbayes/main-server
+       command: ["sh"]
+       args: 
+       - "-c"
+       - "[ ${HOSTNAME##*-} = '0' ] && export SERVER_ROLE=master; exec web"

...
```

`#{HOSTNAME##*-}` 是截取最后一个 `-` 后面的部分，这个算是 shell 的一个黑魔法吧，相关的内容见 [Advanced Bash Scripting Guide](https://tldp.org/LDP/abs/html/string-manipulation.html)。然后如果是 "0" 就设置一个环境变量 `SERVER_ROLE=master`，然后在执行主程序，就是 `web`。

`SERVER_ROLE` 也不是随便来的，它对应了 spring boot 项目下 [`application.yml`](https://github.com/aisensiy/springboot-scheduler-example/blob/master/src/main/resources/application.yml) 的 `server.role` 字段。而这部分就为后面动态加载做了准备。

**注意** 从 `Deployment` 切换到 `StatefulSet` 后，默认的 `Rolling Update` 策略会发生变化，如果 `replica=1` 是无法实现无缝部署的，也就是说 `main-server-0` 会先关掉然后再启动，所以最好还是让 `replica>=2`。
 
## 动态加载 Spring Configuration

事实上这部分是 spring boot 的看家本领，它就是通过各种 autoconfiguration 让 spring 的使用变得非常的容易的。这里使用了 `@ConditionalOnProperty` 注解实现了配置的动态加载。

```diff
  @Configuration
+ @ConditionalOnProperty(value = "server.role", havingValue = "master")
  @EnableScheduling
  public class SchedulerConfig {
  
    @Service
    @Slf4j
    public static class Runner {
      @Scheduled(fixedDelay = 5000)
      public void run() {
        log.info("Scheduler is running");
      }
    }
  }
```

当 `server.role == master` 时，该 `Configuration` 才会生效，并且执行里面的 `Runner`。效果如下：

`video: /videos/conditionalonproperty.mp4`

完整的 demo 内容见 [springboot-scheduler-example](https://github.com/aisensiy/springboot-scheduler-example)。
