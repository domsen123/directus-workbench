import type { Knex } from 'knex';

const collection = 'bree_jobs';
export const up = async (knex: Knex) => {
	await knex.schema.createTable(collection, (table) => {
		table.uuid('uuid').notNullable();
		table.string('name').notNullable();
		table.string('path').notNullable();
		table.string('status');
		table.string('cron');
		table.boolean('orphaned').defaultTo(false);
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.timestamp('date_updated').defaultTo(knex.fn.now());
	});
	await knex('directus_collections').insert({
		collection,
		hidden: true,
		singleton: false,
		archive_app_filter: 0,
		accountability: null,
		collapse: 'closed',
	});
	await knex('directus_fields').insert([
		{
			collection,
			field: 'uuid',
			special: 'uuid',
			interface: 'input',
			readonly: true,
			hidden: true,
			width: 'full',
			required: false,
		},
		{
			collection,
			field: 'name',
			interface: 'input',
			display: 'raw',
			width: 'full',
			hidden: false,
			required: true,
			readonly: false,
		},
		{
			collection,
			field: 'path',
			interface: 'input',
			display: 'raw',
			width: 'full',
			hidden: false,
			required: true,
			readonly: false,
		},
		{
			collection,
			field: 'status',
			interface: 'input',
			display: 'raw',
			width: 'half',
			hidden: false,
			readonly: true,
		},
		{
			collection,
			field: 'orphaned',
			special: 'cast-boolean',
			interface: 'boolean',
			display: 'boolean',
			width: 'half',
			hidden: false,
			readonly: true,
		},
		{
			collection,
			field: 'date_created',
			special: 'date-created',
			interface: 'datetime',
			display: 'datetime',
			display_options: JSON.stringify({ relative: true }),
			width: 'half',
			hidden: true,
			readonly: true,
			required: false,
		},
		{
			collection,
			field: 'date_updated',
			special: 'date-updated',
			interface: 'datetime',
			display: 'datetime',
			display_options: JSON.stringify({ relative: true }),
			width: 'half',
			hidden: true,
			readonly: true,
			required: false,
		},
	]);
};

export const down = async (knex: Knex) => {
	await knex.schema.dropTable(collection);
	await knex('directus_collections').where('collection', collection).delete();
	await knex('directus_fields').where('collection', collection).delete();
};
