"use strict";var t=Object.defineProperty;var d=Object.getOwnPropertyDescriptor;var p=Object.getOwnPropertyNames;var f=Object.prototype.hasOwnProperty;var r=(n,e)=>{for(var i in e)t(n,i,{get:e[i],enumerable:!0})},l=(n,e,i,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of p(e))!f.call(n,o)&&o!==i&&t(n,o,{get:()=>e[o],enumerable:!(s=d(e,o))||s.enumerable});return n};var u=n=>l(t({},"__esModule",{value:!0}),n);var m={};r(m,{default:()=>a});module.exports=u(m);var a=n=>{n.get("/",(e,i)=>{i.send("sample-extension")})};0&&(module.exports={});
