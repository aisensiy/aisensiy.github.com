---
author: aisensiy
comments: true
date: 2013-03-12 17:16:17+00:00
layout: post
slug: javascript-%e4%b8%ad%e7%9a%84%e7%b1%bb%e7%bb%a7%e6%89%bf%e4%bb%a5%e5%8f%8a%e5%af%b9%e5%ad%a6%e4%b9%a0%e7%9a%84%e7%9c%8b%e6%b3%95
title: javascript 中的类继承
wordpress_id: 454
categories:
- 学习笔记
tags:
- class
- javascript
---

其实这部分我觉得最好的实践就是 coffeescript 的代码。coffee 自带了类继承。那么，解析成 js 后其代码就一目了然了。不过我还是自己练习了一下。解释都在注释里，废话不多说了。coffee 关于 extend 的部分在 [http://coffeescript.org/<!-- more -->](http://coffeescript.org/)

```js
var __hasProp = {}.hasOwnProperty;
var __extend = function(child, parent) {
  // property inherit
  for(var prop in parent) {
    if (__hasProp.call(parent, prp)) {
      child[prop] = parent[prop];
    }
  }

  // method inherit
  var cot = function() {
  };
  // use the method without call parent constructor
  cot.prototype = parent.prototype;
  child.prototype = new cot();
  // set constructor to child itself
  child.prototype.constructor = child;
  // set the super with parent.prototype
  // so we can call child.__super__.method.call
  // to invoke parent method.
  child.__super__ = parent.prototype;

  return child;
};

var Animal = (function() {
  function Animal(name) {
    this.name = name;
  }

  Animal.prototype.move = function() {
    console.log(this.name + ' move');
  };

  return Animal;
})();

var animal = new Animal('test');
animal.move();

var Snake = (function(_super) {
  function Snake() {
    // here is an example to call super method.
    Snake.__super__.constructor.apply(this, arguments);
  }
  __extend(Snake, _super);

  return Snake;
})(Animal);

var snake = new Snake('snk');
snake.move();
```

在 backbone 中的 extend 方法如下

```js
  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };
```

代码里我有一个比较晕的地方

```js
    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);
```


这是要把 protoProps 一坨东西全部给 子类的 prototype 啊，那如果我修改了子类一个实例中继承来的属性或者方法，会不会导致其他子类示例方法的变动呢？答案是不会。

```js
var View = function() {
};

View.prototype['type'] = 'abc';
var v1 = new View();
var v2 = new View();
console.log(v1.type); // abc
console.log(v1.hasOwnProperty('type'));// false
// 这种赋值会导致 v1 不会追朔到 View.prototype.type
// 而是重新建立自己的 property. 并不影响 prototype
v1.type = 'bcd';
console.log(v1.hasOwnProperty('type'));// true
console.log(v2.type);// abc
```

最后 _.extend

```js
  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };
```
