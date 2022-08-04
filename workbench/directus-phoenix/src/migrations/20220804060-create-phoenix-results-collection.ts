import type { Knex } from 'knex';
import { TBL_MISC_EXTERNAL_SYSTEMS, TBL_PHOENIX_HISTORY, TBL_PHOENIX_RESULTS } from '../constants';
import * as utils from '../utils/directus-database';

const collection = TBL_PHOENIX_RESULTS;

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
				field: 'distinct_field',
				required: true,
				width: 'half',
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'distinct_field_description',
				required: true,
				width: 'half',
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'missing_count',
				required: true,
				db_options: { db_type: 'integer' },
			},
			{
				collection,
				field: 'not_in_sync_count',
				required: true,
				db_options: { db_type: 'integer' },
			},
			{
				collection,
				field: 'orphaned_count',
				required: true,
				db_options: { db_type: 'integer' },
			},
			{
				collection,
				field: 'match_percent',
				required: true,
				display: 'formatted-value',
				display_options: {
					suffix: ' %',
					conditionalFormatting: [
						{ operator: 'lt', value: 94.99, color: '#E35169' },
						{ operator: 'gt', value: 95, color: '#FFC23B' },
						{ operator: 'eq', value: 100, color: '#2ECDA7' },
					],
				},
				db_options: { db_type: 'float' },
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
						fields: [
							'external_system.system_name',
							'distinct_field',
							'missing_count',
							'not_in_sync_count',
							'orphaned_count',
							'match_percent',
							'phoenix_history.date_updated',
						],
						sort: ['external_system.system_name'],
						page: 1,
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
