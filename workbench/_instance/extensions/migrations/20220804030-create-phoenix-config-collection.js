"use strict";var p=Object.defineProperty;var N=Object.getOwnPropertyDescriptor;var v=Object.getOwnPropertyNames;var S=Object.prototype.hasOwnProperty;var q=(e,i)=>{for(var n in i)p(e,n,{get:i[n],enumerable:!0})},x=(e,i,n,a)=>{if(i&&typeof i=="object"||typeof i=="function")for(let t of v(i))!S.call(e,t)&&t!==n&&p(e,t,{get:()=>i[t],enumerable:!(a=N(i,t))||a.enumerable});return e};var C=e=>x(p({},"__esModule",{value:!0}),e);var U={};q(U,{down:()=>B,up:()=>M});module.exports=C(U);var f="external_connections";var y="phoenix_config";var r=e=>e?typeof e=="string"?e:JSON.stringify(e):null,D=()=>({readonly:!1,hidden:!1,width:"full",interface:"input",display:"raw",required:!1}),I=(e,i,n)=>{let{field:a,required:t}=n,{db_type:o,indexed:d,primary:g,options:_,relation:c,default_value:u}=n.db_options,l=_?i[o](a,_):i[o](a);return g&&l.primary(),d&&l.index(),u&&l.defaultTo(u==="current_timestamp"?e.fn.now():u),t&&l.notNullable(),c&&l.references(c.references).inTable(c.collection).onUpdate(c.onUpdate??"NO ACTION").onDelete(c.onDelete??"SET NULL"),l},O=async(e,i)=>{let n=e.isTransaction?e:await e.transaction(),a={...D(),...i};try{await n("directus_fields").insert({collection:a.collection,field:a.field,special:a.special,interface:a.interface,options:r(a.options),display:a.display,display_options:r(a.display_options),readonly:a.readonly,hidden:a.hidden,sort:a.sort,width:a.width,translations:r(a.translations),note:a.note,conditions:r(a.conditions),required:a.required}),a.db_options?.relation&&await n("directus_relations").insert({many_collection:a.collection,many_field:a.field,one_collection:a.db_options.relation.collection,one_deselect_action:"nullify"}),e.isTransaction||await n.commit()}catch(t){if(!e.isTransaction)await n.rollback();else throw t}},K=async(e,i)=>{let n=e.isTransaction?e:await e.transaction(),t={...{layout:"tabular",icon:"bookmark_outline"},...i};try{await n("directus_presets").insert({bookmark:t.bookmark,user:t.user,role:t.role,collection:t.collection,layout_query:r(t.layout_query),layout_options:r(t.layout_options),refresh_interval:t.refresh_interval,filter:t.filter,icon:t.icon,color:t.color}),e.isTransaction||await n.commit()}catch(o){if(!e.isTransaction)await n.rollback();else throw o}};var m=async(e,i)=>{let n=e.isTransaction?e:await e.transaction(),t={...{hidden:!1,singleton:!1,accountability:null,collapse:"open"},...i};try{await n.schema.createTable(t.collection,o=>{t.fields.map(d=>I(n,o,d))}),await n("directus_collections").insert({collection:t.collection,icon:t.icon,note:t.note,display_template:r(t.display_template),hidden:t.hidden,singleton:t.singleton,translations:r(t.translations),archive_field:t.archive_field,archive_app_filter:t.archive_app_filter,archive_value:t.archive_value,unarchive_value:t.unarchive_value,sort_field:t.sort_field,accountability:t.accountability,color:t.color,sort:t.sort,group:t.group,collapse:t.collapse}),await Promise.all(t.fields.map((o,d)=>O(n,{sort:d,...o}))),t.presets&&t.presets.length>0&&await Promise.all(t.presets.map(o=>K(n,o))),e.isTransaction||await n.commit()}catch(o){if(!e.isTransaction)await n.rollback();else throw o}};var h=async(e,i)=>{await e("directus_collections").where({collection:i}).delete(),await e("directus_fields").where({collection:i}).delete(),await e("directus_revisions").where({collection:i}).delete(),await e("directus_presets").where({collection:i}).delete(),await e("directus_relations").where({many_collection:i}).delete(),await e("directus_relations").where({one_collection:i}).delete(),await e("directus_activity").where({collection:i}).delete(),await e.schema.hasTable(i)&&await e.schema.dropTable(i)},w=e=>({collection:e,field:"uuid",special:"uuid",interface:"input",readonly:!0,hidden:!0,sort:1,width:"full",required:!1,db_options:{db_type:"uuid",primary:!0}}),L=e=>({collection:e,field:"date_updated",special:"cast-timestamp,date-updated",interface:"datetime",display:"datetime",display_options:JSON.stringify({relative:!0}),readonly:!0,hidden:!0,width:"half",required:!1,db_options:{db_type:"timestamp",default_value:"current_timestamp"}}),E=e=>({collection:e,field:"date_created",special:"cast-timestamp,date-created",interface:"datetime",display:"datetime",display_options:JSON.stringify({relative:!0}),readonly:!0,hidden:!0,width:"half",required:!1,db_options:{db_type:"timestamp",default_value:"current_timestamp"}}),F=e=>({collection:e,field:"user_created",special:"user-created",interface:"select-dropdown-m2o",options:JSON.stringify({template:"{{avatar.$thumbnail}} {{first_name}} {{last_name}}"}),display:"user",readonly:!0,hidden:!0,width:"half",required:!1,db_options:{db_type:"uuid",relation:{references:"id",collection:"directus_users",onUpdate:"NO ACTION",onDelete:"SET NULL"}}}),P=e=>({collection:e,field:"user_updated",special:"user-created",interface:"select-dropdown-m2o",options:JSON.stringify({template:"{{avatar.$thumbnail}} {{first_name}} {{last_name}}"}),display:"user",readonly:!0,hidden:!0,width:"half",required:!1,db_options:{db_type:"uuid",relation:{references:"id",collection:"directus_users",onUpdate:"NO ACTION",onDelete:"SET NULL"}}}),b=e=>[F(e),P(e)],T=e=>[E(e),L(e)];var s=y,M=async e=>{await m(e,{collection:s,fields:[w(s),{collection:s,field:"advanced_mode",special:"cast-boolean",interface:"boolean",display:"boolean",db_options:{db_type:"boolean"}},{collection:s,field:"identifier_field",required:!0,width:"half",db_options:{db_type:"string"}},{collection:s,field:"distinct_field",required:!0,width:"half",db_options:{db_type:"string"}},{collection:s,field:"connection_alpha",special:"m2o",interface:"select-dropdown-m2o",options:{template:"{{title}}"},display:"related-values",display_options:{template:"{{title}}"},required:!0,width:"half",db_options:{db_type:"uuid",relation:{collection:f,references:"uuid"}}},{collection:s,field:"connection_omega",special:"m2o",interface:"select-dropdown-m2o",options:{template:"{{title}}"},display:"related-values",display_options:{template:"{{title}}"},required:!0,width:"half",db_options:{db_type:"uuid",relation:{collection:f,references:"uuid"}}},{collection:s,field:"linked_name_alpha",width:"half",conditions:[{name:"IS MSSQL -> Show",rule:{_and:[{connection_alpha:{driver:{_eq:"mssql"}}}]},hidden:!1,options:{font:"sans-serif",trim:!1,masked:!1,clear:!1,slug:!1}},{name:"IS NOT MSSQL -> Hide",rule:{_and:[{_or:[{connection_alpha:{driver:{_neq:"mssql"}}},{connection_alpha:{_null:!0}}]}]},hidden:!0,options:{font:"sans-serif",trim:!1,masked:!1,clear:!1,slug:!1}}],db_options:{db_type:"string"}},{collection:s,field:"linked_name_omega",width:"half",conditions:[{name:"IS MSSQL -> Show",rule:{_and:[{connection_omega:{driver:{_eq:"mssql"}}}]},hidden:!1,options:{font:"sans-serif",trim:!1,masked:!1,clear:!1,slug:!1}},{name:"IS NOT MSSQL -> Hide",rule:{_and:[{_or:[{connection_omega:{driver:{_neq:"mssql"}}},{connection_omega:{_null:!0}}]}]},hidden:!0,options:{font:"sans-serif",trim:!1,masked:!1,clear:!1,slug:!1}}],db_options:{db_type:"string"}},{collection:s,field:"query_alpha",interface:"input-code",options:{language:"sql"},display:null,required:!1,conditions:[{name:"Is Advanced Mode",rule:{_and:[{advanced_mode:{_eq:!0}}]},options:{lineNumber:!0,lineWrapping:!1,template:null},hidden:!1,required:!0},{name:"Is Not Advanced Mode",rule:{_and:[{advanced_mode:{_eq:null}}]},hidden:!0,options:{lineNumber:!0,lineWrapping:!1,template:null}}],db_options:{db_type:"text"}},{collection:s,field:"query_omega",interface:"input-code",options:{language:"sql"},display:null,required:!1,conditions:[{name:"Is Advanced Mode",rule:{_and:[{advanced_mode:{_eq:!0}}]},options:{lineNumber:!0,lineWrapping:!1,template:null},hidden:!1,required:!0},{name:"Is Not Advanced Mode",rule:{_and:[{advanced_mode:{_eq:null}}]},hidden:!0,options:{lineNumber:!0,lineWrapping:!1,template:null}}],db_options:{db_type:"text"}},...b(s),...T(s)],presets:[{collection:s,layout:"tabular",layout_query:{tabular:{fields:["connection_alpha","connection_omega","identifier_field","distinct_field","advanced_mode"]}},layout_options:{tabular:{widths:{},spacing:"compact"}}}]})},B=async e=>{await h(e,s)};0&&(module.exports={down,up});
