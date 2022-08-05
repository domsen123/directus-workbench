import knex from 'knex';
import { getChunks } from '../utils';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import { v4 as uuidv4 } from 'uuid';
import {
	TBL_MISC_EXTERNAL_CONNECTIONS,
	TBL_MISC_EXTERNAL_SYSTEMS,
	TBL_MISC_SERVICE_ACCOUNTS,
	TBL_PHOENIX_CONFIG,
	TBL_PHOENIX_DETAILS,
	TBL_PHOENIX_HISTORY,
	TBL_PHOENIX_RESULTS,
} from '../constants';
import { FindItemsExtended, FindItemsOptions, PhoenixConfigAdvancedCollection } from '../types';

export class PhoenixService {
	constructor(private knex: Knex, private logger: Logger, private mailService: any) {}

	private get config() {
		return this.knex(TBL_PHOENIX_CONFIG);
	}
	private get connection() {
		return this.knex(TBL_MISC_EXTERNAL_CONNECTIONS);
	}
	private get serviceAccount() {
		return this.knex(TBL_MISC_SERVICE_ACCOUNTS);
	}
	private sleep = async (seconds: number) => new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

	private getConnection = async (uuid: string) =>
		await this.connection.select('service_account', 'host', 'port', 'driver').where('uuid', uuid).first();

	private getServiceAccount = async (uuid: string) =>
		await this.serviceAccount.select('username', 'password').where('uuid', uuid).first();

	private rawQueryString = (query: string, linked_server?: string): string => {
		return linked_server
			? `SELECT * FROM OPENQUERY(${linked_server}, '${query.trim().replaceAll("'", "''")}');`
			: query.trim();
	};

	private rawQuery = async (knex: Knex, query: string, linked_server?: string): Promise<Record<string, string>[]> => {
		const rawQuery = this.rawQueryString(query, linked_server);
		const result: Record<string, any>[] = await knex.raw(rawQuery);
		return result.map((item) =>
			Object.assign({}, ...Object.entries(item).map(([k, v]) => ({ [k.toLowerCase()]: v.toString() })))
		);
	};

	public start = async (uuid: string) => {
		this.logger.debug(`START`);
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

	private getIndexStatus = async (tableName: string): Promise<number> => {
		const { reltuples } = await this.knex
			.select('pg_class.reltuples')
			.from('pg_tables')
			.leftOuterJoin('pg_class', 'pg_tables.tablename', 'pg_class.relname')
			.where('pg_tables.tablename', tableName)
			.first();
		this.logger.debug(`Index ${tableName}: ${reltuples}`);
		return reltuples;
	};

	private createTableAndInsert = async (
		uuid: string,
		result: any[],
		systemFields: string[],
		entity: 'alpha' | 'omega'
	) => {
		const tableName = `${uuid}_${entity}`;
		const exists = await this.knex.schema.hasTable(tableName);
		if (exists) await this.knex.schema.dropTable(tableName);
		await this.knex.schema.createTable(tableName, (table) => {
			systemFields.map((field) => table.string(field).index());
			Object.keys(result[0])
				.filter((field) => !systemFields.includes(field))
				.map((v) => table.string(v));
			table.index(systemFields, `idx_${tableName}`);
		});
		for (const chunk of getChunks(result, 65000, 0)) {
			await this.knex(tableName).insert(chunk);
		}
		let indexCreated = 0;
		while (indexCreated < result.length) {
			indexCreated = await this.getIndexStatus(tableName);
			await this.sleep(2);
		}
		if (indexCreated) return Promise.resolve();
	};

	private findMissing = async ({
		system_name,
		phoenix_history,
		external_system,
		identifier_field,
		distinct_field,
		table_alpha,
		table_omega,
		trx,
	}: FindItemsOptions) => {
		const query_missing = `
			SELECT * FROM (
				SELECT alpha.*, COALESCE(omega.:identifier_field:, 'MISSING') error_type
				FROM :table_alpha: alpha
				LEFT JOIN (
					SELECT system_name, :identifier_field: FROM :table_omega:
				) omega ON alpha.:identifier_field: = omega.:identifier_field: AND omega.system_name = :system_name
				WHERE alpha.:distinct_field: IN (SELECT DISTINCT :distinct_field: FROM :table_omega: WHERE system_name = :system_name)
			) h
			WHERE h.error_type = 'MISSING';
		`;

		const { rows } = await this.knex.raw(query_missing, {
			identifier_field,
			distinct_field,
			table_alpha,
			table_omega,
			system_name,
		});

		const date_created = this.knex.fn.now();
		const inserts = rows.map((data: any) => ({
			uuid: uuidv4(),
			external_system,
			phoenix_history,
			identifier_field: data[identifier_field],
			identifier_field_description: identifier_field,
			distinct_field: data[distinct_field],
			distinct_field_description: distinct_field,
			error_type: 'MISSING',
			data,
			date_created,
		}));
		if (inserts && inserts.length > 0) {
			for (const insert of getChunks(inserts, 65000, 0)) {
				await trx(TBL_PHOENIX_DETAILS).insert(insert);
			}
		}

		return rows;
	};

	private findOrphaned = async ({
		system_name,
		external_system,
		phoenix_history,
		identifier_field,
		distinct_field,
		table_alpha,
		table_omega,
		trx,
	}: FindItemsOptions) => {
		// const stystem_name_uuid = await this.getSystemNameUuid(system_name);
		const query_orphaned = `
			SELECT * FROM (
				SELECT omega.*, COALESCE(alpha.:identifier_field:, 'ORPHANED') error_type
				FROM :table_omega: omega
				LEFT JOIN (
					SELECT :identifier_field: FROM :table_alpha:
				) alpha ON omega.:identifier_field: = alpha.:identifier_field:
				WHERE omega.:distinct_field: IN (SELECT DISTINCT :distinct_field: FROM :table_alpha:) AND omega.system_name = :system_name
			) h
			WHERE h.error_type = 'ORPHANED';
		`;

		const { rows } = await this.knex.raw(query_orphaned, {
			system_name,
			identifier_field,
			distinct_field,
			table_alpha,
			table_omega,
		});

		const date_created = this.knex.fn.now();
		const inserts = rows.map((data: any) => ({
			uuid: uuidv4(),
			external_system,
			phoenix_history,
			identifier_field: data[identifier_field],
			identifier_field_description: identifier_field,
			distinct_field: data[distinct_field],
			distinct_field_description: distinct_field,
			error_type: 'ORPHANED',
			data,
			date_created,
		}));
		if (inserts && inserts.lengt > 0) {
			for (const insert of getChunks(inserts, 65000, 0)) {
				await trx(TBL_PHOENIX_DETAILS).insert(insert);
			}
		}

		return rows;
	};

	private findNotInSync = async ({
		system_name,
		external_system,
		phoenix_history,
		identifier_field,
		distinct_field,
		table_alpha,
		table_omega,
		trx,
		additional_fields,
	}: FindItemsExtended) => {
		const query_notInSync = `
			SELECT alpha.*, 'NOT_IN_SYNC' error_type
			FROM (
				SELECT *
				FROM :table_alpha:
				WHERE :distinct_field: IN (SELECT DISTINCT :distinct_field: FROM :table_omega: WHERE system_name = :system_name)
			) alpha
			JOIN :table_omega: omega ON alpha.:identifier_field: = omega.:identifier_field: AND omega.system_name = :system_name AND (
				${additional_fields.map((f) => `alpha.${f} <> omega.${f}`).join(' OR ')}
			)
			UNION
			SELECT omega.*, 'NOT_IN_SYNC' error_type
			FROM (
				SELECT *
				FROM :table_omega:
				WHERE :distinct_field: IN (SELECT DISTINCT :distinct_field: FROM :table_alpha:) AND system_name = :system_name
			) omega
			JOIN :table_alpha: alpha ON alpha.:identifier_field: = omega.:identifier_field: AND (
				${additional_fields.map((f) => `alpha.${f} <> omega.${f}`).join(' OR ')}
			)
		`;

		const { rows: summary } = await this.knex.raw(
			`
			SELECT
				${identifier_field}
				,${distinct_field}
				,json_agg(result.*) AS "data"
			FROM (${query_notInSync}) result
			GROUP BY ${distinct_field}, ${identifier_field}
		`,
			{ system_name, identifier_field, distinct_field, table_alpha, table_omega }
		);

		const inserts = summary.map((entry: any) => ({
			uuid: uuidv4(),
			external_system,
			phoenix_history,
			identifier_field: entry[identifier_field],
			identifier_field_description: identifier_field,
			distinct_field: entry[distinct_field],
			distinct_field_description: distinct_field,
			error_type: 'NOT_IN_SYNC',
			data: JSON.stringify(entry.data),
			date_created: this.knex.fn.now(),
		}));
		if (inserts && inserts.length > 0) {
			for (const insert of getChunks(inserts, 65000, 0)) {
				await trx(TBL_PHOENIX_DETAILS).insert(insert);
			}
		}

		return summary;
	};

	private getSystemNameUuid = async (system_name: string) => {
		const exists = await this.knex(TBL_MISC_EXTERNAL_SYSTEMS).where({ system_name }).first();
		if (!exists) {
			const uuid = uuidv4();
			const now = this.knex.fn.now();
			await this.knex(TBL_MISC_EXTERNAL_SYSTEMS).insert({
				uuid,
				system_name,
				date_created: now,
				date_updated: now,
			});
			return uuid;
		}
		return exists.uuid;
	};

	private advanced_phoenix = async (config: PhoenixConfigAdvancedCollection, knex_alpha: Knex, knex_omega: Knex) => {
		const { uuid: phoenix_config } = config;
		let { identifier_field, distinct_field } = config;

		const [result_alpha, result_omega] = await Promise.all([
			this.rawQuery(knex_alpha, config.query_alpha, config.linked_name_alpha),
			this.rawQuery(knex_omega, config.query_omega, config.linked_name_omega),
		]);

		// // eslint-disable-next-line prettier/prettier
		// const result_alpha = [{ system_name: 'CODEX', wbs_id: '123', company_code: '', position_code: '', analytical_unit: '' }];
		// // eslint-disable-next-line prettier/prettier
		// const result_omega = [ { system_name: 'HCP', wbs_id: '123', company_code: '', position_code: '', analytical_unit: '' }];

		identifier_field = identifier_field.toLowerCase();
		distinct_field = distinct_field.toLowerCase();
		const systemFields = ['system_name', identifier_field, distinct_field];
		const additional_fields = await Object.keys(result_alpha[0]).filter((field) => !systemFields.includes(field));

		await Promise.all([
			this.createTableAndInsert(phoenix_config, result_alpha, systemFields, 'alpha'),
			this.createTableAndInsert(phoenix_config, result_omega, systemFields, 'omega'),
		]);

		const table_alpha = `${phoenix_config}_alpha`;
		const table_omega = `${phoenix_config}_omega`;

		const system_names = await this.knex(table_omega).distinct('system_name');
		for (const system_name of system_names.map((_) => _.system_name)) {
			const phoenix_history = uuidv4();
			const external_system = await this.getSystemNameUuid(system_name);

			const trx = await this.knex.transaction();
			try {
				await this.knex(TBL_PHOENIX_HISTORY).insert({
					uuid: phoenix_history,
					phoenix_config,
					system_name_alpha: await this.getSystemNameUuid(result_alpha[0]['system_name']),
					system_name_omega: external_system,
					status: 'running',
					date_created: this.knex.fn.now(),
					date_updated: this.knex.fn.now(),
				});

				await Promise.all([
					this.findMissing({
						system_name,
						external_system,
						phoenix_history,
						identifier_field,
						distinct_field,
						table_alpha,
						table_omega,
						trx,
					}),
					this.findOrphaned({
						system_name,
						external_system,
						phoenix_history,
						identifier_field,
						distinct_field,
						table_alpha,
						table_omega,
						trx,
					}),
					this.findNotInSync({
						system_name,
						external_system,
						phoenix_history,
						identifier_field,
						distinct_field,
						table_alpha,
						table_omega,
						additional_fields,
						trx,
					}),
				]);

				await trx.commit();

				const results = await this.knex
					.select(
						this.knex.raw(`gen_random_uuid() as uuid`),
						this.knex.raw(`'${external_system}' as external_system`),
						this.knex.raw(`'${phoenix_history}'::uuid as phoenix_history`),
						this.knex.raw(`:distinct_field: as distinct_field`, { distinct_field }),
						this.knex.raw(`'${distinct_field}' as distinct_field_description`),
						this.knex.raw(`:now: as date_created`, { now: this.knex.fn.now() }),
						'missing_count',
						'orphaned_count',
						'not_in_sync_count',
						this.knex.raw(
							`ROUND(((sum - (missing_count + not_in_sync_count)) * 100 / sum)::numeric, 2)::float as match_percent`
						)
					)
					.from(
						this.knex
							.select(
								'system_name',
								distinct_field,
								this.knex
									.select(this.knex.raw('count(*)::float'))
									.from(TBL_PHOENIX_DETAILS)
									.where('external_system', external_system)
									.andWhere('phoenix_history', phoenix_history)
									.andWhere(this.knex.raw(`"distinct_field" = base.:distinct_field:`, { distinct_field }))
									.andWhere('error_type', 'MISSING')
									.as('missing_count'),
								this.knex
									.select(this.knex.raw('count(*)::float'))
									.from(TBL_PHOENIX_DETAILS)
									.where('external_system', external_system)
									.andWhere('phoenix_history', phoenix_history)
									.andWhere(this.knex.raw(`"distinct_field" = base.:distinct_field:`, { distinct_field }))
									.andWhere('error_type', 'ORPHANED')
									.as('orphaned_count'),
								this.knex
									.select(this.knex.raw('count(*)::float'))
									.from(TBL_PHOENIX_DETAILS)
									.where('external_system', external_system)
									.andWhere('phoenix_history', phoenix_history)
									.andWhere(this.knex.raw(`"distinct_field" = base.:distinct_field:`, { distinct_field }))
									.andWhere('error_type', 'NOT_IN_SYNC')
									.as('not_in_sync_count'),
								this.knex
									.select(this.knex.raw('count(*)::float'))
									.from(table_alpha)
									.where(this.knex.raw(`:distinct_field: = base.:distinct_field:`, { distinct_field }))
									.as('sum')
							)
							.from(
								this.knex
									.select('system_name', distinct_field)
									.from(
										this.knex
											.distinct('system_name', distinct_field)
											.from(table_omega)
											.where('system_name', system_name)
											.whereIn(distinct_field, this.knex.distinct(distinct_field).from(table_alpha))
											.as('h')
									)
									.as('base')
							)
							.as('help')
					);

				await this.knex(TBL_PHOENIX_RESULTS).insert(results);

				await this.knex(TBL_PHOENIX_HISTORY).where('uuid', phoenix_history).update({
					status: 'success',
					date_updated: this.knex.fn.now(),
				});
			} catch (e: any) {
				await trx.rollback();
				await this.knex(TBL_PHOENIX_HISTORY).where('uuid', phoenix_history).update({
					status: 'error',
					date_updated: this.knex.fn.now(),
				});
				if (e.message.includes(' - ')) {
					this.logger.error(e.message.split(' - ')[1]);
				} else {
					this.logger.error(e.message);
				}
				// eslint-disable-next-line no-console
				console.error(e);
			}
		}
		await Promise.all([this.knex.schema.dropTable(table_alpha), this.knex.schema.dropTable(table_omega)]);
		this.logger.debug(`FINISHED!`);
	};
}