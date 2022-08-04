import type { Knex } from 'knex';

export interface FindItemsOptions {
	system_name: string;
	external_system: string;
	phoenix_history: string;
	identifier_field: string;
	distinct_field: string;
	table_alpha: string;
	table_omega: string;
	trx: Knex.Transaction;
}

export interface FindItemsExtended extends FindItemsOptions {
	additional_fields: string[];
}
