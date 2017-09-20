---
layout:     post
title:      "把 Spring Boot 1.5.3 与 MyBatis 集成"
date:       2017-05-04 19:00:00 +08:00
author:     "Eisen"
tags:       [java, spring-boot, spring-mvc, web, test, mybatis]
---

# 为什么选择 MyBatis

在 Martin Fowler 的[企业应用架构模式](https://book.douban.com/subject/4826290/)中介绍了四种关系数据库处理的模式。对于比较复杂的应用，比较常见的就是 *active record* 模式和 *data mapper* 模式。*active record* 正如 `rails` 的 `activerecord` 将面向业务的领域模型与数据实现绑定起来，Hibernate 和 JPA 就是采用的这种模式，通过标注可以将一个领域对象映射到数据库表中。而 *data mapper* 则强调领域模型和关系型数据库（当然，实际上也可以处理 noSQL 的）的数据结构是有差异的，需要一个 mapping 处理两者的差异，不能将两个东西融合成一个，这就是 MyBatis 所提供的能力。虽然如今的 Spring Data 已经非常的强大了，通过简单的接口声明就能够创建一个可以完成 `CRUD` 的 `Repository`，通过在对象之间建立关联关系就能处理更复杂的联表查询。但是这样子依然不能解决一系列的问题：

1. 数据模型与领域模型的绑定：我还是需要把一个领域对象通过注解直接映射到数据对象，但是有的时候我的领域对象是一个聚合根（Aggregate Root），它包含一系列实体（Entity）和值对象（Value Object），这简单的注解做不到呀，我还是需要耗费很多的力气去做 `convertor`，那么使用 JPA 的优势就不再明显了。
2. 实现读写分离难度大，正如我在 [some tips for ddd]({% post_url 2016-04-20-some-tips-for-ddd %}) 中所说的，**DDD 关注的是一个写模型，关注领域的构建以及模型内数据的一致性**。然而 JPA 实际上并没有考虑到这一点，它默认的实现是希望有一个统一的模型，不考虑读写模型的区别，而在这个基础上对其做读写的分离其难度是大于灵活性更强的 MyBatis 的。
3. 通常在采用 rest api 进行数据展示的 GET 方法中所提供的数据是读模型中的数据，会使用大量的多表 join 以及参数的直接或间接映射，其实采用 jpa 的注解进行包裹反而显得不方便了。我不认为 spring data 提供的那种查询可以很好的处理，至少在我参与的稍微复杂的项目中，内嵌在 JpaRepository 中的 `@Query` 注解和 `sql` 语句随处可见。
4. 和 rails 的 `activerecord` 相比，它还是不够好用...说的挺让人伤心的，但是的确如此，努力了这么多年，就是做了一个 `activerecord` 的弱化版。那些快速的、用于忽悠的 `CRUD` 样例到目前为止，能和 rails 的脚手架比么...而且之前也提过，这种玩具代码毫无意义，我们需要的是可以处理复杂应用的情况，不然为啥不用 rails？

另外，不论是 DDD 的书籍，还是 [Applying UML and Patterns](https://book.douban.com/subject/1440149/) 或者是 Spring 的开山鼻祖 Rod Johnson 的 [expert one-on-one J2EE Development without EJB](https://book.douban.com/subject/1436131/) 都在强调能够很好的实施面向对象的体系才是好的体系。MyBatis 做为一个 Data Mapper 的实现模式，完全的独立与业务对象，加上它 `type handler` `discriminator` 的这些机制，可以很好的支持灵活的数据转换方式以及对象的多态机制。绝对是复杂业务系统的不二之选。

# 集成 Spring Boot 与 MyBatis

MyBatis 提供了一个 `starter` 用于和 Spring Boot 的集成。`build.gradle` 如下：

```groovy
buildscript {
    ext {
        springBootVersion = '1.5.3.RELEASE'
    }
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath("org.springframework.boot:spring-boot-gradle-plugin:${springBootVersion}")
    }
}

apply plugin: 'java'
apply plugin: 'idea'
apply plugin: 'org.springframework.boot'

version = '0.0.1-SNAPSHOT'
sourceCompatibility = 1.8

repositories {
    mavenCentral()
}


dependencies {
    compile('org.flywaydb:flyway-core')
    compile('org.mybatis.spring.boot:mybatis-spring-boot-starter:1.3.0')
    compile('org.springframework.boot:spring-boot-starter-web')
    runtime('com.h2database:h2')
    compileOnly('org.projectlombok:lombok')
    testCompile('org.springframework.boot:spring-boot-starter-test')
    testCompile('org.mybatis.spring.boot:mybatis-spring-boot-starter-test:1.3.0')
}
```

可以看到，首先我引用了 `flyway` 做数据 migration。然后我只用了一个 h2 内存数据库，然后除了 `mybatis-spring-boot-starter` 之外还有一个 `mybatis-spring-boo-starter-test` 后面会讲到它。

这里我们举一个简单的例子，展示用 MyBatis 创建一个 `Repository` 的方式。有关 *Repository* 概念的内容可以在[这里]({% post_url 2016-05-17-ddd-repository %})看到。

```java

// User.java
@Data // [1]
public class User {
    private final String id;
    private final String username;

    public User(String id, String username) {
        this.id = id;
        this.username = username;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id) &&
            Objects.equals(username, user.username);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, username);
    }
}

// UserRepository.java
@Repository
public interface UserRepository {
    void save(User user);

    Optional<User> findById(String userId); // [2]
}

// MyBatisUserRepository.java
@Repository
public class MyBatisUserRepository implements UserRepository {
    @Autowired
    private UserMapper mapper; // [3]

    @Override
    public void save(User user) {
        mapper.insert(user);
    }

    @Override
    public Optional<User> findById(String id) {
        return Optional.ofNullable(mapper.findById(id));
    }
}

// UserMapper.java
@Component
@Mapper
public interface UserMapper {
    void insert(@Param("user") User user);

    User findById(@Param("id") String id);
}
```

在业务领域，只有 `User` `UserRepository` 而在具体的实现上，是采用了 `MyBatisUserRepository` 以及其所依赖的 `UserMapper` 具体的实现隐藏的很深，好处就是支持未来对其进行替换。

>当然，很多时候、很多人都说尼玛这种替换怎么可能，很明显是想多了。但实际上我觉得未必如此，很多时候数据库的切换不一定是说你已经积攒了 2TB 数据了才去这么做，比如在开发的末期出现了一些严重影响架构的因素导致需要对数据库进行调整，你说这时候算早还是算晚呢？而且，通过技术手段尽量延迟决定本来就是一个很好的思路。再者，测试环境和生产环境采用不同的 Repository 也是很常见的情况呀，硬绑定了不就都变成集成测试了吗。

其中在代码中 `[1]` 的那个注解 `@Data` 源自 [lombok](https://projectlombok.org/) 大大减少了 java 的模板代码。

# 测试 MyBatis

前面提到的 `mybatis-spring-boot-starter-test` 这里要排上用场了。它提供了一个超超超好用了注解 `MyBatisTest`，官方对其解释如下：

> By default it will configure MyBatis(MyBatis-Spring) components(SqlSessionFactory and SqlSessionTemplate), configure MyBatis mapper interfaces and configure an in-memory embedded database. MyBatis tests are transactional and rollback at the end of each test by default.

也就是说，它会自动的帮助创建 embedded database 并且自动的采用 transactional 以及 rollback。有了它我们真是只需要关注业务逻辑就行了。下面是对 `MyBatisUserRepository` 的测试。

```java
@RunWith(SpringRunner.class)
@MybatisTest
@Import(MyBatisUserRepository.class)
public class MyBatisRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    public void should_save_user_success() throws Exception {
        User user = new User(UUID.randomUUID().toString(), "abc");
        userRepository.save(user);
        Optional<User> userOptional = userRepository.findById(user.getId());
        assertThat(userOptional.get(), is(user));
    }
}
```

详细内容见 [mybatis-spring-boot-test-autoconfigure](http://www.mybatis.org/spring-boot-starter/mybatis-spring-boot-test-autoconfigure/)

# 其他

最后还是要讲一些集成的额外内容。

1. flyway 要求在项目的 `src/main/resources` 下有 `db/migration` 的目录，目录中的 migration 脚本以 `V1__name` `V2__name` `V3__name` 格式命名。更多内容见 [flyway 官网](https://flywaydb.org/)。
2. Mybatis 需要配置一个 mybatis-config.xml 文件，并在 `src/main/resources/application.properties` 做一些配置。
3. 如果使用 XML 定义 Mapper 还需要在 `application.properties` 或者 `mybatis-config.xml` 中指定 Mapper 的位置

完整的项目见 [Github](https://github.com/aisensiy/demo-for-springboot-mybatis)
