import type { Knex } from 'knex';
import * as utils from '../utils/directus-database';

const collection = 'test_collection_3';

export const up = async (knex: Knex) => {
	await utils.createCollection(knex, {
		collection,
		fields: [
			utils.defaultPrimaryField(collection),
			{ collection, field: 'title', interface: 'input', display: 'raw', db_options: { db_type: 'string' } },
			utils.defaultCreatedBy(collection),
			utils.defaultUpdatedBy(collection),
			utils.defaultCreatedAt(collection),
			utils.defaultUpdatedAt(collection),
		],
	});
};
export const down = async (knex: Knex) => {
	await utils.dropCollection(knex, collection);
};
