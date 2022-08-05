import type { Knex } from 'knex';
import { TBL_MISC_EXTERNAL_SYSTEMS, TBL_PHOENIX_CONFIG, TBL_PHOENIX_HISTORY } from '../constants';
import * as utils from '../utils/directus-database';

const collection = TBL_PHOENIX_HISTORY;

export const up = async (knex: Knex) => {
	await utils.createCollection(knex, {
		collection,
		fields: [
			utils.defaultPrimaryField(collection),
			{
				collection,
				field: 'phoenix_config',
				special: 'm2o',
				interface: 'select-dropdown-m2o',
				options: { template: '{{connection_alpha.system_name}} vs. {{connection_omega.system_name}}' },
				display: null,
				readonly: true,
				required: true,
				db_options: { db_type: 'uuid', relation: { collection: TBL_PHOENIX_CONFIG, references: 'uuid' } },
			},
			{
				collection,
				field: 'system_name_alpha',
				special: 'm2o',
				interface: 'select-dropdown-m2o',
				options: { template: '{{system_name}}' },
				display: 'related-values',
				display_options: { template: '{{system_name}}' },
				readonly: true,
				required: true,
				width: 'half',
				db_options: { db_type: 'uuid', relation: { collection: TBL_MISC_EXTERNAL_SYSTEMS, references: 'uuid' } },
			},
			{
				collection,
				field: 'system_name_omega',
				special: 'm2o',
				interface: 'select-dropdown-m2o',
				options: { template: '{{system_name}}' },
				display: 'related-values',
				display_options: { template: '{{system_name}}' },
				readonly: true,
				required: true,
				width: 'half',
				db_options: { db_type: 'uuid', relation: { collection: TBL_MISC_EXTERNAL_SYSTEMS, references: 'uuid' } },
			},
			{ collection, field: 'status', required: true, db_options: { db_type: 'string' } },
			...utils.defaultAuthors(collection),
			...utils.defaultTimestamps(collection),
		],
		presets: [
			{
				collection,
				layout: 'tabular',
				layout_query: { tabular: { fields: ['system_name_omega.system_name', 'status', 'date_updated'] } },
				layout_options: { tabular: { widths: {}, spacing: 'compact' } },
			},
		],
	});
};
export const down = async (knex: Knex) => {
	await utils.dropCollection(knex, collection);
};
