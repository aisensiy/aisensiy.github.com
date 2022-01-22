---
layout:     post
title:      "vim 里自动更新 markdown 格式"
date:       2022-01-22 15:06:11 +08:00
author:     "Eisen"
tags:       [vim, markdown, autocorrect]
---

## 问题

写 blog 的时候经常需要做中英文混排，然后这个混排为了美观需要在中和英文之间添加空格。现在形成习惯了，看到别人没有在中英文混排里添加空格都觉得有点难受。不过之前这个格式要求都靠自己敲空格敲出来的，感觉效率有点低下，恰巧发现了 [autocorrect](https://github.com/huacnlee/autocorrect) 这个工具，可以实现这个功能，这里尝试把它和我写 blog 用的 neovim 集成下实现自动格式化的功能。

## 思路

首先 `autocorrect` 本身已经是一个二进制文件了，通过如下命令可以实现对文件的处理：

```sh
$ autocorrect --fix <filepath>
```

因为 vim 有一些插件可以实现在保存的时候对文件进行格式化而 autocorrect 的处理也可以认为是一种格式化因此思路就很一致了。不过相较于很多格式化工具可以以文本内容的方式传递，autocorrect 只能对文件做修改，流程上会稍微有一点区别。这里我列一下集成思路：

1. 确定内容更新的时机，由于 autocorrect 只能对文件做处理（而不是传递一段文本）因此必须要在文件更新后再次执行该命令对文件做二次刷新，vim 有一个 `autocmd` 的命令，可以某些重要的事件发生时（或者发生前后）执行一系列命令，这里就需要监听 `BufWritePost` 即当 Buf 写成功后执行一个命令
2. 文件被 autocorrect 更新后需要重新读取，否则当前看到的内容就不是已经做过格式化的内容了，vim 中通过命令 edit 可以将文件重新读取，redraw 命令则可刷新视图
3. 目前只考虑对 markdown 文件做上述处理，需要首先判别文件类别，只有符合的类别才能做上述处理


## 具体实现方式

我使用的是 neovim 这里就按照它的配置结果做了实现，vim 的实现也是类似的，只是具体的目录结构会有略微区别而已。

[`.config/nvim/after/ftplugin/markdown.vim`](https://github.com/aisensiy/dotfiles/blob/master/nvim/after/ftplugin/markdown.vim):

```vim
function! MarkdownFormat()
  silent !autocorrect --fix '%:p' "3
  let view = winsaveview()        "4 
  silent edit                     "5
  call winrestview(view)
  redraw!                         "6
endfunction

augroup markdownFormat            "1
  autocmd!                        "2
  autocmd BufWritePost * if &filetype ==# 'markdown' | call MarkdownFormat() | endif "7
augroup END
```

具体做一些解释：

1. `augroup` 相当于设置命名空间保证这个 autocmd 不影响其他的 autocmd
2. `autocmd!` 是清理当前 `augroup` 下的所有 `autocmd` 没有这命令会发现不知不觉每次保存的时候 autocorrect 会执行多次，具体什么原因我尚不清楚，毕这也是我第一次折腾这些命令，后续如果有更多了解会做更多记录
3. `slient !autocorrent --fix '%:p'`
   1. 执行外部的命令要加 `!`
   2. 添加 `slient` 是为了不要展示其执行的结果，我们只关心它执行了，不想看到它的返回内容
   3. `'%:p'` 就是当前文件的绝对路径
4. `winsaveview` 是保当前视图的一些信息，并且在重新加载文件后恢复，为的是不要让正在编辑的文件的视图位置、光标位置发生跳动提升体验
5. `slient edit` 是重新加载文件
6. `redraw!` 是刷当前视图
7. `if &filetype ==# 'markdown'` 是判断当前文件格式是否为 markdown 只有是 markdown 的时候才这行这个 autocmd

## 效果

`video: /videos/vim-autocorrect-integration.mp4`
