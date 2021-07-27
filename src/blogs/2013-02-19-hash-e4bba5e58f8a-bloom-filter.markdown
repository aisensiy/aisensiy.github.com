---
author: aisensiy
comments: true
date: 2013-02-19 16:15:55+00:00
layout: post
slug: hash-%e4%bb%a5%e5%8f%8a-bloom-filter
title: hash 以及 bloom filter
wordpress_id: 410
categories:
- 未分类
---

一直实用 hash 这种结构，原理是知道的，具体的算法也了解，可是学完数据结构之后就差不多再也没有实现过这个数据结构了。借前一阵子接触 bloom filter 的机会在整理一下有关 hash 的内容。

hash 是将内容编码然后存储在 array 结构中，以便于在 O(1) 复杂度内获取的数据结构。其关键部分在于如何生成一个足够随机的编码以及如何解决冲突。解决冲突虽然有很多方法，但是我觉得链接法应该是最为广泛是实用的方法吧，概念简单，便于接受。至于如何生成 hash 的 哈希函数就是五花八门了。这个应该根据对于冲突的敏感程度以及算法的复杂度综合考虑比较好吧。不过 MD5 应该算是个很不错的算法了，而且是比较通用的。这里我介绍下一个字符串生成哈希的函数，EFLHash。<!-- more -->

google 一下，会发现相关内容还挺多的，在很多的技术博客中都出现了。不过仔细一看会发现大家差不多都是抄来抄去的状态，厚道的会说是转的，不厚道的一字不提。code 直接粘贴估计自己都不知道贴的是什么，一些 code 有错误就都错的一样。这样的技术博客内容即便再多也意义不大，纯粹费电，博客的第一读者是自己，直接 copy 是自欺欺人。

看了一些哈希函数的写法，大概的意思差不多就是尽量把所有信息都考虑在内以尽量减小相似内容的冲突。比如 'abc' 与 'abd'，如果仅仅考虑前两个字母而不考虑第三个，那么冲突的可能性会大很多。在算法导论中提到对于字符串这样的内容，可以把它看作是一个超大的数字，然后以对数字的方式根据 hash 桶的个数计算其所在的桶。那么 EFLHash 的思想也是类似的。在下面的代码中，我会给予注释表述其思想。

```cpp
int ELFHash(char* str, int len) {
    unsigned int hash = 0;
    unsigned int    x = 0;
    int i = 0;

    for (i = 0; i < len; i++) {
        /* 这就相当于在构造一个 16 进制的大整数，每次加新的数字前进位 */
        hash = (hash << 4) + str[i];
        /* 但是一个整型最多就 32 位，如果再往左进位，高位就会丢失。那么，
           就要考虑把高位的数字与低位的做异或运算保存下来 */
        if ((x = hash & 0xf0000000L) != 0) {
            hash ^= x >> 24;
            /* 既然高位数字以及放在低位异或了，那么就可以把高位制空 */
            hash &= ~x;
        }
    }
    /* 最后为了返回给有符号整数，把最高位制零，如果你返回的是无符号数，
       那就忽略这行 */
    hash = hash & 0x7fffffffL;
    return hash;
}

```

我觉得只要这种思想掌握了，那就不会觉得这种代码很诡异了，可以自己做一些修改，以适应各种场景。

然后，核心的算法有了，那么基于链接法解决冲突的 hash 数据结构就可以有了。

```cpp
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#define N 100
#define LEN 39

int ELFHash(char* str, int len) {
    unsigned int hash = 0;
    unsigned int    x = 0;
    int i = 0;

    for (i = 0; i < len; i++) {
        hash = (hash << 4) + str[i];
        if ((x = hash & 0xf0000000L) != 0) {
            hash ^= x >> 24;
            hash &= ~x;
        }
    }
    hash = hash & 0x7fffffffL;
    return hash;
}

/* 这是我们的核心数据结构，其实就是链表的节点 */
typedef struct node {
    char data[N];
    struct node *next;
} node;

/* 初始化一个节点，设置字符串为空，next 指针指向 NULL */
void node_init(node *point) {
    point->data[0] = '\0';
    point->next = NULL;
}

/* 创建一个新的节点并初始化 */
node *node_create() {
    node *point = (node*)malloc(sizeof(node));
    node_init(point);
    return point;
}

node* hash_find(char *str, node **root);
node** hash_create();
node* hash_add(char *str, node **root);
int hash_delete(char *str, node **root);

/* 创建一个新的 hash 数据结构，桶的个数为 LEN */
node** hash_create() {
    int i;
    node **root = (node**)malloc(LEN * sizeof(node*));
    for (i = 0; i < LEN; i++) {
        root[i] = NULL;
    }
    return root;
}

/* 添加一个新的元素 */
node* hash_add(char *str, node **root) {
    int hash, index;
    node *current, *tmp, *base, *prev;
    /* 首先检查这个元素是否已经存在了，如果存在就不必再次添加 */
    if (hash_find(str, root)) return;
    hash = ELFHash(str, strlen(str));
    index = hash % LEN;
    prev = current = root[index];
    /* 冲突总会有的，要把冲突的情况考虑在内 */
    while (current) {
        prev = current;
        current = current->next;
    }

    tmp = node_create();
    strcpy(tmp->data, str);

    if (!prev) {
        root[index] = tmp;
    } else {
        prev->next = tmp;
    }

    return tmp;
}

/* 在 hash 结构中找一个元素是否存在 */
node* hash_find(char *str, node **root) {
    int hash, index;
    node *current_node;

    hash = ELFHash(str, strlen(str));
    index = hash % LEN;
    current_node = root[index];

    while (current_node) {
        if (strcmp(current_node->data, str) == 0) {
            return current_node;
        }
    }

    return NULL;
}

/* 删除已有的元素 */
int hash_delete(char *str, node **root) {
    int hash, index;
    node *current_node, *prev, *tmp;

    hash = ELFHash(str, strlen(str));
    index = hash % LEN;
    current_node = prev = root[index];

    while (current_node) {
        if (strcmp(current_node->data, str) == 0) {
            if (current_node == root[index]) {
                free(current_node);
                root[index] = NULL;
            } else {
                prev->next = current_node->next;
                free(current_node);
            }
            return 1;
        }
        prev = current_node;
        current_node = current_node->next;
    }
    return 0;

}

/* 一点点测试 */
int main(int argc, const char *argv[]) {

    char *test1 = "test";
    char *test2 = "test2";
    node *result;
    int r;

    node **root = hash_create();
    hash_add(test1, root);
    result = hash_find(test2, root);
    assert(!result);
    result = hash_find(test1, root);
    assert(result);
    hash_add(test2, root);
    result = hash_find(test2, root);
    assert(result);

    hash_add(test1, root);
    r = hash_delete(test1, root);
    assert(r == 1);

    return 0;
}

```

hash 结构的操作就是那么结构，添加，查找，删除，如果考虑的再多一点，应该有一个销毁整个结构的函数，这里就不写了。

在你需要频繁查找某个元素是否在一个集合的时候，hash 是一个比较理想的结构。因为它的理想查找复杂度是 O(1)。但是它有一个问题，就是 hash 内部实际上还是存储了整个数据内容（比如上面的代码里面，依然把字符串保存了下来），那么这就会导致比较大的内存开销。想想一下，如果你的这个集合很大，比如有 1 百万，每个字符串占20个字节，那么你就需要 2O M 空间了，而且，其实 hash 为了避免冲突，不希望桶的个数太接近实际数据的个数。其空间可能会开到 30M 甚至 40M。其实这已经是很大的开销了（我不想举例子说有什么一个亿，来说明这个开销不能承受，我只是觉得应该实际一点，一百万我觉得还是可能有的，比如你做个爬取数据的程序，而你的VPS只有512M内存，你又有其它的程序在跑，你不想因为一个爬虫就把你VPS的内存都吃了）。

那么，这里 bloom filter 来了。这个数据结构的思想也非常的简单。它想用hash值来代表一个数据，然后只保存这个hash值。我通过hash值就可以判断这个元素到底是有还是没有，那不就省空间了么？ 但是这里问题也很明显：一个hash值很容易出现冲突啊，如果冲突了，那我岂不是很容易误伤其他没有在这个集合的元素？那我可以弄多个哈希函数啊，我弄一个哈希函数冲突的概率比较大，那我弄八个呢？冲突的概率是不是小的几乎可以忽略了呢。这就是 bloom filter 的核心想法：用多个哈希结果代表这个元素存储下来。每次通过检查这些哈希函数的结果判断该元素是否属于这个集合。

下面大概的描述一下 bloom filter 的具体结构。bloom filter 是一个比较大的，连续的内存空间。假设我的集合有 1000000 个元素，我建立一个 1000000 字节(1M)的空间。把它作为一个一百万位的 0 1 bit 空间，并在初始化的时候全部制零。同时，我准备 8 个可以把元素映射到 0 - 999999 的哈希函数。每来一个新的元素，我用这 8 个哈希函数计算出 8 个哈希值，并把这 8 个哈希值对应的 bit 位制为 1。那么，当判断一个元素是否存在的时候，需要保证这 8 个比特位全部为 1。

如此一来，我们就不需要保存原始数据了，存储空间由 20M 变成了 1M，还是很划算的。

我看别人的技术博客也差不多是先看别人的代码，如果代码看懂了就不看大段大段的文字了，下面我依然把自己写的代码贴出来，希望可以避免看到的人再看我写的拙急的文字...

```cpp
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define CHAR_BIT 8
#define WORD_SIZE 32
#define TRUE 1
#define FALSE 0
#define SETBIT(a, n) (a[n/CHAR_BIT] |= (1<<(n%CHAR_BIT)))
#define GETBIT(a, n) (a[n/CHAR_BIT] & (1<<(n%CHAR_BIT)))

typedef unsigned int (*hashfunc)(const char *);
typedef struct bloom {
    int char_size;
    char *container;
    int nearest_bit;
    int func_size;
    int *seeds; /* 注意，我这里给的不是一堆hash函数，而已hash函数里面的一个参数 */
} Bloom;

Bloom *bloom_create(int char_size, int func_size);
void *bloom_add(const char *str, Bloom* bloom);
int bloom_find(const char *str, Bloom* bloom);

/* 生成多个hash值的关键在于传递给这个函数的 k 值的区别。这个方法是算法导论里面的乘法
   生成 hash 的部分提到的，去那里看比较靠谱，我说不清楚啊 o_o */
unsigned int multi_hash(int a, int k, int r, int bit_size) {
    return ((unsigned int)(a * k) >> (WORD_SIZE - r)) % bit_size;
}

int nearest_bitsize(int size) {
    int i = 1, n = 2;
    while (size > n) {
        i++;
        n *= 2;
    }
    return i;
}

int ELFHash(const char* str) {
    unsigned int hash = 0;
    unsigned int    x = 0;
    int i = 0;
    int len = strlen(str);

    for (i = 0; i < len; i++) {
        hash = (hash << 4) + str[i]; if ((x = hash & 0xf0000000L) != 0) {
            hash ^= x >> 24;
            hash &= ~x;
        }
    }
    hash = hash & 0x7fffffffL;
    return hash;
}

/* >min < max */
int randint_in_range(int min, int max) {
    return rand() % (max - min + 1) + min + 1;
}

int *generate_hash_seed(int size, int min, int max) {
    int i, seed = time(NULL);
    int *seeds = (int*)malloc(size * sizeof(int));
    for (i = 0; i <size; i++) {
       srand(seed);
       seeds[i] = randint_in_range(min, max);
       seed = seeds[i];
    }
    return seeds;
}

int main(int argc, const char *argv[]) {
    Bloom *bloom = bloom_create(400, 8);
    bloom_add("aisensiy", bloom);
    printf("%d\n", bloom_find("aisensiy", bloom));
    printf("%d\n", bloom_find("aisensiy1", bloom));
    return 0;
}

Bloom *bloom_create(int char_size, int func_size) {
    int i, min, max, bit_size;

    Bloom *bloom = (Bloom*)malloc(sizeof(Bloom));
    bloom->char_size = char_size;
    bloom->container = (char*)malloc(sizeof(char) * char_size);

    /* set all char to 0 */
    for (i = 0; i < char_size; i++) {
        bloom->container[i] = 0;
    }

    bit_size = char_size * CHAR_BIT;
    bloom->nearest_bit = nearest_bitsize(bit_size);
    /* 这里的最大值与最小值也是与生成 hash 函数有关，建议去看算法导论 */
    max = 1<<(WORD_SIZE - 1);
    min = 1<<(WORD_SIZE - bloom->nearest_bit);

    bloom->func_size = func_size;
    bloom->seeds = generate_hash_seed(func_size, min, max);

    return bloom;
}

void *bloom_add(const char *str, Bloom* bloom) {
    int hash, i, position, bit_size;

    hash = ELFHash(str);
    bit_size = bloom->char_size * CHAR_BIT;

    /* 用这 N 个哈希函数生成哈希值 */
    for (i = 0; i < bloom->func_size; i++) {
        position = multi_hash(bloom->seeds[i], hash, bloom->nearest_bit, bit_size);
        printf("position: %d\n", position);
        SETBIT(bloom->container, position);
    }
    printf("position end\n");
}

int bloom_find(const char *str, Bloom* bloom) {
    int hash, i, position, bit_size;

    hash = ELFHash(str);
    bit_size = bloom->char_size * CHAR_BIT;

    /* 通过检查这 N 个哈希值来判断元素是否存在 */
    for (i = 0; i < bloom->func_size; i++) {
        position = multi_hash(bloom->seeds[i], hash, bloom->nearest_bit, bit_size);
        printf("position: %d\n", position);
        if (GETBIT(bloom->container, position) == FALSE) {
            return FALSE;
        }
    }
    printf("position end\n");

    return TRUE;
}

```

这种算法类的东西，我描述起来很是拙急啊。感觉说的不够明白 o_o。这里给点参考吧。

* [10个经典的字符串hash函数的C代码实现](https://blog.csdn.net/jcwkyl/article/details/4088436) 这个 EFLHash 应该是有点问题，仔细看～
* [Bloom Filter](https://en.wikipedia.org/wiki/Bloom_filter)
* 数学之美，布隆过滤器


