import type { Knex } from 'knex';
import { TBL_MISC_EXTERNAL_CONNECTIONS, TBL_PHOENIX_CONFIG } from '../constants';
import * as utils from '../utils/directus-database';

const collection = TBL_PHOENIX_CONFIG;

export const up = async (knex: Knex) => {
	await utils.createCollection(knex, {
		collection,
		fields: [
			utils.defaultPrimaryField(collection),
			{
				collection,
				field: 'advanced_mode',
				special: 'cast-boolean',
				interface: 'boolean',
				display: 'boolean',
				db_options: { db_type: 'boolean' },
			},
			{
				collection,
				field: 'identifier_field',
				required: true,
				width: 'half',
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'distinct_field',
				required: true,
				width: 'half',
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'connection_alpha',
				special: 'm2o',
				interface: 'select-dropdown-m2o',
				options: { template: '{{title}}' },
				display: 'related-values',
				display_options: { template: '{{title}}' },
				required: true,
				width: 'half',
				db_options: { db_type: 'uuid', relation: { collection: TBL_MISC_EXTERNAL_CONNECTIONS, references: 'uuid' } },
			},
			{
				collection,
				field: 'connection_omega',
				special: 'm2o',
				interface: 'select-dropdown-m2o',
				options: { template: '{{title}}' },
				display: 'related-values',
				display_options: { template: '{{title}}' },
				required: true,
				width: 'half',
				db_options: { db_type: 'uuid', relation: { collection: TBL_MISC_EXTERNAL_CONNECTIONS, references: 'uuid' } },
			},
			{
				collection,
				field: 'linked_name_alpha',
				width: 'half',
				conditions: [
					{
						name: 'IS MSSQL -> Show',
						rule: { _and: [{ connection_alpha: { driver: { _eq: 'mssql' } } }] },
						hidden: false,
						options: { font: 'sans-serif', trim: false, masked: false, clear: false, slug: false },
					},
					{
						name: 'IS NOT MSSQL -> Hide',
						rule: {
							_and: [
								{ _or: [{ connection_alpha: { driver: { _neq: 'mssql' } } }, { connection_alpha: { _null: true } }] },
							],
						},
						hidden: true,
						options: { font: 'sans-serif', trim: false, masked: false, clear: false, slug: false },
					},
				],
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'linked_name_omega',
				width: 'half',
				conditions: [
					{
						name: 'IS MSSQL -> Show',
						rule: { _and: [{ connection_omega: { driver: { _eq: 'mssql' } } }] },
						hidden: false,
						options: { font: 'sans-serif', trim: false, masked: false, clear: false, slug: false },
					},
					{
						name: 'IS NOT MSSQL -> Hide',
						rule: {
							_and: [
								{ _or: [{ connection_omega: { driver: { _neq: 'mssql' } } }, { connection_omega: { _null: true } }] },
							],
						},
						hidden: true,
						options: { font: 'sans-serif', trim: false, masked: false, clear: false, slug: false },
					},
				],
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'query_alpha',
				interface: 'input-code',
				options: { language: 'sql' },
				display: null,
				required: false,
				conditions: [
					{
						name: 'Is Advanced Mode',
						rule: { _and: [{ advanced_mode: { _eq: true } }] },
						options: { lineNumber: true, lineWrapping: false, template: null },
						hidden: false,
						required: true,
					},
					{
						name: 'Is Not Advanced Mode',
						rule: { _and: [{ advanced_mode: { _eq: null } }] },
						hidden: true,
						options: { lineNumber: true, lineWrapping: false, template: null },
					},
				],
				db_options: { db_type: 'text' },
			},
			{
				collection,
				field: 'query_omega',
				interface: 'input-code',
				options: { language: 'sql' },
				display: null,
				required: false,
				conditions: [
					{
						name: 'Is Advanced Mode',
						rule: { _and: [{ advanced_mode: { _eq: true } }] },
						options: { lineNumber: true, lineWrapping: false, template: null },
						hidden: false,
						required: true,
					},
					{
						name: 'Is Not Advanced Mode',
						rule: { _and: [{ advanced_mode: { _eq: null } }] },
						hidden: true,
						options: { lineNumber: true, lineWrapping: false, template: null },
					},
				],
				db_options: { db_type: 'text' },
			},
			...utils.defaultAuthors(collection),
			...utils.defaultTimestamps(collection),
		],
		presets: [
			{
				collection,
				layout: 'tabular',
				layout_query: {
					tabular: {
						fields: ['connection_alpha', 'connection_omega', 'identifier_field', 'distinct_field', 'advanced_mode'],
					},
				},
				layout_options: { tabular: { widths: {}, spacing: 'compact' } },
			},
		],
	});
};
export const down = async (knex: Knex) => {
	await utils.dropCollection(knex, collection);
};
