import type { Knex } from 'knex';
import { TBL_MISC_SERVICE_ACCOUNTS } from '../constants';
import * as utils from '../utils/directus-database';

const collection = TBL_MISC_SERVICE_ACCOUNTS;

export const up = async (knex: Knex) => {
	await utils.createCollection(knex, {
		collection,
		fields: [
			utils.defaultPrimaryField(collection),
			{ collection, field: 'title', required: true, db_options: { db_type: 'string' } },
			{ collection, field: 'username', required: true, db_options: { db_type: 'string' } },
			{
				collection,
				field: 'password',
				required: true,
				options: { masked: true },
				display: 'masked',
				db_options: { db_type: 'string' },
			},
			{
				collection,
				field: 'expires_at',
				interface: 'datetime',
				display: 'datetime',
				db_options: { db_type: 'dateTime' },
			},
			...utils.defaultAuthors(collection),
			...utils.defaultTimestamps(collection),
		],
		presets: [
			{
				collection,
				layout: 'tabular',
				layout_query: { tabular: { fields: ['title', 'username', 'password', 'expires_at'] } },
				layout_options: { tabular: { widths: {}, spacing: 'compact' } },
			},
		],
	});
};
export const down = async (knex: Knex) => {
	await utils.dropCollection(knex, collection);
};
