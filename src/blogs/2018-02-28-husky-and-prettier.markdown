---
layout:     post
title:      "用 husky 和 prettier 保证团队代码格式一致性"
date:       2018-02-28 14:33:00 +08:00
author:     "Eisen"
tags:       [react, javascript]
---

好久没有写博客，久到在刚想到写一篇博客的时候要打开哪个编辑器都楞了一下。今天介绍一下两个小工具 `husky`（对，哈士奇，2哈）和 `prettier`。我认为他们的出现减轻了软件开发流程中一些痛点。

## husky 为 git commit 增加钩子

在之前的工作中，我们尝试通过在 git 的 `pre-receive` 阶段嵌入一系列的 ci 流程处理代码以提供给开发者们 "just push" 的开发流程（当然这个想法是完完全全源自  heroku 的）。这个流程将原先的 "push -> wait for verify -> new correct commit -> repush" 的流程转变为 "push -> fail -> correct -> repush"：如果没有在 "pre-receive" 阶段设置门禁的话，坏的提交会被同步到中心仓库后在进行检测；而设置门禁之后坏的 commit 会被拒绝在本地，本地只能将 ci 可以通过的代码提交到中心仓库。但是将所有东西都通过 push 验证很显然是慢了一些：这就像表单的前端验证和后端验证一样，虽然后端验证永远必不可少但是它增加了服务器的负担并且延长了反馈周期。

这时候 `husky` 就要派上用场了。`husky` 其实就是一个为 `git` 客户端增加 hook 的工具。将其安装到所在仓库的过程中它会自动在 `.git/` 目录下增加相应的钩子实现在 `pre-commit` 阶段就执行一系列流程保证每一个 commit 的正确性。部分在 cd `commit stage` 执行的命令可以挪动到本地执行，比如 lint 检查、比如单元测试。当然，`pre-commit` 阶段执行的命令当然要保证其速度不要太慢，每次 commit 都等很久也不是什么好的体验。

## prettier 保证每个团队代码格式一致性

多少年来开发者在使用 tab 还是 space 的问题上真是花费了不少的时间，美剧硅谷里主角还因为 tab 和别人闹了一集，可见大家对代码格式化的重视程度-_-。记得我在上一个项目里看到有小哥把我的代码强行刷成他满意的格式的 commit 也非常不满。仅仅修改格式的 commit 是毫无必要的，它没有对软件本身的行为做任何的修改，而夹带了修改格式的 commit 更是令人抓狂的，给 review 的同学也带来了不小的负担（在一坨提交里仔仔细细看了半天发现神马也没变！！尼玛！！）。

`golang` 取了个巧，语言自带官方格式，你们终于不吵了吧。虽然会有时候看 `golang` 的格式化结果略微有点麻烦（就是 struct 对 json type 的制表符对齐的要求），但是也没有哪里是让人无法忍受的丑。如果其他的语言也以类似的方式制定一个官方格式是不是就会将此事平息下去呢。当然，我们可以在制定这个官方格式的时候吵架，只要官方格式不会三天两头的更新那在实际项目中为这种不必要的分歧导致浪费大把时间了。

在我看来 `prettier` 就是这么一个 "类官方格式" 了。不过目前它还只是支持 `js` 体系下的格式化，其他语言由于这样那样的问题还要再等等。

大家对有个公认的格式这件事还是非常认可的，项目出现一年，Github star 破 2.1w，并且像 facebook 这样的大公司已经在内部逐渐铺开使用了。

## 集成

最后，通过 husky 为 `prettier` 在 `pre-commit` 加个钩子，这体验就更完美了：不论你家的格式是什么样子，只要你想提交，就必须格式化成 `prettier` 要求的样子，这样就没有那种因为格式变动出现的无聊的 `diff` 了。集成的流程基本是以下这个样子：

1. 添加 prettier 依赖

    ```bash
    yarn add prettier --dev --exact
    ```
    
2. 测试格式化是否工作

    ```bash
    yarn prettier -- --write src/index.js
    ```
    
3. 在 commit 时执行 prettier

    ```bash
    yarn add pretty-quick husky --dev
    ```
        
    修改  `package.json` 添加 pre-commit 钩子
    
    ```js
    {
      "scripts": {
        "precommit": "pretty-quick --staged"
      }
    }
    ```

其实官方文档也有，但是官方文档可耻的写错了...第二步命令少了 `--` 的命令。

最后的最后，放一段 `prettier` 格式化的 `react` 代码，我还是对其默认的格式非常满意的。

```js
class Badges extends React.Component {
  componentDidMount() {
    let { user, loadBadges } = this.props;
    loadBadges(user.username);
  }

  render() {
    let { badges } = this.props;
    return (
      <div style={{ marginTop: "50px" }}>
        <h1>已经获得的成就</h1>

        <Row
          gutter={16}
          type="flex"
          justify="center"
          align="top"
          style={{ marginTop: "20px", paddingBottom: "10px" }}
        >
          {badges.map(badge => (
            <Col
              lg={6}
              md={6}
              sm={8}
              xs={12}
              style={{ marginBottom: "1em" }}
              key={badge.project.id}
            >
              <ProjectBadge badge={badge} />
            </Col>
          ))}
        </Row>
      </div>
    );
  }
}
```

## 相关资料

1. [Prettier](https://prettier.io/)
2. [Husky](https://github.com/typicode/husky)
3. [Using Prettier and husky to make your commits safe.](https://medium.com/@bartwijnants/using-prettier-and-husky-to-make-your-commits-save-2960f55cd351)
4. [git-hooks](https://git-scm.com/docs/githooks)
5. [The Commit Stage](https://www.informit.com/articles/article.aspx?p=1621865&seqNum=4)
6. [Formats Go programs](https://golang.org/cmd/gofmt/)

