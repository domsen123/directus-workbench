import type { Knex } from 'knex';
import { TBL_MISC_EXTERNAL_SYSTEMS, TBL_PHOENIX_CONFIG, TBL_PHOENIX_DETAILS, TBL_PHOENIX_HISTORY } from '../constants';
import * as utils from '../utils/directus-database';

const collection = TBL_PHOENIX_DETAILS;

export const up = async (knex: Knex) => {
	await utils.createCollection(knex, {
		collection,
		fields: [
			utils.defaultPrimaryField(collection),
			{
				collection,
				field: 'phoenix_history',
				special: 'm2o',
				interface: 'select-dropdown-m2o',
				display: 'related-values',
				readonly: true,
				required: true,
				db_options: { db_type: 'uuid', relation: { collection: TBL_PHOENIX_HISTORY, references: 'uuid' } },
			},
			{
				collection,
				field: 'external_system',
				special: 'm2o',
				interface: 'select-dropdown-m2o',
				options: { template: '{{title}}' },
				display: 'related-values',
				display_options: { template: '{{title}}' },
				readonly: true,
				required: true,
				db_options: { db_type: 'uuid', relation: { collection: TBL_MISC_EXTERNAL_SYSTEMS, references: 'uuid' } },
			},
			{
				collection,
				field: 'identifier_field',
				readonly: true,
				required: true,
				width: 'half',
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'identifier_field_description',
				readonly: true,
				required: true,
				width: 'half',
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'distinct_field',
				readonly: true,
				required: true,
				width: 'half',
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'distinct_field_description',
				readonly: true,
				required: true,
				width: 'half',
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'error_type',
				required: true,
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'data',
				special: 'cast-json',
				interface: 'input-code',
				options: { lineNumber: false },
				required: true,
				db_options: { db_type: 'jsonb' },
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
						fields: ['external_system.system_name', 'distinct_field', 'identifier_field', 'error_type'],
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
