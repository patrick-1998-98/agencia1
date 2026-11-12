import{j as e}from"./jsx-runtime.u17CrQMm.js";import{S as R}from"./ScrollReveal.pwZrZUxn.js";import{r as h}from"./index.XV_s366Q.js";import{g as v}from"./index.xgxdCp6f.js";import{S as y}from"./ScrollTrigger.ak1EnQU5.js";typeof window<"u"&&v.registerPlugin(y);function $({value:t,isFraction:r}){return e.jsx("span",{className:`odo-character ${r?"odo-fraction":""}`,children:e.jsxs("span",{className:"odo-track",style:{"--v":t},children:[e.jsx("span",{children:"9"}),[0,1,2,3,4,5,6,7,8,9].map(a=>e.jsx("span",{children:a},a)),e.jsx("span",{children:"0"})]})})}function C({value:t=0,decimals:r=0,prefix:a="",suffix:l="",pad:n=0,transition:o=1.6,fontSize:j="clamp(1.2rem, 2vw, 3rem)",className:k="",style:w={},once:d=!0,vertical:z=!1}){const m=h.useRef(null),[S,p]=h.useState(0);h.useEffect(()=>{const s=m.current;if(!s)return;const i=y.create({trigger:s,start:"top 90%",once:d,onEnter:()=>{v.delayedCall(0,()=>p(t))},onLeaveBack:()=>{d||p(0)}});return()=>i.kill()},[t,d]);const N=S.toFixed(r),[u,c]=N.split("."),f=n>0?u.padStart(n,"0"):u,g=a+f+(c?"."+c:"")+l,x=a.length,b=x+f.length+(c?1+c.length:0);return e.jsxs("span",{ref:m,className:`odo-root ${z?"odo-vertical":""} ${k}`,style:{"--font-size":j,"--line-height":"calc(var(--font-size) * 1.2)","--transition":o,"--mask-size":"0.15",...w},children:[e.jsx("span",{className:"odo-sr-only",children:g}),e.jsx("span",{"aria-hidden":"true",className:"odo-characters",children:g.split("").map((s,i)=>{if(!!isNaN(parseInt(s,10)))return e.jsx("span",{className:"odo-character odo-symbol",children:s},i);const E=c&&i>=x+f.length+1&&i<b;return e.jsx($,{value:parseInt(s,10),isFraction:E},i)})}),e.jsx("style",{children:`
        .odo-root {
          display: inline-flex;
          line-height: 1;
          font-variant: tabular-nums;
          writing-mode: horizontal-tb;
        }
        .odo-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }
        .odo-characters {
          display: inline-flex;
          gap: 1px;
          align-items: center;
        }
        .odo-vertical .odo-characters {
          flex-direction: column;
          gap: 0;
          line-height: 1;
        }
        .odo-character {
          display: inline-grid;
          height: 1lh;
          line-height: var(--line-height);
          font-variant: tabular-nums;
          font-size: var(--font-size);
          overflow: hidden;
          -webkit-mask: linear-gradient(transparent, white calc(1lh * var(--mask-size)) calc(100% - (1lh * var(--mask-size))), transparent);
          mask: linear-gradient(transparent, white calc(1lh * var(--mask-size)) calc(100% - (1lh * var(--mask-size))), transparent);
        }
        .odo-symbol {
          overflow: visible;
          -webkit-mask: none;
          mask: none;
          line-height: 1;
          height: auto;
        }
        .odo-fraction {
          font-size: calc(var(--font-size) * 0.75);
          opacity: 0.75;
        }
        .odo-track {
          display: grid;
          translate: 0 calc((var(--v) + 1) * (var(--line-height) * -1));
          transition: translate calc(var(--transition) * 1s) cubic-bezier(0.16, 1, 0.3, 1);
        }
        .odo-track > span {
          height: 1lh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `})]})}function F(t){if(t==null)return{value:0,prefix:"",suffix:""};const r=String(t),a=r.match(/^(\D*?)(-?\d*\.?\d+)(.*)$/);if(!a)return{value:0,prefix:"",suffix:r};const[,l,n,o]=a;return{value:parseFloat(n),prefix:l,suffix:o}}function L({items:t}){return!t||t.length===0?null:e.jsx("section",{className:"px-6 py-16",children:e.jsx(R,{as:"div",stagger:.08,y:20,className:"mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4",children:t.map((r,a)=>{const{value:l,prefix:n,suffix:o}=F(r.value);return e.jsxs("div",{className:"flex flex-col items-center text-center",children:[e.jsx(C,{value:l,prefix:n,suffix:o,fontSize:"clamp(2.25rem, 4vw, 3.25rem)",transition:1.8,className:"font-medium tracking-tight"}),e.jsx("div",{className:"mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground",children:r.label})]},a)})})})}export{L as default};
