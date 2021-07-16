---
layout:     post
title:      "Python Data Science, NumPy 1"
date:       2017-03-18
author:     "Eisen"
tags:       [python, data-science, numpy]
---

NumPy（Numerical Python 的简称）提供了 Python 中高效计算的数据结构以及丰富的数据处理方法。Numpy 的 array 和 Python 的 list 接口非常相似，但 Numpy 却要比 list 快的多。NumPy 目前几乎是 Python 整个数据科学工具体系的核心，所以无论数据科学的哪个方面对你感兴趣，花费时间来学习使用 NumPy 的是非常值得的。

我们这里要讲的 NumPy 版本为 `1.11.1` 可以通过如下的方法在 Python  中查看：

```python
import numpy
numpy.__version__
```

然后使用 NumPy 的时候基本都是用 `np` 作为引入的缩写：

```python
import numpy as np
```

所以后面如果看到 `np.xxx` 的地方就知道是在用 `numpy` 了。

NumPy 这一章节包含两部分内容，一部分讲述其基础数据结构，里面涉及了一些很基础的、大家可能还没有深究的问题，比如为什么它比 Python 的 list 快很多、为什么它用起来和 list 非常相似，这也是这部分重点介绍的部分。另一部分就是介绍 NumPy 中都包含了什么基本的函数，这一部分的很多内容都可以通过文档查询的到，不过这里会讲述一些常用的以及让人迷惑的函数的用法。

虽然我已经尽量略去了那些额外的示例以及大部分人很少涉及到的犄角旮旯，但是这一部分依然会被分割为两个部分进行讲解，这一部分介绍了 NumPy 的基本数据结构以及其快速运算的原理以及基本的数据操作，下一部分介绍 NumPy 的广播运算、高级索引以及排序。

## Python 的数据类型

### Python Int 不仅仅是 Int

Python 属于动态类型语言，其变量在声明时是不需要定义其类型的，并且一个变量也可以被赋值为任意类型。比如：

```python
x = 4
x = "four"
```

在 Python 中是合法的，而在 C 这样的静态类型语言中这样就会报错：

```c
int x = 4;
x = "four";
```

动态类型增加了 Python 的易用性，但在实际运算的过程中 Python 的解释器总是要知道当前的这个变量到底存储的是什么类型以便进行相应的计算的，因此 Python 的变量不仅仅包含了数值，也包含了其类型的信息。

默认的 Python 语言是由 C 语言编写，并且 Python 的变量就是一个 C 的结构体。例如当我们在 Python 中定义一个整型：x = 100000，x 不是一个纯粹的整数，它是一个指向一个 C 语言结构体的指针。如果我们查看 Python 3.4 的源码就可以看到实现 Python 中的整型（实际上是长整型）的代码如下（其中的一些 C 语言宏已经被展开了）：

```c
struct _longobject {
    long ob_refcnt;
    PyTypeObject *ob_type;
    size_t ob_size;
    long ob_digit[1];
};
```

可以看到，除了保存了真正的数据的 `ob_digit` 之外，Python 还保存了引用计数器、类型、数据长度这三个信息。

### List 也不仅仅是数组

Python 的 list 中的每一个元素可以是不同的类型，比如：

```python
L3 = [True, "2", 3.0, 4]
```

是合法的。不过在这里灵活性在需要进行大量的数据操作的时候就成为了一种负担：为了允许动态类型，list 中的每一个元素都需要包含它自己的类型信息、引用计数以及其他信息。在这里所有的变量的类型是一样的，每个元素所包含的类型信息是冗余的，如果可以用固定类型数组来保存则会高效的多。

## NumPy 数组

与 Python list 不同，NumPy array 的所有元素类型相同。如果类型不同 NumPy 会进行类型转换（这里，整型被转为浮点类型）：

```python
np.array([1, 2, 3, 4], dtype='float32')
```

如上，我们可以利用 Python 的 list 来创建 Numpy 的数组，也可以利用 NumPy 提供的函数来创建数组：

```python
np.zeros(10, dtype=int) # 创建一个长度为 10，数据类型为整型，数据全为 0 的数组
np.ones((3, 5), dtype=float) # 创建一个 3x5 的二维数组，数据类型为浮点型，数据全为 1
np.full((3, 5), 3.14) # 创建一个 3x5 的数组，数据全为 3.14

# 创建一个由线性序列填充的数组
# 从 0 到 20，步长为 2
# 与 Python 内建的 range 方法类似
np.arange(0, 20, 2)

# 创建一个从 0 到 1 均匀分割为 5 个元素的数组
np.linspace(0, 1, 5)

# 采用均匀分布创建一个 3x3 的数组
# 默认均匀分布范围从 0 到 1
np.random.random((3, 3))

# 采用高斯分布生成的值填充的 3x3 的数组
# 其中高斯分布的均值为 0 标准差为 1
np.random.normal(0, 1, (3, 3))

# 创建一个采用 [0, 10] 分为的随机数填充的 3x3 的数组
np.random.randint(0, 10, (3, 3))

# 创建一个 3x3 的单位矩阵
np.eye(3)

# 创建一个未初始化的数组，其中的值为所分配的内存的值
np.empty(3)
```

## Universal Functions

NumPy 之所以成为了 Python 数据科学的基础在于其提供了一整套高效计算的方案，前面提到了其固定类型数组所带来的好处，这一部分讲述其通过 universal functions 实现的向量化操作。

默认的 Python 循环是非常缓慢的，虽然有一些其他的 Python 编译方案想要让 Python 的执行速度变得快起来，但是其普及程度都远不如默认的 CPython。例如下面的一个求倒数操作，Python 的执行速度慢的令人发指：

```python
import numpy as np
np.random.seed(0)

def compute_reciprocals(values):
    output = np.empty(len(values))
    for i in range(len(values)):
        output[i] = 1.0 / values[i]
    return output

values = np.random.randint(1, 10, size=5)

big_array = np.random.randint(1, 100, size=1000000)
%timeit compute_reciprocals(big_array)
# 1 loop, best of 3: 205 ms per loop
```

事实证明，这里的瓶颈不是操作本身，而是 CPython 在循环的每个周期必须进行的类型检查和函数调度。每次计算倒数时，Python 首先检查对象的类型并查找适合该类型的函数来执行计算。如果我们是在编译型的语言中，类型在代码执行之前就已知，那么计算速度就会快得多。

对于许多类型的操作，NumPy 提供了执行这种针对静态类型的编译型的操作，这被称为*向量化*运算。这可以通过简单地对整个数组执行操作来实现，这相当于对每个元素应用操作。这种向量化方法旨在将循环推入编译层，这是 NumPy 高效运算的基础。看一看对 big_array 的执行速度，与 Python 循环相比，我们看到了数量级的飞跃：

```python
%timeit (1.0 / big_array)
# 100 loops, best of 3: 4.14 ms per loop
```

NumPy中的向量化操作通过 ufuncs 实现，其主要目的是加速 NumPy 数组中的重复操作。与等价的 Python 循环相比使用 ufuncs 的向量化运算基本上都是要快一些，在数组规模比较庞大的时情况下更是如此。当你在 Python 中看到了循环你就应当考虑它是否应当替换为一个向量化的操作。

大多数 Python 的基本运算 NumPy 都对其进行了向量化，即都有对应的 ufuncs：

| Operator	    | Equivalent ufunc    | Description                           |
|---------------|---------------------|---------------------------------------|
|``+``          |``np.add``           |Addition (e.g., ``1 + 1 = 2``)         |
|``-``          |``np.subtract``      |Subtraction (e.g., ``3 - 2 = 1``)      |
|``-``          |``np.negative``      |Unary negation (e.g., ``-2``)          |
|``*``          |``np.multiply``      |Multiplication (e.g., ``2 * 3 = 6``)   |
|``/``          |``np.divide``        |Division (e.g., ``3 / 2 = 1.5``)       |
|``//``         |``np.floor_divide``  |Floor division (e.g., ``3 // 2 = 1``)  |
|``**``         |``np.power``         |Exponentiation (e.g., ``2 ** 3 = 8``)  |
|``%``          |``np.mod``           |Modulus/remainder (e.g., ``9 % 4 = 1``)|

还有一些额外的函数，这里仅仅展示其中的一部分：

```python
# 绝对值
np.abs(x)
# 三角函数
np.sin(x)
# 指数函数
np.exp(x)
np.power(3, x)

# 聚合操作
x = np.arange(1, 6)
np.add.reduce(x)
# 15
np.multiply.reduce(x)
# 120

# 外积操作
x = np.arange(1, 6)
np.multiply.outer(x, x)
# array([[ 1,  2,  3,  4,  5],
#        [ 2,  4,  6,  8, 10],
#        [ 3,  6,  9, 12, 15],
#        [ 4,  8, 12, 16, 20],
#        [ 5, 10, 15, 20, 25]])
```

## NumPy 数组的基本操作

NumPy 的数组操作和 Python 的 list 非常的类似，这里从以下几个方面进行介绍：

- *数组的属性*：长度，维度，内存占用大小，元素的类型
- *数组的索引*：获取或修改数组中的单个元素
- *数组的切片*：获取或修改数组中的子数组内容
- *数组的重塑（reshape等操作）*：更改一个数组的形状
- *数组的连接与分割*：连接多个数组或者将单个数组分割为多个数组

### NumPy 的基本属性

- `.ndim` 维度
- `.shape` 每个维度的长度
- `.size` 整个数组的长度，等于各个维度长度之积
- `.dtype` 内部数据的类型
- `.itemsize` 每个元素的字节长度
- `.nbytes` 整个数组的字节长度，等于 `.itemsize * .size`

例子：

```python
x = np.random.randint(10, size(3, 4))

print x.ndim
print x.shape
print x.size
print x.dtype
print x.itemsize
print x.nbytes
```

其结果：

```
2
(3, 4)
12
int64
8
96
```

### NumPy 的索引

NumPy 数组的索引和 list 基本一致，也是从零开始计数，也支持负数索引，不过在多元数组时采用逗号分隔的 tuple 类型进行索引（list 采用多个方括号的方式，比如 a[1][2]）：

```python
x1 = np.random.randint(10, size(10))
x1[0]
x1[5] = 8
x1[-1]

x2 = np.random.randint(10, size(3, 4))
x2[1, 0]
x2[0, 0] = 12
```

当然，NumPy 数组中的类型是一致的，因此赋值其他类型会被强制转换：

```python
x1[0] = 3.14 # 会被转换为 3
```

### NumPy 的数组切片

NumPy 数组也支持用 `:` 进行切片操作（slicing），切片的参数格式为

```
[start:stop:step]
```

其中如果 start 没有提供则为 0，如果 stop 没有提供则为当前维度的长度，如果 step 没有提供则为 1：

```python
x = np.arange(10)
# [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

x[:5]
# [0, 1, 2, 3, 4]

x[4:7]
# [4, 5, 6]

x[::2]
# [0, 2, 4, 6, 8]

x[1::2]
# [1, 3, 5, 7, 9]
```

当 step 为负数时 start 和 stop 的默认值互换。这也是一种将数组倒序的方式：

```python
x[::-1]
# [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]

x[5::-2]
# [5, 3, 1]
```

在对多维数组进行切片时不同维度通过逗号分隔：

```python
x2 = np.random.randint(10, size=(3, 4))

# array([[9, 2, 7, 6],
#       [2, 6, 1, 1],
#       [9, 0, 0, 8]])

x2[:2, :3]

# array([[9, 2, 7],
#       [2, 6, 1]])

x2[:3, ::2]
# array([[9, 7],
#       [2, 1],
#       [9, 0]])

x2[::-1, ::-1]
# array([[8, 0, 0, 9],
#       [1, 1, 6, 2],
#       [6, 7, 2, 9]])
```

对二维数组获取其某一行或者某一列可以通过全切片与索引配合使用：

```python
print(x2[:, 0])  # 第一列
print(x2[0, :])  # 第一行
print(x2[0])     # 第一行，后面的全切片可以省略
```

**注意** NumPy 的切片是一个引用，而不是像 list 里面的是一个拷贝：

```python
x2_sub = x2[:2, :2]
print(x2_sub)
# [[9 2]
#  [2 6]]
x2_sub[0, 0] = 99
print(x2)
# [[99  2  7  6]
#  [ 2  6  1  1]
#  [ 9  0  0  8]]
```

在处理大规模的数组的时候，这种操作不会带来大量额外的内存开销。在需要使用拷贝的时候可以用下面的方式进行：

```python
x2_sub_copy = x2[:2, :2].copy()
```

### 数组的重塑

重塑，即修改数组的维度信息。比如把一个长度为 9 的一维数组变为一个 3x3 的二维数组：

```python
np.arange(9).reshape((3, 3))
```

要注意，在 `reshape` 时其创建的新的数组的 `size` 必须和之前的数组一致。reshape 会尽量采用非拷贝的方式来处理初始数组，但是在初始数据没有提供连续的内存空间的时候就无法实施。类似的方法会在处理图像数据时很常见。

重塑方法另一个常用的情况是将一个一维的数组转换为一个二维的行或者列矩阵。可以通过 reshape 或者 newaxis 方法实现。

```python
x = np.array([1, 2, 3])

# 用 reshape 创建一个 shape 为 (1, 3) 的二维数组
x.reshape((1, 3))

# 用 np.newaxis 创建一个 (1, 3) 的二维数组
x[np.newaxis, :]

# 用 reshape 创建一个 (3, 1) 的二维数组
x.reshape((3, 1))

# 用 newaxis 创建一个 (3, 1) 的二维数组
x[:, np.newaxis]
```

类似的转换比较常见，尤其是在做机器学习算法中需要将数据扩充为多维数组时。

### 数组的连接与分割

一维数组的连接：

```python
x = np.array([1, 2, 3])
y = np.array([3, 2, 1])
np.concatenate([x, y])
# array([1, 2, 3, 3, 2, 1])

z = [99, 99, 99]
print(np.concatenate([x, y, z]))
# [ 1  2  3  3  2  1 99 99 99]
```

二维数组的连接：

```python
grid = np.array([[1, 2, 3],
                 [4, 5, 6]])
np.concatenate([grid, grid])
# array([[1, 2, 3],
#        [4, 5, 6],
#        [1, 2, 3],
#        [4, 5, 6]])

# 按照第二维连接
np.concatenate([grid, grid], axis=1)
# array([[1, 2, 3, 1, 2, 3],
#       [4, 5, 6, 4, 5, 6]])
```

在数组维度不一致的情况下采用 np.vstack 与 np.hstack 更清晰一些：

```python
x = np.array([1, 2, 3])
grid = np.array([[9, 8, 7],
                 [6, 5, 4]])

# 按照行连接（垂直连接）
np.vstack([x, grid])

# array([[1, 2, 3],
#        [9, 8, 7],
#        [6, 5, 4]])

y = np.array([[99],
              [99]])
# 按照列连接（水平连接）
np.hstack([grid, y])
# array([[ 9,  8,  7, 99],
#        [ 6,  5,  4, 99]])
```

类似地，np.dstack 会按照数组的第三维连接。

与连接相反的操作是分割，通过 np.split，np.hsplit，np.vsplit 实现。通过传递一个索引数组说明分割的位置：

```
x = [1, 2, 3, 99, 99, 3, 2, 1]
x1, x2, x3 = np.split(x, [3, 5])
print(x1, x2, x3)
# [1 2 3] [99 99] [3 2 1]
```

N 个分割点会生成 N + 1 个子数组。 np.hsplit 与 np.vsplit 类似：

```python
grid = np.arange(16).reshape((4, 4))
upper, lower = np.vsplit(grid, [2])
print(upper)
print(lower)

# [[0 1 2 3]
#  [4 5 6 7]]
# [[ 8  9 10 11]
#  [12 13 14 15]]

left, right = np.hsplit(grid, [2])
print(left)
print(right)

# [[ 0  1]
#  [ 4  5]
#  [ 8  9]
#  [12 13]]
# [[ 2  3]
#  [ 6  7]
#  [10 11]
#  [14 15]]
```

类似地, np.dsplit 会按照数组的第三维分割。

## 聚合操作

NumPy 支持各种聚合函数，比如 `np.max` `np.min` `np.sum` `np.median` 这些方法一看就懂，不再一一列举。不过一个比较让人迷惑的点在于如何按照不同的维度进行聚合。

```python
M = np.random.random((3, 4))
print(M)
# [[ 0.22051857  0.27287109  0.96337129  0.78381157]
#  [ 0.24552893  0.39914065  0.70804662  0.80235189]
#  [ 0.33662843  0.65632293  0.25875078  0.52569568]]
```

```python
M.sum()
```

默认的 sum 是将所有维度的值加在一起，而聚合函数接受一个额外的参数 axis 用与指定沿着哪一个维度进行计算。例如我们想要按照列去找每一列的最小值就需要指定 axis=0：

```python
M.min(axis=0)
# array([ 0.66859307,  0.03783739,  0.19544769,  0.06682827])
```

结果返回四个值，对应四列的最小值。类似的我们可以找到每一行的最大值：

```python
M.max(axis=1)
# array([ 0.8967576 ,  0.99196818,  0.6687194 ])
```

axis 是指那个**将要被处理的维度**，而不是将要返回的维度。因此指定 axis=0 意味着第一个维度是要被处理的维度：对于二维数组磊说，这意味着每一列的数据将要被聚合。也就是说指定的 axis 最终会被变成 1，例如这里的一个 3x4 的数组，如果指定 axis=0 那么第一维会变成 1 所以会成为一个 1x4 的数组，那么就是每一列做了聚合。类似地，如果 axis=1 那么数组会变成一个 3x1 的数组，那么数组就是按照行做了聚合。

大多数聚合函数都能够处理 NaN 数值的情况：计算过程中会忽略这些 NaN 数据，很多对于 NaN 处理的函数是在 NumPy 1.8 之后添加的，旧版本并不支持。
