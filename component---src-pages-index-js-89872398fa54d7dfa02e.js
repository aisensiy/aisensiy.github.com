"use strict";(self.webpackChunkaisensiy_s_blog=self.webpackChunkaisensiy_s_blog||[]).push([[678],{742:function(e,t,n){n.d(t,{Z:function(){return i}});var a=n(7294),r=n(5444);function l(e){var t=e.html;return a.createElement("div",{className:"table-of-content"},a.createElement("h2",null,"Table of Contents"),a.createElement("div",{dangerouslySetInnerHTML:{__html:t}}))}function i(e){var t=e.data,n=t.frontmatter,i=t.html,c=t.fields,m=t.tableOfContents;return a.createElement("div",null,a.createElement("h1",null,c&&c.slug_without_date&&a.createElement(r.Link,{to:c.slug_without_date},n.title)||""+n.title),a.createElement("h2",null,n.date),m&&a.createElement(l,{html:m}),a.createElement("div",{className:"prose dark:prose-dark max-w-none lg:prose-lg xl:prose-xl",dangerouslySetInnerHTML:{__html:i}}))}},4615:function(e,t,n){var a=n(7294),r=n(5414),l=n(9499),i=n(5444),c=function(e){var t=e.title,n=e.description,c=e.image,o=e.article,s=(0,l.useLocation)().pathname,u=(0,i.useStaticQuery)(m).site.siteMetadata,d=u.defaultTitle,p=u.titleTemplate,g=u.defaultDescription,E=u.siteUrl,f=u.defaultImage,y=u.twitterUsername,v={title:t||d,description:n||g,image:""+E+(c||f),url:""+E+s};return a.createElement(r.q,{title:v.title,titleTemplate:p},a.createElement("meta",{name:"description",content:v.description}),a.createElement("meta",{name:"image",content:v.image}),v.url&&a.createElement("meta",{property:"og:url",content:v.url}),!o?null:a.createElement("meta",{property:"og:type",content:"article"}),v.title&&a.createElement("meta",{property:"og:title",content:v.title}),v.description&&a.createElement("meta",{property:"og:description",content:v.description}),v.image&&a.createElement("meta",{property:"og:image",content:v.image}),a.createElement("meta",{name:"twitter:card",content:"summary_large_image"}),y&&a.createElement("meta",{name:"twitter:creator",content:y}),v.title&&a.createElement("meta",{name:"twitter:title",content:v.title}),v.description&&a.createElement("meta",{name:"twitter:description",content:v.description}),v.image&&a.createElement("meta",{name:"twitter:image",content:v.image}))};t.Z=c,c.defaultProps={title:null,description:null,image:null,article:!1};var m="4202924991"},7704:function(e,t,n){n.r(t),n.d(t,{default:function(){return m}});var a=n(7294),r=n(5444),l=n(742),i=n(9043),c=n(4615);function m(e){var t=e.data.blogs,n=t.nodes,m=t.pageInfo,o=n.map((function(e){return a.createElement(l.Z,{data:e,key:e.id})})),s=m.pageCount,u=m.hasPreviousPage,d=m.currentPage,p=d<s;return a.createElement(i.Z,null,a.createElement(c.Z,null),a.createElement("div",null,o,a.createElement("div",{className:"flex justify-center mt-8"},u&&a.createElement(r.Link,{to:"/page/"+(d-1),className:"w-32 text-center px-4 py-1 border mx-4 border-gray-800 border-solid"},"Previous"),p&&a.createElement(r.Link,{to:"/page/"+(d+1),className:"w-32 text-center px-4 py-1 border mx-4 border-gray-800 border-solid"},"Next"))))}}}]);
//# sourceMappingURL=component---src-pages-index-js-89872398fa54d7dfa02e.js.map