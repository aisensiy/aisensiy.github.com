"use strict";(self.webpackChunkaisensiy_s_blog=self.webpackChunkaisensiy_s_blog||[]).push([[169],{4615:function(e,t,r){var n=r(7294),a=r(5414),i=r(9499),l=r(5444),o=function(e){var t=e.title,r=e.description,o=e.image,m=e.article,u=(0,i.useLocation)().pathname,s=(0,l.useStaticQuery)(c).site.siteMetadata,p=s.defaultTitle,f=s.titleTemplate,d=s.defaultDescription,g=s.siteUrl,y=s.defaultImage,v=s.twitterUsername,E={title:t||p,description:r||d,image:""+g+(o||y),url:""+g+u};return n.createElement(a.q,{title:E.title,titleTemplate:f},n.createElement("meta",{name:"description",content:E.description}),n.createElement("meta",{name:"image",content:E.image}),E.url&&n.createElement("meta",{property:"og:url",content:E.url}),!m?null:n.createElement("meta",{property:"og:type",content:"article"}),E.title&&n.createElement("meta",{property:"og:title",content:E.title}),E.description&&n.createElement("meta",{property:"og:description",content:E.description}),E.image&&n.createElement("meta",{property:"og:image",content:E.image}),n.createElement("meta",{name:"twitter:card",content:"summary_large_image"}),v&&n.createElement("meta",{name:"twitter:creator",content:v}),E.title&&n.createElement("meta",{name:"twitter:title",content:E.title}),E.description&&n.createElement("meta",{name:"twitter:description",content:E.description}),E.image&&n.createElement("meta",{name:"twitter:image",content:E.image}))};t.Z=o,o.defaultProps={title:null,description:null,image:null,article:!1};var c="4202924991"},2295:function(e,t,r){r.r(t),r.d(t,{default:function(){return m}});var n=r(5444),a=r(7294),i=r(9043),l=r(4615);function o(e,t){var r="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(r)return(r=r.call(e)).next.bind(r);if(Array.isArray(e)||(r=function(e,t){if(!e)return;if("string"==typeof e)return c(e,t);var r=Object.prototype.toString.call(e).slice(8,-1);"Object"===r&&e.constructor&&(r=e.constructor.name);if("Map"===r||"Set"===r)return Array.from(e);if("Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return c(e,t)}(e))||t&&e&&"number"==typeof e.length){r&&(e=r);var n=0;return function(){return n>=e.length?{done:!0}:{done:!1,value:e[n++]}}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function c(e,t){(null==t||t>e.length)&&(t=e.length);for(var r=0,n=new Array(t);r<t;r++)n[r]=e[r];return n}function m(e){var t=function(e){console.log(e);for(var t,r={},n=o(e);!(t=n()).done;){var a=t.value;if(a.frontmatter.categories)for(var i,l=o(a.frontmatter.categories);!(i=l()).done;){var c=i.value;r[c]||(r[c]=[]),r[c].push(a)}}var m=Object.keys(r).map((function(e){return{key:e,value:r[e],weight:r[e].length?r[e][0].frontmatter.timestamp:0}}));return m.sort((function(e,t){return e.weight-t.weight})),m}(e.data.allMarkdownRemark.nodes);return a.createElement(i.Z,null,a.createElement(l.Z,{title:"Serials"}),a.createElement("div",null,a.createElement("h1",null,"Serials"),t.map((function(e){var t=e.key,r=e.value;return a.createElement("div",{key:t},a.createElement("h2",{className:"text-2xl font-bold tracking-tight my-4"},t),a.createElement(u,{blogs:r}))}))))}function u(e){var t=e.blogs;return a.createElement("ul",{className:"space-y-1"},t.map((function(e){return a.createElement("li",{className:"list-disc list-inside",key:e.id},a.createElement(n.Link,{to:e.fields.slug_without_date},e.frontmatter.date," - ",e.frontmatter.title))})))}}}]);
//# sourceMappingURL=component---src-pages-serials-js-09f14bfd6f6113f5263b.js.map