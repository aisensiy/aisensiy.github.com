---
layout:     post
title:      "在 Github Actions 中获取最最最新的 commit"
date:       2021-12-10 00:46:00 +08:00
author:     "Eisen"
tags:       [github-action, tricks]
---

有 helm charts 管理经验的人都晓得helm charts 发布后需要打包一个 tar 放到目录里面。helm 会要求一个特定的目录结构获取不同版本的 tar 包。在 openbayes 就有这么一个 helm charts 项目里面存放了一系列的 tar 包。目前来看这些 tar 包都很小（只有几百 K）为了方便部署，就直接把这些文件和 nginx 打包到镜像里了，部署起来就能直接提供服务了，没有其他对象存储之类的外部依赖。

我们也希望把打包部署的流程通过 github workflow 实现自动化。按照上面的描述，可以分成两个步骤：

1. release: 提交一个新 tag 触发 release 流程，将特定目录的文件达成 tar 包并以特定的名字保存到 packages 目录下，然后提交这个 tar 包
2. build-and-push: 创建一个新的镜像包含刚才打的 tar 包，并提交到镜像仓库

同时，为了适用 [reusable workflow](https://docs.github.com/en/actions/learn-github-actions/reusing-workflows) ，可调用的 workflow 必须是一个独立的 job 出现在调用方的 workflow 里。我们需要把上述两个工作分成 github workflow 中两个独立的 job：

```yaml
name: release a new helm version

on:
  ...

jobs:
  
  release:
    ...

  build-and-push:
    needs: release
    ...
```

但遇到一个很奇怪的问题，**在 release 中明明提交了新的内容，在 build-and-push 中却拿不到**。我的第一感觉就怀疑是 github 的 `actions/checkout@v2` action 的行为有点问题。简单搜索了下，发现 `actions/checkout@v2` 默认会获取触发这次 github workflow 的 commit。也就是说，虽然我在 release 有新的提交，但是我在下一步 build-and-push 的 job 里还是 checkout 了上一个 commit 而已。

查看 `actions/checkout@v2` 的 README 发现，如果想要修改上述的行为，需要修改其 `ref` 参数。修改成想要获取最新 commit 的 branch 名称即可。而具体在 github action 里则可以使用 `github.ref_name` （在 https://docs.github.com/en/actions/learn-github-actions/contexts#github-context 可以看到相关文档） 这个变量获取当前的 branch。这里我提供一个例子：

```yaml
name: test commit

on:
  push:
    branches:
      - master

jobs:

  make-commit:
    runs-on: ubuntu-latest 
    
    steps:
      - uses: actions/checkout@v2
      - run: |
          FILENAME=`date  +"%y%m%d%H%M%S"`.txt
          echo 123 > $FILENAME
          echo "::set-output name=$FILENAME"
        id: write
      
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "add ${{ steps.write.outputs.name }}"
  
  checkout-commit:
    needs: make-commit
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
        with:
          ref: ${{ github.ref_name }}   # <-------- 如果不修改这里就拿不到上面提交的文件
      - run: |
          ls -lh
```

我在 [github-checkout-test](https://github.com/aisensiy/github-checkout-test) 这个仓库里做了上述的 workflow 的测试。增加 `ref` 参数为 `${{ github.ref_name }}` 就可以获取最新的提交文件了。
