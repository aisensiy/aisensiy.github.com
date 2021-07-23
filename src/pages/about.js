import React from "react";
import Base from "../layouts/base";
import { Helmet } from 'react-helmet'

export default function Archive({ data }) {
  return (
    <Base>
      <Helmet title="About" />
      <div>
        <h1>
          About
        </h1>
        <p>
          为了再次更新一下自己的前端技能，时隔多年之后又拿博客做了个测试。完成了从
          jekyll 到 gatsby 的转换。
        </p>
        <p>
          从样式上差不多就是用 tailwindcss
          对之前样式的复制，当然目的也是为了体验下 tailwindcss 的风格。
        </p>
        <p>
          写 blog
          的主要目的是用于记录自己在不同时期学到的东西（好记性不如烂笔头）以及所思所想，时不时翻翻自己以前的文章想想当时的自己也是一个很有意思的事情。当然，如果有幸能被他人发现并且其中的一些内容可以有所帮助那就再好不过了。
        </p>
        <p>
          如果有神马需要联系的，请发邮件给 <code>aisensiy[AT]163.com</code>。
        </p>
      </div>
    </Base>
  );
}
