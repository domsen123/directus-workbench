import knex from 'knex';
import alasql from 'alasql';
import type { Knex } from 'knex';
import type { Logger } from 'pino';

export class PhoenixService {
	private _config = 'phoenix';
	private _connections = 'external_connections';
	private _serviceAccounts = 'service_accounts';

	private _distinct_alpha: any[] | undefined;
	private _distinct_omega: any[] | undefined;

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

		const knex_alpha = knex({
			client: connection_alpha.driver,
			connection: {
				host: connection_alpha.host,
				port: connection_alpha.port,
				user: service_account_alpha.username,
				password: service_account_alpha.password,
				database: config.database_alpha ?? '',
			},
		});
		const knex_omega = knex({
			client: connection_omega.driver,
			connection: {
				host: connection_omega.host,
				port: connection_omega.port,
				user: service_account_omega.username,
				password: service_account_omega.password,
				database: config.database_omega ?? '',
			},
		});
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

	private getDistinct = (config: any, entity: 'alpha' | 'omega', results: any[]): any[] => {
		if (!this[`_distinct_${entity}`]) {
			this[`_distinct_${entity}`] = alasql(`SELECT DISTINCT ${config.distinct_field} FROM ?`, [results]) as any[];
		}
		//@ts-ignore ...
		return this[`_distinct_${entity}`];
	};

	private findMissingItems = async (config: any, result_alpha: any[], result_omega: any[]) => {
		const distinct_omega = this.getDistinct(config, 'omega', result_omega);
		const distinct_values_omega = distinct_omega.map((f: any) => `'${f[config.distinct_field]}'`).join(',');

		const result = alasql(`SELECT * FROM ? WHERE ERROR_TYPE IS NULL`, [
			alasql(
				`SELECT result_alpha.*, result_omega.${config.identifier_field} ERROR_TYPE
				FROM ? result_alpha
				LEFT JOIN ? result_omega ON result_alpha.${config.identifier_field} = result_omega.${config.identifier_field}`,
				[
					alasql(`SELECT * FROM ? WHERE ${config.distinct_field} IN (${distinct_values_omega})`, [result_alpha]),
					result_omega,
				]
			),
		]);
		const grouped = alasql(
			`SELECT ${config.distinct_field}, count(*) MISSING
			FROM ?
			GROUP BY ${config.distinct_field}
			ORDER BY ${config.distinct_field}`,
			[result]
		);
		return { result, grouped };
	};

	private findOrphanedItems = async (config: any, result_alpha: any[], result_omega: any[]) => {
		const distinct_alpha = this.getDistinct(config, 'omega', result_omega);
		const distinct_values_alpha = distinct_alpha.map((f: any) => `'${f[config.distinct_field]}'`).join(',');

		const result = alasql(`SELECT * FROM ? WHERE ERROR_TYPE IS NULL`, [
			alasql(
				`SELECT result_omega.*, result_alpha.${config.identifier_field} ERROR_TYPE
				FROM ? result_omega
				LEFT JOIN ? result_alpha ON result_alpha.${config.identifier_field} = result_omega.${config.identifier_field}`,
				[
					alasql(`SELECT * FROM ? WHERE ${config.distinct_field} IN (${distinct_values_alpha})`, [result_omega]),
					result_alpha,
				]
			),
		]);
		const grouped = alasql(
			`SELECT ${config.distinct_field}, count(*) ORPHANED
			FROM ?
			GROUP BY ${config.distinct_field}
			ORDER BY ${config.distinct_field}`,
			[result]
		);
		return { result, grouped };
	};

	private findNotInSyncItems = async (config: any, result_alpha: any[], result_omega: any[]) => {
		const field_to_check = Object.keys(result_alpha[0]).filter(
			(field) => !['SYSTEM_NAME', config.identifier_field, config.distinct_field].includes(field)
		);
		const distinct_omega = this.getDistinct(config, 'omega', result_omega);
		const distinct_values_omega = distinct_omega.map((f: any) => `'${f[config.distinct_field]}'`).join(',');

		const join_clause = field_to_check.map((f) => `result_alpha.${f} <> result_omega.${f}`).join(' OR ');

		const result = alasql(
			`SELECT result_alpha.*, result_omega.${config.identifier_field} ERROR_TYPE
			FROM ? result_alpha
			LEFT JOIN ? result_omega ON result_alpha.${config.identifier_field} = result_omega.${config.identifier_field}
			AND (${join_clause})
			UNION
			SELECT result_omega.*, result_alpha.${config.identifier_field} ERROR_TYPE
			FROM ? result_omega
			LEFT JOIN ? result_alpha ON result_alpha.${config.identifier_field} = result_omega.${config.identifier_field}
			AND (${join_clause})
			`,
			[
				alasql(`SELECT * FROM ? WHERE ${config.distinct_field} IN (${distinct_values_omega})`, [result_alpha]),
				result_omega,
			]
		);
		const grouped = alasql(
			`SELECT ${config.distinct_field}, count(*) / 2 NOT_IN_SYNC
			FROM ?
			GROUP BY ${config.distinct_field}
			ORDER BY ${config.distinct_field}`,
			[result]
		);
		return { result, grouped };
	};

	private advanced_phoenix = async (config: any, knex_alpha: Knex, knex_omega: Knex) => {
		const [result_alpha, result_omega] = await Promise.all([
			this.rawQuery(knex_alpha, config.advanced_query_alpha, config.linked_name_alpha),
			this.rawQuery(knex_omega, config.advanced_query_omega, config.linked_name_omega),
		]);
		if (result_alpha && result_omega) {
			this.logger.info('- SEARCHING MISSING');
			const { result: missing, grouped: missing_grouped } = await this.findMissingItems(
				config,
				result_alpha,
				result_omega
			);
			this.logger.info(`|- FOUND: ${missing.length}`);
			this.logger.info('- SEARCHING ORPHANED');
			const { result: orphaned, grouped: orphaned_grouped } = await this.findOrphanedItems(
				config,
				result_alpha,
				result_omega
			);
			this.logger.info(`|- FOUND: ${orphaned.length}`);
			this.logger.info('- SEARCHING NOT_IN_SYNC');
			const { result: notInSync, grouped: notInSync_grouped } = await this.findNotInSyncItems(
				config,
				result_alpha,
				result_omega
			);
			this.logger.info(`|- FOUND: ${notInSync.length}`);

			const result = alasql(
				`
				SELECT
					${config.distinct_field}
					,(SELECT MISSING FROM :missing_grouped WHERE ${config.distinct_field} = d.${config.distinct_field}) MISSING
					,(SELECT ORPHANED FROM :orphaned_grouped WHERE ${config.distinct_field} = d.${config.distinct_field}) ORPHANED
					,(SELECT NOT_IN_SYNC FROM :notInSync_grouped WHERE ${config.distinct_field} = d.${config.distinct_field}) NOT_IN_SYNC
				FROM :distinct d
			`,
				{
					distinct: this.getDistinct(config, 'omega', result_omega),
					missing_grouped,
					orphaned_grouped,
					notInSync_grouped,
				}
			);
			console.table(result);
		}

		// console.log({ result_alpha, result_omega });
	};
}
