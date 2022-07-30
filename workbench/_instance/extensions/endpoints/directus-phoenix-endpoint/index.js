"use strict";var g=Object.create;var u=Object.defineProperty;var f=Object.getOwnPropertyDescriptor;var $=Object.getOwnPropertyNames;var N=Object.getPrototypeOf,S=Object.prototype.hasOwnProperty;var y=(a,e)=>{for(var t in e)u(a,t,{get:e[t],enumerable:!0})},h=(a,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of $(e))!S.call(a,n)&&n!==t&&u(a,n,{get:()=>e[n],enumerable:!(i=f(e,n))||i.enumerable});return a};var m=(a,e,t)=>(t=a!=null?g(N(a)):{},h(e||!a||!a.__esModule?u(t,"default",{value:a,enumerable:!0}):t,a)),v=a=>h(u({},"__esModule",{value:!0}),a);var T={};y(T,{default:()=>I});module.exports=v(T);var E=m(require("knex")),d=m(require("alasql")),p=class{constructor(e,t){this.knex=e;this.logger=t}_config="phoenix";_connections="external_connections";_serviceAccounts="service_accounts";_distinct_alpha;_distinct_omega;get config(){return this.knex(this._config)}get connection(){return this.knex(this._connections)}get serviceAccount(){return this.knex(this._serviceAccounts)}getConnection=async e=>await this.connection.select("service_account","host","port","driver").where("uuid",e).first();getServiceAccount=async e=>await this.serviceAccount.select("username","password").where("uuid",e).first();rawQuery=async(e,t,i)=>{let n=t.trim(),s=i?`SELECT * FROM OPENQUERY(${i}, '${n.replaceAll("'","''")}');`:n;return await e.raw(s)};start=async e=>{let t=await this.config.where("uuid",e).first(),i=await this.getConnection(t.connection_alpha),n=await this.getConnection(t.connection_omega),s=await this.getServiceAccount(i.service_account),r=await this.getServiceAccount(n.service_account),o=(0,E.default)({client:i.driver,connection:{host:i.host,port:i.port,user:s.username,password:s.password,database:t.database_alpha??""}}),c=(0,E.default)({client:n.driver,connection:{host:n.host,port:n.port,user:r.username,password:r.password,database:t.database_omega??""}});if(t.advanced_mode)try{this.advanced_phoenix(t,o,c)}catch(_){this.logger.error(_.message)}return{config:t,connection_alpha:i,connection_omega:n,service_account_alpha:s,service_account_omega:r}};getDistinct=(e,t,i)=>(this[`_distinct_${t}`]||(this[`_distinct_${t}`]=(0,d.default)(`SELECT DISTINCT ${e.distinct_field} FROM ?`,[i])),this[`_distinct_${t}`]);findMissingItems=async(e,t,i)=>{let s=this.getDistinct(e,"omega",i).map(c=>`'${c[e.distinct_field]}'`).join(","),r=(0,d.default)("SELECT * FROM ? WHERE ERROR_TYPE IS NULL",[(0,d.default)(`SELECT result_alpha.*, result_omega.${e.identifier_field} ERROR_TYPE
				FROM ? result_alpha
				LEFT JOIN ? result_omega ON result_alpha.${e.identifier_field} = result_omega.${e.identifier_field}`,[(0,d.default)(`SELECT * FROM ? WHERE ${e.distinct_field} IN (${s})`,[t]),i])]),o=(0,d.default)(`SELECT ${e.distinct_field}, count(*) MISSING
			FROM ?
			GROUP BY ${e.distinct_field}
			ORDER BY ${e.distinct_field}`,[r]);return{result:r,grouped:o}};findOrphanedItems=async(e,t,i)=>{let s=this.getDistinct(e,"omega",i).map(c=>`'${c[e.distinct_field]}'`).join(","),r=(0,d.default)("SELECT * FROM ? WHERE ERROR_TYPE IS NULL",[(0,d.default)(`SELECT result_omega.*, result_alpha.${e.identifier_field} ERROR_TYPE
				FROM ? result_omega
				LEFT JOIN ? result_alpha ON result_alpha.${e.identifier_field} = result_omega.${e.identifier_field}`,[(0,d.default)(`SELECT * FROM ? WHERE ${e.distinct_field} IN (${s})`,[i]),t])]),o=(0,d.default)(`SELECT ${e.distinct_field}, count(*) ORPHANED
			FROM ?
			GROUP BY ${e.distinct_field}
			ORDER BY ${e.distinct_field}`,[r]);return{result:r,grouped:o}};findNotInSyncItems=async(e,t,i)=>{let n=Object.keys(t[0]).filter(l=>!["SYSTEM_NAME",e.identifier_field,e.distinct_field].includes(l)),r=this.getDistinct(e,"omega",i).map(l=>`'${l[e.distinct_field]}'`).join(","),o=n.map(l=>`result_alpha.${l} <> result_omega.${l}`).join(" OR "),c=(0,d.default)(`SELECT result_alpha.*, result_omega.${e.identifier_field} ERROR_TYPE
			FROM ? result_alpha
			LEFT JOIN ? result_omega ON result_alpha.${e.identifier_field} = result_omega.${e.identifier_field}
			AND (${o})
			UNION
			SELECT result_omega.*, result_alpha.${e.identifier_field} ERROR_TYPE
			FROM ? result_omega
			LEFT JOIN ? result_alpha ON result_alpha.${e.identifier_field} = result_omega.${e.identifier_field}
			AND (${o})
			`,[(0,d.default)(`SELECT * FROM ? WHERE ${e.distinct_field} IN (${r})`,[t]),i]),_=(0,d.default)(`SELECT ${e.distinct_field}, count(*) / 2 NOT_IN_SYNC
			FROM ?
			GROUP BY ${e.distinct_field}
			ORDER BY ${e.distinct_field}`,[c]);return{result:c,grouped:_}};advanced_phoenix=async(e,t,i)=>{let[n,s]=await Promise.all([this.rawQuery(t,e.advanced_query_alpha,e.linked_name_alpha),this.rawQuery(i,e.advanced_query_omega,e.linked_name_omega)]);if(n&&s){this.logger.info("- SEARCHING MISSING");let{result:r,grouped:o}=await this.findMissingItems(e,n,s);this.logger.info(`|- FOUND: ${r.length}`),this.logger.info("- SEARCHING ORPHANED");let{result:c,grouped:_}=await this.findOrphanedItems(e,n,s);this.logger.info(`|- FOUND: ${c.length}`),this.logger.info("- SEARCHING NOT_IN_SYNC");let{result:l,grouped:R}=await this.findNotInSyncItems(e,n,s);this.logger.info(`|- FOUND: ${l.length}`);let O=(0,d.default)(`
				SELECT
					${e.distinct_field}
					,(SELECT MISSING FROM :missing_grouped WHERE ${e.distinct_field} = d.${e.distinct_field}) MISSING
					,(SELECT ORPHANED FROM :orphaned_grouped WHERE ${e.distinct_field} = d.${e.distinct_field}) ORPHANED
					,(SELECT NOT_IN_SYNC FROM :notInSync_grouped WHERE ${e.distinct_field} = d.${e.distinct_field}) NOT_IN_SYNC
				FROM :distinct d
			`,{distinct:this.getDistinct(e,"omega",s),missing_grouped:o,orphaned_grouped:_,notInSync_grouped:R});console.table(O)}}};var I={id:"phoenix",handler:(a,{database:e,logger:t})=>{a.put("/:uuid",async(i,n)=>{let s=i.params.uuid,o=await new p(e,t).start(s);n.json(o)})}};0&&(module.exports={});
