---
layout:     post
title:      "对目前校验与异常处理的总结"
date:       2020-11-22 18:16:00 +08:00
author:     "Eisen"
tags:       [spring, springboot, exception]
---

## 目前的问题

很久之前记录的一篇文章[在用 Spring MVC 构建 RESTful API 时进行验证和异常处理]({% post_url 2017-05-07-spring-mvc-error-handler %})，讨论了基本的 rest 的校验思路：

1. 区分 `FormObject` 和 `Domain Entity` 尽量以 user-case 的场景为每一个 input 做独立的校验；
2. 基本结构校验（Bean Validation）和业务校验（Service Business Logic）分别处理；
3. 基本结构校验在 MVC 层，通过 `ControllerAdvice` 和 `BindingResult` 对其校验内容做转换暴露给客户端；

在最近几年的项目里，基本还是依照这个思路来的。但是有以下几个痛点没有解决：

1. 业务逻辑和基本校验的逻辑很多时候边界很模糊，对于客户端来说，其实没什么区别，强行区分显得不是那么优雅；
2. 随着业务逻辑的越发复杂，大量的校验逻辑肯定是会放在 `application` 层的，那么关注点分离的需求愈发明显，将校验逻辑和正常流程区分才能让代码变得更清晰易懂；
3. `Exception` 的类别越来越多，报错信息五花八门，需要对其进行统一的梳理，并整理出一套规则，方便后续的维护开发套用；

## 目前的尝试

为了解决以上问题，曾经做过以下的改进：

对于第一条，并没有做处理，依然让业务逻辑和基本校验做了分离，尤其是对于那种需要触碰数据库的业务（比如查重）还是把它当作是业务逻辑的，仅仅是说通过 `BindingResult` 返回一致的报错结果了。这部分还是很希望能够把一些更复杂的校验也放到 Bean Validation 中去的。

对于第二条，首先在 `application` 层也提供了一个 `ValidationResult` 它实现了 `org.springframework.validation.Errors` 可是说是在 `application` 层 `BindingResult` 的同类了，这样子就可以在 `application` 层返回和 `web` 层一样的报错结果了。然后提出了一个 `Validator` 的概念，专门用来做校验工作。举一个例子，下面是一个创建 `AutoML` 的方法，可以看到第一步就是做校验：

```java
  public AutoML createAutoML(CreateModelCommand command) {
    autoMLValidator.validate(command);

    ...
  }
```

而 `AutoMLValidator` 内容如下：

```java
public class AutoMLValidator {
  ...

  void validate(CreateModelCommand command) {
    ValidationResult result = new ValidationResult();
    modelTemplateValidator.validate(command, result);
    autoMLNameValidator.validate(command, result);
    resourceValidator.validate(command, result);
    if (result.hasErrors()) {
      throw new InvalidRequestException(result);
    }

    autoMLDataBindingsValidator.validate(command, result);
    if (result.hasErrors()) {
      throw new InvalidRequestException(result);
    }

    parallelRunningCountValidator.validate(command, result);
    ClusterResource clusterResource = getResource(command.getResource());
    resourceRelatedValidator.validateJobLimitationAndComputationAndStorage(
        command.getOwner(), clusterResource);

    if (result.hasErrors()) {
      throw new InvalidRequestException(result);
    }
  }

  ...
}
```

可以看到，这里面使用了 `web` 层类似的逻辑：

1. 有一个和 `BindingResult` 等价的 `ValidationResult` 用于收集校验结果;
2. 当校验不通过时，抛出异常 `InvalidRequestException(validationResult)`;

这个方法很好的将业务逻辑异常拆出来了，还是很能解决问题的，也没太多副作用。硬要说的话就是 `ValidationResult` 有点难看，`InvalidRequestException` 有点像是 web 层漏到 application 层了，应该用个更好的类替代。

对于第三点，整理出了一个类 `ErrorCode` 用来安放 `ErrorCode` 与 `ErrorMessage`：

```java
public enum ErrorCode {
  TRANSFER_REQUEST_TARGET_USER_EXISTED("资源已经有目标用户，请先将之前请求撤销"),
  RESOURCE_NAME_NOTMATCH(" 资源名称不匹配"),
  RESOURCE_TRANSFER_TO_SELF(" 不许与资源拥有者将资源传递给自己"),

  RESET_PASSWORD_MISMATCH("无效的验证码"),
  CODE_MISMATCH("无效的验证码"),

  ...
  

  private String message;

  ErrorCode(String message) {
    this.message = message;
  }
}
```

在具体的报错的时候将 ad-hoc 的报错替换成这样的 KV 对即可。很显然这个写法有点像一个低配版本的国际化方案，显得有点拙劣，干嘛不直接换成 i18n 的 messages 呢？并且这个报错的格式也没有做统一，依然显得有点混乱。

为了进一步的解决以上依然存在的问题，最近也开始重新看了 spring / springmvc / springboot 异常处理和校验的一些内容，后面应该会做以下事情：

1. 梳理目前 spring exception 的方式
2. 提出适合当前项目的最佳实践
3. 对目前的校验做改进，提出校验方面的最佳实践
