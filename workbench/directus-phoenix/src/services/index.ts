import knex from 'knex';
import alasql from 'alasql';
import type { Knex } from 'knex';
import type { Logger } from 'pino';

export class PhoenixService {
	private started_at = new Date();
	private finished_at: Date | undefined;

	private _config = 'phoenix';
	private _connections = 'external_connections';
	private _serviceAccounts = 'service_accounts';

	private _result_alpha: any[] | undefined;
	private _result_omega: any[] | undefined;

	private _distinct_alpha: any[] | undefined;
	private _distinct_omega: any[] | undefined;
	private _base_alpha: any[] | undefined;

	constructor(private knex: Knex, private logger: Logger) {}
	private get config() {
		return this.knex(this._config);
	}
	private get connection() {
		return this.knex(this._connections);
	}
	private get serviceAccount() {
		return this.knex(this._serviceAccounts);
	}

	private getConnection = async (uuid: string) =>
		await this.connection.select('service_account', 'host', 'port', 'driver').where('uuid', uuid).first();

	private getServiceAccount = async (uuid: string) =>
		await this.serviceAccount.select('username', 'password').where('uuid', uuid).first();

	private rawQuery = async (knex: Knex, query: string, linked_server?: string) => {
		const q = query.trim();
		const rawQuery = linked_server ? `SELECT * FROM OPENQUERY(${linked_server}, '${q.replaceAll("'", "''")}');` : q;
		return await knex.raw(rawQuery);
	};

	public start = async (uuid: string) => {
		const config = await this.config.where('uuid', uuid).first();
		const connection_alpha = await this.getConnection(config.connection_alpha);
		const connection_omega = await this.getConnection(config.connection_omega);
		const service_account_alpha = await this.getServiceAccount(connection_alpha.service_account);
		const service_account_omega = await this.getServiceAccount(connection_omega.service_account);
		let knex_alpha: Knex | undefined, knex_omega: Knex | undefined;

		try {
			knex_alpha = knex({
				client: connection_alpha.driver,
				connection: {
					host: connection_alpha.host,
					port: connection_alpha.port,
					user: service_account_alpha.username,
					password: service_account_alpha.password,
					database: config.database_alpha ?? '',
				},
			});
		} catch (e: any) {
			this.logger.error(`ALPHA CONNECTION: ${e.message}`);
		}
		try {
			knex_omega = knex({
				client: connection_omega.driver,
				connection: {
					host: connection_omega.host,
					port: connection_omega.port,
					user: service_account_omega.username,
					password: service_account_omega.password,
					database: config.database_omega ?? '',
				},
			});
		} catch (e: any) {
			this.logger.error(`OMEGA CONNECTION: ${e.message}`);
		}
		if (!knex_alpha || !knex_omega) return;

		if (config.advanced_mode) {
			try {
				this.advanced_phoenix(config, knex_alpha, knex_omega);
			} catch (e: any) {
				this.logger.error(e.message);
			}
		}

		return {
			config,
			connection_alpha,
			connection_omega,
			service_account_alpha,
			service_account_omega,
		};
	};

	// private getDistinct = (config: any, entity: 'alpha' | 'omega', results: any[]): any[] => {
	// 	if (!this[`_distinct_${entity}`]) {
	// 		this[`_distinct_${entity}`] = alasql(`SELECT DISTINCT ${config.distinct_field} FROM ?`, [results]) as any[];
	// 	}
	// 	//@ts-ignore ...
	// 	return this[`_distinct_${entity}`];
	// };

	// private getBaseAlhpa = (config: any, result_alpha: any[], results_omega: any[]) => {
	// 	if (!this._base_alpha) {
	// 		this._base_alpha = alasql(
	// 			`SELECT * FROM ? WHERE ${config.distinct_field} IN (${this.getDistinct(config, 'omega', results_omega)})`,
	// 			[result_alpha]
	// 		);
	// 	}
	// 	return this._base_alpha;
	// };

	// private findMissingItems = async (config: any, result_alpha: any[], result_omega: any[]) => {
	// 	// const distinct_omega = this.getDistinct(config, 'omega', result_omega);
	// 	// const distinct_values_omega = distinct_omega.map((f: any) => `'${f[config.distinct_field]}'`).join(',');

	// 	const result = alasql(
	// 		`SELECT result_alpha.${config.identifier_field}
	// 		FROM ? result_alpha
	// 		LEFT JOIN ? result_omega ON result_alpha.${config.identifier_field} = result_omega.${config.identifier_field} AND result_omega.${config.identifier_field} IS NULL`,
	// 		[this.getBaseAlhpa(config, result_alpha, result_omega), result_omega]
	// 	);
	// 	const grouped = alasql(
	// 		`SELECT ${config.distinct_field}, count(*) MISSING
	// 		FROM ?
	// 		GROUP BY ${config.distinct_field}
	// 		ORDER BY ${config.distinct_field}`,
	// 		[result]
	// 	);
	// 	return { result, grouped };
	// };

	// private findOrphanedItems = async (config: any, result_alpha: any[], result_omega: any[]) => {
	// 	// const distinct_alpha = this.getDistinct(config, 'omega', result_omega);
	// 	// const distinct_values_alpha = distinct_alpha.map((f: any) => `'${f[config.distinct_field]}'`).join(',');

	// 	const result = alasql(
	// 		`SELECT result_omega.${config.identifier_field}
	// 		FROM ? result_omega
	// 		LEFT JOIN ? result_alpha ON result_alpha.${config.identifier_field} = result_omega.${config.identifier_field}  AND result_alpha.${config.identifier_field} IS NULL`,
	// 		[result_omega, this.getBaseAlhpa(config, result_alpha, result_omega)]
	// 	);
	// 	const grouped = alasql(
	// 		`SELECT ${config.distinct_field}, count(*) ORPHANED
	// 		FROM ?
	// 		GROUP BY ${config.distinct_field}
	// 		ORDER BY ${config.distinct_field}`,
	// 		[result]
	// 	);
	// 	return { result, grouped };
	// };

	// private findNotInSyncItems = async (config: any, result_alpha: any[], result_omega: any[]) => {
	// 	const field_to_check = Object.keys(result_alpha[0]).filter(
	// 		(field) => !['SYSTEM_NAME', config.identifier_field, config.distinct_field].includes(field)
	// 	);
	// 	// const distinct_omega = this.getDistinct(config, 'omega', result_omega);
	// 	// const distinct_values_omega = distinct_omega.map((f: any) => `'${f[config.distinct_field]}'`).join(',');

	// 	const join_clause = field_to_check.map((f) => `result_alpha.${f} <> result_omega.${f}`).join(' OR ');

	// 	this.logger.info(join_clause);

	// 	const result = alasql(
	// 		`SELECT result_alpha.*, 'NOT_IN_SYNC' ERROR_TYPE
	// 		FROM ? result_alpha
	// 		JOIN ? result_omega ON result_alpha.${config.identifier_field} = result_omega.${config.identifier_field}
	// 		AND (${join_clause})
	// 		UNION
	// 		SELECT result_omega.*, 'NOT_IN_SYNC' ERROR_TYPE
	// 		FROM ? result_omega
	// 		JOIN ? result_alpha ON result_alpha.${config.identifier_field} = result_omega.${config.identifier_field}
	// 		AND (${join_clause})
	// 		`,
	// 		[this.getBaseAlhpa(config, result_alpha, result_omega), result_omega]
	// 	);
	// 	const grouped = alasql(
	// 		`SELECT ${config.distinct_field}, count(*) / 2 NOT_IN_SYNC
	// 		FROM ?
	// 		GROUP BY ${config.distinct_field}
	// 		ORDER BY ${config.distinct_field}`,
	// 		[result]
	// 	);
	// 	return { result, grouped };
	// };

	private advanced_phoenix = async (config: any, knex_alpha: Knex, knex_omega: Knex) => {
		const [result_alpha, result_omega] = await Promise.all([
			this.rawQuery(knex_alpha, config.advanced_query_alpha, config.linked_name_alpha),
			this.rawQuery(knex_omega, config.advanced_query_omega, config.linked_name_omega),
		]);
		this.logger.info(`ALPHA: ${result_alpha.length}`);
		this.logger.info(`OEMGA: ${result_omega.length}`);

		// const sql = `SELECT * FROM :result_alpha WHERE COMPANY_CODE IN (SELECT DISTINCT COMPANY_CODE FROM :result_omega)`;
		const base = result_alpha.filter((item: any) =>
			[...new Set(result_omega.map((item: any) => item.COMPANY_CODE))].includes(item.COMPANY_CODE)
		);

		this.logger.info(`BASE: ${base.length}`);

		// const exists = await this.knex.schema.hasTable(config.uuid);
		// if (exists) {
		// 	await this.knex.schema.dropTable(config.uuid);
		// }
		// // if (!exists) {
		// this.knex.schema.createTable(config.uuid, (table) => {
		// 	table.string(`SYSTEM_NAME`);
		// 	table.string(config.identifier_field).index();
		// 	table.string(config.distinct_field);
		// 	Object.keys(result_alpha[0])
		// 		.filter((field) => !['SYSTEM_NAME', config.identifier_field, config.distinct_field].includes(field))
		// 		.map((v) => table.string(v));
		// 	table.index(['SYSTEM_NAME', config.identifier_field, config.distinct_field], 'idx_sys');
		// });
		// let q = `INSERT INTO ${config.uuid}(${Object.keys(result_alpha[0])
		// 	.map((k) => k)
		// 	.join(',')}) VALUES `;

		// q =
		// 	q +
		// 	[...result_alpha, ...result_omega]
		// 		.map(
		// 			(item) =>
		// 				`(${(Object.values(item) as string[]).map((c: string) => `'${c.replaceAll("'", "''")}'`).join(',')})`
		// 		)
		// 		.join(',');
		// await this.knex.raw(q);

		// await this.knex.schema.dropTable(config.uuid);
		// }
		this.logger.info(`FINISHED`);
		// this._result_alpha = alasql(
		// 	`SELECT * FROM :result_alpha WHERE ${config.distinct_field} IN (SELECT DISTINCT ${config.distinct_field} FROM :result_omega)`,
		// 	{
		// 		result_alpha,
		// 		result_omega,
		// 	}
		// ) as any[];
		// this._result_omega = result_omega as any[];

		// this.logger.info(`ALPHA BASE: ${this._result_alpha.length}`);
		// this.logger.info(`OEMGA BASE: ${this._result_omega.length}`);

		// if (this._result_alpha && this._result_omega) {
		// 	this.logger.info(`Missing start`);
		// 	const missing = alasql(
		// 		`
		// 	SELECT alpha.${config.identifier_field}
		// 	FROM ?
		// 	LEFT JOIN ? omega ON alpha.${config.identifier_field} = omega.${config.identifier_field} AND omega.${config.identifier_field} IS NULL
		// 	`,
		// 		[this._result_alpha, alasql(`SELECT ${config.identifier_field} FROM ?`, [this._result_omega])]
		// 	);
		// 	this.logger.info(`Missing end ${missing.length}`);
		// }

		// if (result_alpha && result_omega) {
		// 	this.logger.info('- SEARCHING MISSING');
		// 	const { result: missing, grouped: missing_grouped } = await this.findMissingItems(
		// 		config,
		// 		result_alpha,
		// 		result_omega
		// 	);
		// 	this.logger.info(`|- FOUND: ${missing.length}`);
		// 	this.logger.info('- SEARCHING ORPHANED');
		// 	const { result: orphaned, grouped: orphaned_grouped } = await this.findOrphanedItems(
		// 		config,
		// 		result_alpha,
		// 		result_omega
		// 	);
		// 	this.logger.info(`|- FOUND: ${orphaned.length}`);
		// 	this.logger.info('- SEARCHING NOT_IN_SYNC');
		// 	const { result: notInSync, grouped: notInSync_grouped } = await this.findNotInSyncItems(
		// 		config,
		// 		result_alpha,
		// 		result_omega
		// 	);
		// 	this.logger.info(`|- FOUND: ${notInSync.length}`);

		// 	const result = alasql(
		// 		`
		// 		SELECT
		// 			${config.distinct_field}
		// 			,(SELECT MISSING FROM :missing_grouped WHERE ${config.distinct_field} = d.${config.distinct_field}) MISSING
		// 			,(SELECT ORPHANED FROM :orphaned_grouped WHERE ${config.distinct_field} = d.${config.distinct_field}) ORPHANED
		// 			,(SELECT NOT_IN_SYNC FROM :notInSync_grouped WHERE ${config.distinct_field} = d.${config.distinct_field}) NOT_IN_SYNC
		// 		FROM :distinct d
		// 	`,
		// 		{
		// 			distinct: this.getDistinct(config, 'omega', result_omega),
		// 			missing_grouped,
		// 			orphaned_grouped,
		// 			notInSync_grouped,
		// 		}
		// 	);
		// 	console.table(result);
		// }

		// console.log({ result_alpha, result_omega });
	};
}
