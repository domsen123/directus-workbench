import type { Knex } from 'knex';
import { TBL_MISC_EXTERNAL_CONNECTIONS, TBL_MISC_SERVICE_ACCOUNTS } from '../constants';
import * as utils from '../utils/directus-database';

const collection = TBL_MISC_EXTERNAL_CONNECTIONS;

export const up = async (knex: Knex) => {
	await utils.createCollection(knex, {
		collection,
		fields: [
			utils.defaultPrimaryField(collection),
			{ collection, field: 'title', required: true, db_options: { db_type: 'string' } },
			{
				collection,
				field: 'driver',
				required: true,
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: 'Microsoft SQL Server', value: 'mssql' },
						{ text: 'My SQL', value: 'mysql' },
						{ text: 'PostgreSQL', value: 'postgres' },
					],
				},
				display: 'raw',
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'host',
				options: { placeholder: '0.0.0.0' },
				required: true,
				width: 'half',
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'port',
				required: true,
				width: 'half',
				conditions: [
					{
						name: 'MSSQL',
						rule: { _and: [{ driver: { _eq: 'mssql' } }] },
						options: { font: 'sans-serif', trim: false, masked: false, clear: false, slug: false, placeholder: '1433' },
					},
					{
						name: 'PSQL',
						rule: { _and: [{ driver: { _eq: 'postgres' } }] },
						options: { font: 'sans-serif', trim: false, masked: false, clear: false, slug: false, placeholder: '5432' },
					},
					{
						name: 'MySQL',
						rule: { _and: [{ driver: { _eq: 'mysql' } }] },
						hidden: false,
						options: { font: 'sans-serif', trim: false, masked: false, clear: false, slug: false, placeholder: '3306' },
					},
				],
				db_options: { db_type: 'integer' },
			},
			{
				collection,
				field: 'service_account',
				special: 'm2o',
				interface: 'select-dropdown-m2o',
				options: { template: '{{title}}' },
				display: 'related-values',
				display_options: { template: '{{title}}' },
				required: true,
				db_options: { db_type: 'uuid', relation: { collection: TBL_MISC_SERVICE_ACCOUNTS, references: 'uuid' } },
			},
			...utils.defaultAuthors(collection),
			...utils.defaultTimestamps(collection),
		],
		presets: [
			{
				collection,
				layout: 'tabular',
				layout_query: { tabular: { fields: ['title', 'driver', 'host', 'port', 'service_account'] } },
				layout_options: { tabular: { widths: {}, spacing: 'compact' } },
			},
		],
	});
};
export const down = async (knex: Knex) => {
	await utils.dropCollection(knex, collection);
};
