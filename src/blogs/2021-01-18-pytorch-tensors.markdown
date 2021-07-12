---
layout:     post
title:      "pytorch tensors"
date:       2021-01-18 23:16:00 +08:00
author:     "Eisen"
tags:       [pytorch, python, deeplearning, nn]
---

最近在都 Deep Learning with Pytorch 这本书，目前为止感觉还是不错。尤其是它里面的手绘风插图，真的是印象深刻，好感顿生。

![](https://images-1300693298.cos.ap-beijing.myqcloud.com/%7B7AD75AC9-FD58-48DE-977A-7AD6503FED3A%7D.png)

第三章介绍了 tensor 的数据结构，感觉讲的挺好的，做一个笔记，加深下印象。

## 本质

首先，tensor 感觉就和 numpy array 非常非常像，简单的讲就是多维矩阵。但是和 python 的 list 相比，tensor / numpy array 是被分配的连续内存空间。

![](https://images-1300693298.cos.ap-beijing.myqcloud.com/%7B8F87E9BF-4E5C-4128-9066-5610D2CB4326%7D.png)

## 数据类型

通过 `dtype` 参数可以指定 tensor 的数据类型。其名字和 numpy 里面的类型几乎一致：

- torch.float32 / torch.float
- torch.float64 / torch.double
- torch.float16 / torch.half
- torch.int8
- torch.unint8
- torch.int16 / torch.short
- torch.int32 / torch.int
- torch.int64 / torch.long
- torch.bool

默认都是用 float 类型，double 也不会增加什么好处。然后 tensor 可以作为其他 tensor 的索引，但是必须是 long 类型。`torch.tensor([2, 2])` 会给类型为 long 。需要注意的是 numpy 默认的浮点类型是 float64，而 tensor 默认的是 float32：

![](https://images-1300693298.cos.ap-beijing.myqcloud.com/%7B495D4F3D-FC9C-4F62-A9BA-25413B7B6A02%7D.png)

## Storage

每一个 tensor 的真是数据是由 `torch.Storage` 来维护的，它本质上就是一段连续的内存空间而已。Tensor 仅仅是为 storage 提供了 offset 和 stride 之后的视图而已。

![](https://images-1300693298.cos.ap-beijing.myqcloud.com/%7B4F5DC8FC-E908-408E-88C3-6FC09B95AF5E%7D.png)

对于不同的 tensor 虽然它的 shape 不一样，但也可能指向了同一个的 storage。通过 tensor.storage() 可以直接访问它的内容：

![](https://images-1300693298.cos.ap-beijing.myqcloud.com/%7BFD54249D-DCFA-4437-905D-13F548279E5F%7D.png)

不论 tensor 本身维度如何，其下的 storage 永远是一个一维数组。当然，修改 storage 的数据后，其 tensor 的数据也一定会发生变化。

## size offset stride

- offset 是 tensor 在 storage 的位置
- size 是当前 tensor 的维度
- stride 是这个 tensor 各个维度 +1 所需要跨越的 storage 索引个数

![](https://images-1300693298.cos.ap-beijing.myqcloud.com/%7B919B7731-CC39-45B5-897A-3A46180412C4%7D.png)

那么当 tensor 本身发生了 transpose 之后，其实就是 size stride 发生了变化，其 storage 并没有变化的。

## device 属性

tensor 创建时可以指定其属于什么设备：

    points_gpu = torch.tensor([[4.0, 1.0], [5.0, 3.0], [2.0, 1.0]], device='cuda')

默认是 cpu。

当然也可以把 cpu 的 tensor 拷贝到 gpu：

    points_gpu = points.to(device='cuda')

## 和 numpy 相互转换

只要都在主内存里，numpy array 和 tensor 之间的转换是非常高效的。那么这个好处就是可以享受 numpy 生态的各种类库。

```
points = torch.from_numpy(points_np)
points_np = points.numpy()
```

