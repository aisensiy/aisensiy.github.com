"use strict";(self.webpackChunkaisensiy_s_blog=self.webpackChunkaisensiy_s_blog||[]).push([[744],{2373:function(e,t,n){n.d(t,{Z:function(){return m}});var a=n(7294),r=n(1597);function l(e){var t=e.html;return a.createElement("div",{className:"table-of-content"},a.createElement("h2",null,"Table of Contents"),a.createElement("div",{dangerouslySetInnerHTML:{__html:t}}))}var i=function(e){var t=e.tag;return a.createElement("span",{className:"text-xs font-semibold inline-block py-1 px-2 rounded text-rose-700 bg-rose-200 last:mr-0 mr-1"},t)},c=function(e){var t=e.tags;return a.createElement("div",{className:""},t.map((function(e){return a.createElement(i,{key:e,tag:e})})))};function m(e){var t=e.data,n=t.frontmatter,i=t.html,m=t.fields,o=t.tableOfContents;return a.createElement("div",null,a.createElement("h1",null,m&&m.slug_without_date&&a.createElement(r.rU,{to:m.slug_without_date},n.title)||""+n.title),a.createElement("h2",null,n.date),n.tags&&a.createElement(c,{tags:n.tags}),o&&a.createElement(l,{html:o}),a.createElement("div",{className:"prose prose-blog dark:prose-invert max-w-none lg:prose-lg xl:prose-xl",dangerouslySetInnerHTML:{__html:i}}))}},2059:function(e,t,n){var a=n(7294),r=n(5414),l=n(9499),i=n(1597),c=function(e){var t=e.title,n=e.description,c=e.image,o=e.article,s=(0,l.useLocation)().pathname,u=(0,i.K2)(m).site.siteMetadata,p=u.defaultTitle,d=u.titleTemplate,g=u.defaultDescription,E=u.siteUrl,f=u.defaultImage,v=u.twitterUsername,b={title:t||p,description:n||g,image:""+E+(c||f),url:""+E+s};return a.createElement(r.q,{title:b.title,titleTemplate:d},a.createElement("meta",{name:"description",content:b.description}),a.createElement("meta",{name:"image",content:b.image}),b.url&&a.createElement("meta",{property:"og:url",content:b.url}),!o?null:a.createElement("meta",{property:"og:type",content:"article"}),b.title&&a.createElement("meta",{property:"og:title",content:b.title}),b.description&&a.createElement("meta",{property:"og:description",content:b.description}),b.image&&a.createElement("meta",{property:"og:image",content:b.image}),a.createElement("meta",{name:"twitter:card",content:"summary_large_image"}),v&&a.createElement("meta",{name:"twitter:creator",content:v}),b.title&&a.createElement("meta",{name:"twitter:title",content:b.title}),b.description&&a.createElement("meta",{name:"twitter:description",content:b.description}),b.image&&a.createElement("meta",{name:"twitter:image",content:b.image}))};t.Z=c,c.defaultProps={title:null,description:null,image:null,article:!1};var m="4202924991"},6768:function(e,t,n){n.r(t),n.d(t,{default:function(){return c}});var a=n(7294),r=n(2373),l=n(8897),i=n(2059);function c(e){var t=e.data;return a.createElement(l.Z,null,a.createElement(i.Z,{title:t.blog.frontmatter.title,article:!0,description:t.blog.excerpt}),a.createElement(r.Z,{data:t.blog}))}}}]);
//# sourceMappingURL=component---src-templates-blog-js-d530b23e57f836611ce1.js.map