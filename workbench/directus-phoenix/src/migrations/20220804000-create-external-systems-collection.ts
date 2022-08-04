import type { Knex } from 'knex';
import { TBL_MISC_EXTERNAL_SYSTEMS } from '../constants';
import * as utils from '../utils/directus-database';

const collection = TBL_MISC_EXTERNAL_SYSTEMS;

export const up = async (knex: Knex) => {
	await utils.createCollection(knex, {
		collection,
		fields: [
			utils.defaultPrimaryField(collection),
			{ collection, field: 'system_name', required: true, db_options: { db_type: 'string' } },
			...utils.defaultAuthors(collection),
			...utils.defaultTimestamps(collection),
		],
		presets: [
			{
				collection,
				layout: 'tabular',
				layout_query: { tabular: { fields: ['system_name'], sort: ['system_name'], page: 1 } },
				layout_options: { tabular: { widths: {}, spacing: 'compact' } },
			},
		],
	});
};
export const down = async (knex: Knex) => {
	await utils.dropCollection(knex, collection);
};
