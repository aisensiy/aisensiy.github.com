---
layout:     post
title:      "Python Data Science, NumPy 2"
date:       2017-03-31
author:     "Eisen"
tags:       [python, data-science, numpy]
---

这篇文章延续[Python Data Science, NumPy 1]({% post_url 2017-03-18-python-data-science-1%})，介绍广播、高级索引以及数组排序。

## 广播

广播是在长度不同的数组上执行 ufunc（例如，加法，减法，乘法等）的一组规则。

对于大小相同的 NumPy 数组是逐个元素执行计算的：

```python
a = np.array([0, 1, 2])
b = np.array([5, 5, 5])
a + b
# array([5, 6, 7])
```

广播允许对不同大小的数组执行这些操作 - 例如，我们可以将一个标量（想象它是一个 0 维数组）和一个数组相加：

```python
a + 5
# array([5, 6, 7])
```

我们可以认为是这个操作首先把 5 转换为了数组 [5, 5, 5] 然后进行运算。NumPy 广播在实际运算中并没有这么做，但是我们可以借用这个思路来理解广播。

当然，对于更高维的数组也是可以的：

```python
M = np.ones((3, 3))
M + a
# array([[ 1.,  2.,  3.],
#        [ 1.,  2.,  3.],
#        [ 1.,  2.,  3.]])
```

一维数组 a 在第二维被拉伸（或者说是在第二维被广播）以便匹配 M 的维度。

还有更复杂的情况：即两个数组各自广播后计算：

```python
a = np.arange(3)
b = np.arange(3)[:, np.newaxis]
a + b
# array([[0, 1, 2],
#        [1, 2, 3],
#        [2, 3, 4]])
```

事实上，NumPy 是严格按照一些规则进行广播运算的：

- 规则1：如果连个数组的维度不同，那么维度较少的数组在自己当前维度的前面填充长度为 1 的维度。
- 规则2：如果两个数组任意一个维度的长度不符，那么在这个维度上长度为 1 的那个数组在该维度上进行拉伸，即填充同样的数据以适应另一个数组。
- 规则3：如果任意维度上长度不等，但两个数组在该维度的长度都不是 1，则报错

下面用几个例子进行说明。

### 示例 1 

```python
M = np.ones((2, 3))
a = np.arange(3)
M + a
```

其中 

* M.shape = (2, 3)
* a.shape = (3)

按照规则 1 a 的维度少，在其前面补充维度：

* a.shape -> (1, 3)

按照规则 2 第一维两者不同，所以对 a 进行拉伸：

* a.shape -> (2, 3)

然后再进行相加。

### 示例 2

```python
a = np.arange(3).reshape((3, 1))
b = np.arange(3)
```

* a.shape = (3, 1)
* b.shape = (3)

按照规则 1 b 扩充维度

* b.shape = (1, 3)

按照规则 2 长度为 1 的维度扩充：

* a.shape = (3, 3)
* b.shape = (3, 3)

```python
a + b
# array([[0, 1, 2],
#        [1, 2, 3],
#        [2, 3, 4]])
```

### 示例 3

```python
M = np.ones((3, 2))
a = np.arange(3)
```

* M.shape = (3, 2)
* a.shape = (3)

按照规则 1 扩充 a 的维度

* a.shape = (1, 3)

按照规则 2 a 被拉伸

* M.shape = (3, 2)
* a.shape = (3, 3)

然而此时两者的第二维没有一个为 1 但又不相当，按照规则 3 报错。

## 比较、掩码、布尔运算

上一部分介绍了 NumPy 有很多向量化快速运算的 universal functions，但是只介绍了算术运算的那些 ufuncs 实际上还有很多布尔运算的 ufuncs。

```python
x = np.array([1, 2, 3, 4, 5])
x < 3
# array([ True,  True, False, False, False], dtype=bool)
x == 3
# array([False, False,  True, False, False], dtype=bool)
```

可以看到这些运算的结果是一个布尔类型的长度相同的数组。布尔数组可以用于很多便捷的运算。

```python
x = np.array([[5, 0, 3, 3], [7, 9, 3, 5], [2, 4, 7, 6]])

np.count_nonzero(x < 6)
# 8
np.sum(x < 6)
# 8
```

其中 `np.count_nonzero` 可以用来计算 `True` 元素的个数，当然还可以用 `np.sum` 达到同样的目的，因为 `False` 会被认为是 0 而 `True` 会被转换为 1。

还有一些其他类似的操作：

```python
np.any(x > 8)
# True
np.all(x < 10)
# True
```

当然，这些运算都可以添加 `axis` 参数按照不同的轴进行运算。

```python
np.all(x < 8, axis=1)
# array([ True, False,  True], dtype=bool)
```

**注意** Python 有内置的 `sum()` `any()` 和 `all()` 函数，它们和 NumPy 中的运算略有区别，尤其是在用于多维数组的情况。一定要确保自己用的是 `np.sum()` `np.any()` 以及 `np.all()`。

处理基本的 `>` `<` `!=` `==` `>=` `<=` 之外，还可以用 `&`（与） `|`（或） `^`（异或） `~`（否） 进行复合布尔运算。比如

```python
np.sum((inches > 0.5) & (inches < 1))
```

就是 `inches > 0.5` 与 `inches < 1` 的 `与` 操作。注意考虑到运算符的优先级，这里的两个括号是必须的。

在前面的部分我们看到可以直接对布尔数组进行聚合。一个更强大的方式是使用布尔数组作为掩码来获取数据本身的特定子集。回到之前的 x 数组，假设我们想要一个数组中所有小于 5 的数据，我们可以这么做：

```python
x[x < 5]
```

结果返回一个一维数组，其元素为满足条件式的所有数据；换言之获取的是所谓索引为 True 的元素。这些运算可以让我们轻易的获取想要的结果。

## Fancy Indexing

Fancing indexing 的概念非常简单：用索引数组访问多个数组元素。举一个例子：

```python
import numpy as np
rand = np.random.RandomState(42)

x = rand.randint(100, size=10)
print(x)
# [51 92 14 71 60 20 82 86 74 74]
```

如果我们想要访问其中三个元素，我们可以这样做：

```python
ind = [3, 7, 4]
x[ind]
# array([71, 86, 60])
```

使用 fancy indexing 的时候，结果的形状与索引数组的形状（而不是原数组的形状）保持一致：

```python
ind = np.array([[3, 7],
                [4, 5]])
x[ind]
# array([[71, 86],
#        [60, 20]])
```

Fancy indexing 也支持多维数组，看下面这个例子：

```python
X = np.arange(12).reshape((3, 4))
# array([[ 0,  1,  2,  3],
#        [ 4,  5,  6,  7],
#        [ 8,  9, 10, 11]])
```

和一般的索引类似，第一个索引对应行，第二个索引对应列：

```python
row = np.array([0, 1, 2])
col = np.array([2, 1, 3])
X[row, col]
# array([ 2,  5, 11])
```

我们可以把普通索引与 fancy indexing 一起使用：

```python
X[2, [2, 0, 1]]
# array([10,  8,  9])

X[1:, [2, 0, 1]]
# array([[ 6,  4,  5],
#        [10,  8,  9]])
```

我们还可以把掩码和 fancy indexing 一起使用：

```python
mask = np.array([1, 0, 1, 0], dtype=bool)
X[row[:, np.newaxis], mask]
# array([[ 0,  2],
#        [ 4,  6],
#        [ 8, 10]])
```

## 排序

`np.sort` `np.argsort` 基本就是数组排序的全部内容了，NumPy 中的 np.sort 比 Python 的 sort sorted 要快的多。如果需要进行局部排序参见 `np.partition` 的内容，这里不在赘述了。