"use strict";(self.webpackChunkaisensiy_s_blog=self.webpackChunkaisensiy_s_blog||[]).push([[950],{742:function(e,t,n){n.d(t,{Z:function(){return c}});var a=n(7294),r=n(5444);function l(e){var t=e.html;return a.createElement("div",{className:"table-of-content"},a.createElement("h2",null,"Table of Contents"),a.createElement("div",{dangerouslySetInnerHTML:{__html:t}}))}var s=function(e){var t=e.tag;return a.createElement("span",{className:"text-xs font-semibold inline-block py-1 px-2 rounded text-rose-700 bg-rose-200 last:mr-0 mr-1"},t)},o=function(e){var t=e.tags;return a.createElement("div",{className:""},t.map((function(e){return a.createElement(s,{key:e,tag:e})})))};function c(e){var t=e.data,n=t.frontmatter,s=t.html,c=t.fields,m=t.tableOfContents;return a.createElement("div",null,a.createElement("h1",null,c&&c.slug_without_date&&a.createElement(r.Link,{to:c.slug_without_date},n.title)||""+n.title),a.createElement("h2",null,n.date),n.tags&&a.createElement(o,{tags:n.tags}),m&&a.createElement(l,{html:m}),a.createElement("div",{className:"prose prose-blog dark:prose-invert max-w-none lg:prose-lg xl:prose-xl",dangerouslySetInnerHTML:{__html:s}}))}},9474:function(e,t,n){n.r(t),n.d(t,{default:function(){return c}});var a=n(7294),r=n(5444),l=n(742),s=n(9043),o=n(5414);function c(e){var t=e.data,n=t.blogs,c=n.nodes,m=n.pageInfo,i=c.map((function(e){return a.createElement("div",{className:""},a.createElement(l.Z,{data:e,key:e.id}),a.createElement("hr",{className:"mt-8"}))})),u=m.pageCount,d=m.hasPreviousPage,g=m.currentPage,f=g<u;return a.createElement(s.Z,null,a.createElement(o.q,{title:t.site.siteMetadata.title}),a.createElement("div",null,i,a.createElement("div",{className:"flex justify-center mt-8"},d&&a.createElement(r.Link,{to:"/page/"+(g-1),className:"w-32 text-center px-4 py-1 border mx-4 border-gray-800 border-solid"},"Previous"),f&&a.createElement(r.Link,{to:"/page/"+(g+1),className:"w-32 text-center px-4 py-1 border mx-4 border-gray-800 border-solid"},"Next"))))}}}]);
//# sourceMappingURL=component---src-templates-blogs-js-b81aa84e3c777d2f77e7.js.map