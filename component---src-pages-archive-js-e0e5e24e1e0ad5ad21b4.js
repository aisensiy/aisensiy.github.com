"use strict";(self.webpackChunkaisensiy_s_blog=self.webpackChunkaisensiy_s_blog||[]).push([[527],{2059:function(e,t,n){var a=n(7294),r=n(7896),l=n(1883);const c=e=>{let{title:t,description:n,image:c,article:o}=e;const{pathname:m}=(0,r.useLocation)(),{site:s}=(0,l.K2)(i),{defaultTitle:u,defaultDescription:d,siteUrl:g,defaultImage:E,twitterUsername:f}=s.siteMetadata,h={title:t||u,description:n||d,image:""+g+(c||E),url:""+g+m};return a.createElement(a.Fragment,null,a.createElement("title",null,h.title),a.createElement("meta",{name:"description",content:h.description}),a.createElement("meta",{name:"image",content:h.image}),h.url&&a.createElement("meta",{property:"og:url",content:h.url}),!o?null:a.createElement("meta",{property:"og:type",content:"article"}),h.title&&a.createElement("meta",{property:"og:title",content:h.title}),h.description&&a.createElement("meta",{property:"og:description",content:h.description}),h.image&&a.createElement("meta",{property:"og:image",content:h.image}),a.createElement("meta",{name:"twitter:card",content:"summary_large_image"}),f&&a.createElement("meta",{name:"twitter:creator",content:f}),h.title&&a.createElement("meta",{name:"twitter:title",content:h.title}),h.description&&a.createElement("meta",{name:"twitter:description",content:h.description}),h.image&&a.createElement("meta",{name:"twitter:image",content:h.image}))};t.Z=c,c.defaultProps={title:null,description:null,image:null,article:!1};const i="26522286"},8897:function(e,t,n){n.d(t,{Z:function(){return m}});var a=n(7294),r=n(1883);function l(){const e=function(){const{0:e,1:t}=(0,a.useState)(!0);return(0,a.useEffect)((()=>{const e=window.matchMedia("(prefers-color-scheme: dark)");t(e.matches);const n=()=>t(e.matches);return e.addEventListener("change",n),()=>e.removeEventListener("change",n)}),[]),e}(),[t,n]=function(e,t){const{0:n,1:r}=(0,a.useState)((()=>{try{const n=window.localStorage.getItem(e);return n?JSON.parse(n):t}catch{return t}}));return[n,t=>{try{window.localStorage.setItem(e,t),r(t)}catch{r(t)}}]}("dark-mode",void 0),r=void 0===t?e:t;return(0,a.useEffect)((()=>{if(void 0===window)return;const e=window.document.documentElement;e.classList.remove(r?"light":"dark"),e.classList.add(r?"dark":"light")}),[r]),[r,n]}const c=()=>a.createElement("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",role:"img"},a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"})),i=()=>a.createElement("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",role:"img"},a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"}));function o(e){let{className:t}=e;const[n,r]=l();return a.createElement("button",{"aria-label":n?"Activate Light Mode":"Activate Dark Mode",title:n?"Activate Light Mode":"Activate Dark Mode",onClick:()=>{r(!n)},className:t},n?a.createElement(i,null):a.createElement(c,null))}function m(e){let{children:t}=e;const n=(new Date).getFullYear();return a.createElement("div",null,a.createElement("div",{className:"md:text-left text-center md:fixed md:w-80 bg-gray-900 md:h-full text-white"},a.createElement("div",{className:"p-4 mx-auto text-center"},a.createElement(o,{className:"text-center"})),a.createElement("div",{className:"md:absolute bottom-0 py-12 mx-12 space-y-8"},a.createElement("h1",{className:"text-6xl font-black font-serif"},"Eisen's Blog"),a.createElement("nav",null,a.createElement("ul",{className:"text-md flex-row"},a.createElement("li",null,a.createElement(r.rU,{to:"/",className:"leading-7 block hover:underline"},"Home")),a.createElement("li",null,a.createElement(r.rU,{to:"/about",className:"leading-7 block hover:underline"},"About")),a.createElement("li",null,a.createElement(r.rU,{to:"/archive",className:"leading-7 block hover:underline"},"Archive")),a.createElement("li",null,a.createElement(r.rU,{to:"/tags",className:"leading-7 block hover:underline"},"Tags")),a.createElement("li",null,a.createElement(r.rU,{to:"/serials",className:"leading-7 block hover:underline"},"Serials")),a.createElement("li",null,a.createElement("a",{href:"https://github.com/aisensiy",target:"_blank",rel:"noreferrer",className:"leading-7 block hover:underline"},"GitHub")))),a.createElement("footer",{className:"text-gray-400"},"© ",n,". All rights reserved."))),a.createElement("div",{className:"md:ml-80 p-4 md:p-8 md:max-w-6xl main"},t))}},5790:function(e,t,n){n.r(t),n.d(t,{Head:function(){return o},default:function(){return i}});var a=n(1883),r=n(7294),l=n(8897),c=n(2059);function i(e){let{data:t}=e;const n=function(e){const t={};for(let a of e)t[a.frontmatter.year]||(t[a.frontmatter.year]=[]),t[a.frontmatter.year].push(a);const n=Object.keys(t).map((e=>({key:e,value:t[e]})));return n.sort(((e,t)=>e.key-t.key)).reverse(),n}(t.allMarkdownRemark.nodes);return r.createElement(l.Z,null,r.createElement("div",null,r.createElement("h1",null,"Archive"),n.map((e=>{let{key:t,value:n}=e;return r.createElement("div",{key:t},r.createElement("h2",{className:"text-2xl font-bold tracking-tight my-4"},t),r.createElement(m,{blogs:n}))}))))}const o=()=>r.createElement(c.Z,{title:"Archive"});function m(e){let{blogs:t}=e;return r.createElement("ul",{className:"space-y-1"},t.map((e=>r.createElement("li",{className:"list-disc list-inside",key:e.id},r.createElement(a.rU,{to:e.fields.slug_without_date},e.frontmatter.title," - ",e.frontmatter.date)))))}}}]);
//# sourceMappingURL=component---src-pages-archive-js-e0e5e24e1e0ad5ad21b4.js.map