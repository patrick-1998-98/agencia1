import{j as o}from"./jsx-runtime.u17CrQMm.js";import{r as a}from"./index.XV_s366Q.js";const z="Zypher",N={x:23.44,y:66.1},$={x:75.31,y:66.1},A={w:23.75,h:22.43},E=20,c={site:z,from:N,to:$,size:A,radius:E},l="adminPromo:dismissedAt",M=7,R=1e3,D=["board","dragging","over","dropped","ticket"];function I({href:f="/admin",images:h="/admin-preview",badge:t="Admin dashboard",title:u=`A CRM built into ${c.site}`,side:g="right",mobileOffset:x="0px"}){const[i,n]=a.useState(!1),[y,b]=a.useState(!1),m=a.useRef(null);a.useEffect(()=>{try{const e=Number(localStorage.getItem(l));if(e&&Date.now()-e<M*864e5)return}catch{}const r=setTimeout(()=>n(!0),R);return()=>clearTimeout(r)},[]),a.useEffect(()=>{if(!i)return;const r=()=>b(!0),e=[...m.current?.querySelectorAll("img")??[]];Promise.all(e.map(S=>S.decode().catch(()=>{}))).then(r);const j=setTimeout(r,1500);return()=>clearTimeout(j)},[i]);const v=()=>{n(!1);try{localStorage.setItem(l,String(Date.now()))}catch{}};if(!i)return null;const{from:s,to:d,size:p,radius:w}=c,k={"--from-x":`${s.x}%`,"--from-y":`${s.y}%`,"--to-x":`${d.x}%`,"--to-y":`${d.y}%`,"--w":`${p.w}%`,"--h":`${p.h}%`,"--r":w};return o.jsxs("aside",{className:`admin-promo admin-promo--${g}`,"aria-label":t,style:{"--admin-promo-lift":x},children:[o.jsxs("div",{className:"admin-promo-card",children:[o.jsx("button",{type:"button",className:"admin-promo-close",onClick:v,"aria-label":"Dismiss",children:o.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round","aria-hidden":"true",children:o.jsx("path",{d:"M6 18 18 6M6 6l12 12"})})}),o.jsxs("a",{href:f,className:"admin-promo-link",children:[o.jsx("span",{className:`admin-promo-media${y?" is-playing":""}`,style:k,children:o.jsxs("span",{className:"admin-promo-stage","aria-hidden":"true",ref:m,children:[D.map(r=>o.jsx("img",{src:`${h}/${r}.webp`,alt:"",decoding:"async",className:`admin-promo-frame admin-promo-frame--${r}`},r)),o.jsx("svg",{className:"admin-promo-cursor",viewBox:"0 0 17 24",children:o.jsx("path",{d:"M1.5 1.5v18.2l4.6-4.4 3 6.9 3.2-1.4-3-6.8h6.3z"})})]})}),o.jsxs("span",{className:"admin-promo-body",children:[o.jsx("span",{className:"admin-promo-badge",children:t}),o.jsx("span",{className:"admin-promo-title",children:u})]})]})]}),o.jsx("style",{children:`
        /* Phones: 1rem in from the edges and clear of the home indicator, and
         * under the sites' menus, drawers and dialogs (z-index 40 and up),
         * which cover the screen there. */
        .admin-promo {
          position: fixed;
          bottom: calc(max(1rem, env(safe-area-inset-bottom)) + var(--admin-promo-lift, 0px));
          z-index: 30;
          padding: 2px;
          border-radius: 1rem;
          overflow: hidden;
          isolation: isolate;
          box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.35);
          animation: admin-promo-in 400ms ease-out;
        }
        .admin-promo--right { right: 1rem; }
        .admin-promo--left { left: 1rem; }
        @media (min-width: 768px) {
          .admin-promo { bottom: 1.5rem; z-index: 60; }
          .admin-promo--right { right: 1.5rem; }
          .admin-promo--left { left: 1.5rem; }
        }
        /* The metal edge: a slowly turning silver gradient behind the card. */
        .admin-promo::before {
          content: "";
          position: absolute;
          inset: -75%;
          z-index: -1;
          background: conic-gradient(#fafafa, #71717a, #e4e4e7, #3f3f46, #fafafa, #a1a1aa, #fafafa);
          animation: admin-promo-turn 8s linear infinite;
        }
        .admin-promo-card {
          position: relative;
          width: min(20rem, calc(100vw - 2rem));
          border-radius: calc(1rem - 2px);
          overflow: hidden;
          background: #18181b;
          color: #fff;
        }
        /* A card on the left leaves the right corner's button (a chat
         * launcher) room on phones. */
        @media (max-width: 767.98px) {
          .admin-promo--left .admin-promo-card { width: min(20rem, calc(100vw - 6.5rem)); }
        }
        .admin-promo-close {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.75rem;
          height: 1.75rem;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: rgb(0 0 0 / 0.55);
          color: #fff;
          cursor: pointer;
          backdrop-filter: blur(4px);
          transition: background-color 150ms;
        }
        .admin-promo-close:hover { background: rgb(0 0 0 / 0.8); }
        .admin-promo-close svg { width: 0.875rem; height: 0.875rem; }
        .admin-promo-link {
          display: block;
          color: inherit;
          text-decoration: none;
        }
        .admin-promo-media {
          display: block;
          position: relative;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          container-type: inline-size; /* the ticket's corner radius scales with it */
          background: #09090b;
          /* Where the cursor holds the ticket, and where it rests after. */
          --grab-x: calc(var(--from-x) + var(--w) * 0.5);
          --grab-y: calc(var(--from-y) + var(--h) * 0.35);
          --drop-x: calc(var(--to-x) + var(--w) * 0.5);
          --drop-y: calc(var(--to-y) + var(--h) * 0.35);
          --loop: 7s;
        }
        .admin-promo-stage {
          position: absolute;
          inset: 0;
          transition: transform 500ms;
        }
        .admin-promo-link:hover .admin-promo-stage { transform: scale(1.05); }
        .admin-promo-frame {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
        }
        .admin-promo-frame--board { opacity: 1; }
        .admin-promo-frame--ticket {
          inset: auto;
          left: var(--from-x);
          top: var(--from-y);
          width: var(--w);
          height: auto;
          border-radius: calc(var(--r) * 100cqw / 1280);
          transform-origin: 50% 35%;
        }
        .admin-promo-cursor {
          position: absolute;
          left: 96%;
          top: 104%;
          width: 0.75rem;
          margin: -1px 0 0 -1px;
          overflow: visible;
          transform-origin: 0 0;
          filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.35));
        }
        .admin-promo-cursor path {
          fill: #111;
          stroke: #fff;
          stroke-width: 1.5;
          stroke-linejoin: round;
        }
        .is-playing .admin-promo-frame--dragging { animation: admin-promo-dragging var(--loop) infinite; }
        .is-playing .admin-promo-frame--over { animation: admin-promo-over var(--loop) infinite; }
        .is-playing .admin-promo-frame--dropped { animation: admin-promo-dropped var(--loop) infinite; }
        .is-playing .admin-promo-frame--ticket { animation: admin-promo-ticket var(--loop) infinite; }
        .is-playing .admin-promo-cursor { animation: admin-promo-cursor var(--loop) infinite; }
        .admin-promo-body {
          display: block;
          padding: 1rem;
        }
        .admin-promo-badge {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 11px;
          line-height: 1rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #a1a1aa;
        }
        .admin-promo-title {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.375;
        }
        .admin-promo :focus-visible {
          outline: 2px solid #fff;
          outline-offset: -2px;
        }

        /* One loop: the cursor comes in and picks the ticket up (its slot
         * dims), carries it across (the column lights up under it), drops it
         * (the counts change), steps back, and the board resets. */
        @keyframes admin-promo-cursor {
          0% { left: 96%; top: 104%; transform: none; }
          16% { left: var(--grab-x); top: var(--grab-y); transform: none; }
          18% { transform: scale(0.8); }
          22% { left: var(--grab-x); top: var(--grab-y); transform: scale(0.9); animation-timing-function: cubic-bezier(0.45, 0, 0.3, 1); }
          46% { left: var(--drop-x); top: var(--drop-y); transform: scale(0.9); }
          50% { left: var(--drop-x); top: var(--drop-y); transform: none; }
          62%, 86% { left: calc(var(--drop-x) + 6%); top: calc(var(--drop-y) + 10%); transform: none; }
          100% { left: 96%; top: 104%; transform: none; }
        }
        @keyframes admin-promo-ticket {
          0%, 18% { left: var(--from-x); top: var(--from-y); opacity: 0; transform: none; box-shadow: none; }
          19% { left: var(--from-x); top: var(--from-y); opacity: 1; transform: none; box-shadow: none; }
          22% { left: var(--from-x); top: var(--from-y); transform: scale(1.06) rotate(-3deg); box-shadow: 0 10px 16px -6px rgb(0 0 0 / 0.35); animation-timing-function: cubic-bezier(0.45, 0, 0.3, 1); }
          46% { left: var(--to-x); top: var(--to-y); opacity: 1; transform: scale(1.06) rotate(-3deg); box-shadow: 0 10px 16px -6px rgb(0 0 0 / 0.35); }
          50% { left: var(--to-x); top: var(--to-y); opacity: 1; transform: none; box-shadow: none; }
          55%, 100% { left: var(--to-x); top: var(--to-y); opacity: 0; transform: none; box-shadow: none; }
        }
        @keyframes admin-promo-dragging {
          0%, 19% { opacity: 0; }
          21%, 54% { opacity: 1; }
          56%, 100% { opacity: 0; }
        }
        @keyframes admin-promo-over {
          0%, 34% { opacity: 0; }
          38%, 54% { opacity: 1; }
          56%, 100% { opacity: 0; }
        }
        @keyframes admin-promo-dropped {
          0%, 49% { opacity: 0; }
          53%, 86% { opacity: 1; }
          96%, 100% { opacity: 0; }
        }
        @keyframes admin-promo-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes admin-promo-turn {
          to { transform: rotate(1turn); }
        }
        /* Reduced motion: the still board, no cursor. */
        @media (prefers-reduced-motion: reduce) {
          .admin-promo, .admin-promo::before, .is-playing .admin-promo-frame, .is-playing .admin-promo-cursor { animation: none; }
          .admin-promo-frame--ticket, .admin-promo-cursor { display: none; }
          .admin-promo-link:hover .admin-promo-stage { transform: none; }
        }
      `})]})}export{I as default};
