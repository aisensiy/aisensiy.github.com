---
author: aisensiy
comments: true
date: 2011-12-31 04:50:26+00:00
layout: post
slug: heatmapjs
title: 一个用canvas画热力图的利器 heatmap.js
wordpress_id: 174
categories:
- 关注web
tags:
- heatmap
- javascript
---

最近做的一个东西，需要以热力图的形式去展示数据。于是就想找一找热力图的算法。找到了很多生成热力图的工具，它们的算法几乎是一致的，都是首先用alpha透明度方式画发散的圆在页面上，然后利用一个调色板，把对应的透明度改成相应的颜色即可。

一个很不错的中文的算法介绍在这里 [浅谈Heatmap](http://huoding.com/2011/01/04/39)

一个英文的在这里 [How to Make Heat Map](http://blog.corunet.com/how-to-make-heat-maps/)

虽说我本来打算的是找到算法自己去实现一下的，但是一不小心我发现万能的google在搜索记录里面给了我一个 [heatmap.js](http://www.patrick-wied.at/static/heatmapjs/) 的链接。我好奇的点进去发现这就是我所需要实现的东西...

[![](http://aisensiy-wordpress.stor.sinaapp.com/uploads/2011/12/heatmap-1024x537.png)](http://aisensiy-wordpress.stor.sinaapp.com/uploads/2011/12/heatmap.png)

heatmap.js可以使用canvas画出来一张漂亮的heatmap。更重要的是它支持数据的动态添加。比如，上图的演示就是一个利用mousemove事件生成heatmap的例子。它会自动的刷新canvas，实时显示鼠标运动的heatmap。

打开heatmap.js发现里面的代码并不多，但是真的很精悍。

页面代码请点击这里[[heatmap.js](https://github.com/pa7/heatmap.js/blob/master/heatmap.js)]，下面我做一个code的分析吧，看了那么久了，写下来一方面是自己加深记忆，另一方面就是可以更好的理清思路吧。[[写就是为了更好的思考](http://mindhacks.cn/2009/02/09/writing-is-better-thinking/)]么。

code中包含两个主要的对象，store heatmap。store是heatmap的数据部分，算是model吧。而heatmap则是真正绘制图像的对象。heatmap部分可以被配置，可以自定义很多的内容，尤其是配色也是可以配置的，那么我们除了做出来正真的heatmap的效果之外还可以做出来各种各样不错的效果的。

首先看看存储部分吧，比较简单，注释也比较清楚。

```js
// store object constructor
// a heatmap contains a store
// the store has to know about the heatmap
// in order to trigger heatmap updates when
// datapoints get added
function store(hmap){
    var _ = {
        // data is a two dimensional array
        // a datapoint gets saved as data[point-x-value][point-y-value]
        // the value at [point-x-value][point-y-value]
        // is the occurrence of the datapoint
        data: [],
        // tight coupling of the heatmap object
        heatmap: hmap
    };
    // the max occurrence - the heatmaps radial gradient
    // alpha transition is based on it
    this.max = 1;
    this.get = function(key){
        return _[key];
    },
    this.set = function(key, value){
        _[key] = value;
    };
};
```

在model里面，支持一次添加一个数据点。这也是heatmapjs支持实时绘制的关键。一旦max值有变化就会重新绘制整个canvas。

```javascript
addDataPoint: function(x, y){
    if(x < 0 || y < 0)
        return;
    var me = this,
        heatmap = me.get("heatmap"),
        data = me.get("data");
    if(!data[x])
        data[x] = [];
    if(!data[x][y])
        data[x][y] = 0;
    // if count parameter is set increment by count otherwise by 1
    data[x][y]+=(arguments.length     me.set("data", data);
    // do we have a new maximum?
    if(me.max < data[x][y]){
        me.max = data[x][y];
        // max changed, we need to redraw all existing(lower) datapoints
        heatmap.get("actx").clearRect(0,0,heatmap.get("width"),heatmap.get("height"));
        for(var one in data)
            for(var two in data[one])
                heatmap.drawAlpha(one, two, data[one][two]);
        // @TODO
        // implement feature
        // heatmap.drawLegend(); ?
        return;
    }
    heatmap.drawAlpha(x, y, data[x][y]);
},
```

下面就是画的部分了。这里是最重要的两个方法，drawAlpha colorize

```javascript
drawAlpha: function(x, y, count){
    // storing the variables because they will be often used
    var me = this,
        r1 = me.get("radiusIn"),
        r2 = me.get("radiusOut"),
        ctx = me.get("actx"),
        max = me.get("max"),
        // create a radial gradient with the defined parameters.
        // we want to draw an alphamap
        rgr = ctx.createRadialGradient(x,y,r1,x,y,r2),
        xb = x-r2, yb = y-r2, mul = 2*r2;
    // the center of the radial gradient has .1 alpha value
    rgr.addColorStop(0, 'rgba(0,0,0,'+((count)?(count/me.store.max):'0.1')+')');
    // and it fades out to 0
    rgr.addColorStop(1, 'rgba(0,0,0,0)');
    // drawing the gradient
    ctx.fillStyle = rgr;
    ctx.fillRect(xb,yb,mul,mul);
    // finally colorize the area
    me.colorize(xb,yb);
},
```

策略很简单，

```javascript
rgr.addColorStop(0, 'rgba(0,0,0,'+((count)?(count/me.store.max):'0.1')+')');
// and it fades out to 0
rgr.addColorStop(1, 'rgba(0,0,0,0)');
```

利用当前点的count除以最大的count获取的结果做为alpha值。然后做一个RadialGradient画出来这个图就可以了。那么由于多个相近的点aphla效果的叠加就可以获取想要的效果了。这里就是canvas的nb之处了，看别的语言实现都是采用将一个这样的png图片画到画板上，但是canvas就可以直接实现这个效果。

[![](http://aisensiy-wordpress.stor.sinaapp.com/uploads/2011/12/src_Tempest_plot.png)](http://aisensiy-wordpress.stor.sinaapp.com/uploads/2011/12/src_Tempest_plot.png)

有了这幅aphla版本的heatmap 我们利用一个配送版做着色就大功告成了。

这里又用到了上面所说的canvas的nb之处，在通常需要一个图片作为配色板的时候canvas可以自己做出来一个缓存起来。

```javascript
initColorPalette: function(){
    var me = this,
        canvas = document.createElement("canvas");
    canvas.width = "1";
    canvas.height = "256";
    var ctx = canvas.getContext("2d"),
        grad = ctx.createLinearGradient(0,0,1,256),
    gradient = me.get("gradient");
    for(var x in gradient){
        grad.addColorStop(x, gradient[x]);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,1,256);
    //这里太强大了，缓存了我的画板数据，然后删除了画板
    me.set("gradient", ctx.getImageData(0,0,1,256).data);
    delete canvas;
    delete grad;
    delete ctx;
},
```

这种方式也给我们实现各种各样的配色提供了方便，我们只需要改变那个 **gradient** 就可以了。

```javascript
for(var i=3; i < length; i+=4){         // [0] -> r, [1] -> g, [2] -> b, [3] -> alpha
    var alpha = imageData[i],
    offset = alpha*4;
    if(!offset)
        continue;
    // we ve started with i=3
    // set the new r, g and b values
    // 根据透明度选择配色板上的配色
    imageData[i-3]=palette[offset];
    imageData[i-2]=palette[offset+1];
    imageData[i-1]=palette[offset+2];
    // we want the heatmap to have a gradient from transparent to the colors
    // as long as alpha is lower than the defined opacity (maximum),
    // we'll use the alpha value
    imageData[i] = (alpha < opacity)?alpha:opacity;
}
```

还是很简练的吧，看到heatmap.js的风格，真的像是在看一个不错的艺术品一样。强烈推荐一看~
