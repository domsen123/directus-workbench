var p=Object.defineProperty;var x=Object.getOwnPropertyDescriptor;var g=Object.getOwnPropertyNames;var C=Object.prototype.hasOwnProperty;var D=(e,i)=>{for(var s in i)p(e,s,{get:i[s],enumerable:!0})},N=(e,i,s,a)=>{if(i&&typeof i=="object"||typeof i=="function")for(let t of g(i))!C.call(e,t)&&t!==s&&p(e,t,{get:()=>i[t],enumerable:!(a=x(i,t))||a.enumerable});return e};var S=e=>N(p({},"__esModule",{value:!0}),e);var B={};D(B,{down:()=>U,up:()=>A});module.exports=S(B);var f="service_accounts";var n=e=>e?typeof e=="string"?e:JSON.stringify(e):null,K=()=>({readonly:!1,hidden:!1,width:"full",interface:"input",display:"raw",required:!1}),v=(e,i,s)=>{let{field:a,required:t}=s,{db_type:r,indexed:c,primary:b,options:y,relation:d,default_value:u}=s.db_options,l=y?i[r](a,y):i[r](a);return b&&l.primary(),c&&l.index(),u&&l.defaultTo(u==="current_timestamp"?e.fn.now():u),t&&l.notNullable(),d&&l.references(d.references).inTable(d.collection).onUpdate(d.onUpdate??"NO ACTION").onDelete(d.onDelete??"SET NULL"),l},O=async(e,i)=>{let s=e.isTransaction?e:await e.transaction(),a={...K(),...i};try{await s("directus_fields").insert({collection:a.collection,field:a.field,special:a.special,interface:a.interface,options:n(a.options),display:a.display,display_options:n(a.display_options),readonly:a.readonly,hidden:a.hidden,sort:a.sort,width:a.width,translations:n(a.translations),note:a.note,conditions:n(a.conditions),required:a.required}),a.db_options?.relation&&await s("directus_relations").insert({many_collection:a.collection,many_field:a.field,one_collection:a.db_options.relation.collection,one_deselect_action:"nullify"}),e.isTransaction||await s.commit()}catch(t){if(!e.isTransaction)await s.rollback();else throw t}},E=async(e,i)=>{let s=e.isTransaction?e:await e.transaction(),t={...{layout:"tabular",icon:"bookmark_outline"},...i};try{await s("directus_presets").insert({bookmark:t.bookmark,user:t.user,role:t.role,collection:t.collection,layout_query:n(t.layout_query),layout_options:n(t.layout_options),refresh_interval:t.refresh_interval,filter:t.filter,icon:t.icon,color:t.color}),e.isTransaction||await s.commit()}catch(r){if(!e.isTransaction)await s.rollback();else throw r}};var _=async(e,i)=>{let s=e.isTransaction?e:await e.transaction(),t={...{hidden:!1,singleton:!1,accountability:null,collapse:"open"},...i};try{await s.schema.createTable(t.collection,r=>{t.fields.map(c=>v(s,r,c))}),await s("directus_collections").insert({collection:t.collection,icon:t.icon,note:t.note,display_template:n(t.display_template),hidden:t.hidden,singleton:t.singleton,translations:n(t.translations),archive_field:t.archive_field,archive_app_filter:t.archive_app_filter,archive_value:t.archive_value,unarchive_value:t.unarchive_value,sort_field:t.sort_field,accountability:t.accountability,color:t.color,sort:t.sort,group:t.group,collapse:t.collapse}),await Promise.all(t.fields.map((r,c)=>O(s,{sort:c,...r}))),t.presets&&t.presets.length>0&&await Promise.all(t.presets.map(r=>E(s,r))),e.isTransaction||await s.commit()}catch(r){if(!e.isTransaction)await s.rollback();else throw r}};var h=async(e,i)=>{await e("directus_collections").where({collection:i}).delete(),await e("directus_fields").where({collection:i}).delete(),await e("directus_revisions").where({collection:i}).delete(),await e("directus_presets").where({collection:i}).delete(),await e("directus_relations").where({many_collection:i}).delete(),await e("directus_relations").where({one_collection:i}).delete(),await e("directus_activity").where({collection:i}).delete(),await e.schema.hasTable(i)&&await e.schema.dropTable(i)},m=e=>({collection:e,field:"uuid",special:"uuid",interface:"input",readonly:!0,hidden:!0,sort:1,width:"full",required:!1,db_options:{db_type:"uuid",primary:!0}}),F=e=>({collection:e,field:"date_updated",special:"cast-timestamp,date-updated",interface:"datetime",display:"datetime",display_options:JSON.stringify({relative:!0}),readonly:!0,hidden:!0,width:"half",required:!1,db_options:{db_type:"timestamp",default_value:"current_timestamp"}}),I=e=>({collection:e,field:"date_created",special:"cast-timestamp,date-created",interface:"datetime",display:"datetime",display_options:JSON.stringify({relative:!0}),readonly:!0,hidden:!0,width:"half",required:!1,db_options:{db_type:"timestamp",default_value:"current_timestamp"}}),L=e=>({collection:e,field:"user_created",special:"user-created",interface:"select-dropdown-m2o",options:JSON.stringify({template:"{{avatar.$thumbnail}} {{first_name}} {{last_name}}"}),display:"user",readonly:!0,hidden:!0,width:"half",required:!1,db_options:{db_type:"uuid",relation:{references:"id",collection:"directus_users",onUpdate:"NO ACTION",onDelete:"SET NULL"}}}),P=e=>({collection:e,field:"user_updated",special:"user-created",interface:"select-dropdown-m2o",options:JSON.stringify({template:"{{avatar.$thumbnail}} {{first_name}} {{last_name}}"}),display:"user",readonly:!0,hidden:!0,width:"half",required:!1,db_options:{db_type:"uuid",relation:{references:"id",collection:"directus_users",onUpdate:"NO ACTION",onDelete:"SET NULL"}}}),w=e=>[L(e),P(e)],T=e=>[I(e),F(e)];var o=f,A=async e=>{await _(e,{collection:o,fields:[m(o),{collection:o,field:"title",required:!0,db_options:{db_type:"string"}},{collection:o,field:"username",required:!0,db_options:{db_type:"string"}},{collection:o,field:"password",required:!0,options:{masked:!0},display:"masked",db_options:{db_type:"string"}},{collection:o,field:"expires_at",interface:"datetime",display:"datetime",db_options:{db_type:"dateTime"}},...w(o),...T(o)],presets:[{collection:o,layout:"tabular",layout_query:{tabular:{fields:["title","username","password","expires_at"]}},layout_options:{tabular:{widths:{},spacing:"compact"}}}]})},U=async e=>{await h(e,o)};0&&(module.exports={down,up});