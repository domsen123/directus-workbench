import type { DirectusCollection, DirectusField } from '../types/utils';
import type { Knex } from 'knex';

const getFieldDefaults = (): Partial<DirectusField> => ({
	readonly: false,
	hidden: false,
	width: 'full',
	required: false,
});

const createDatabaseField = (knex: Knex, table: Knex.TableBuilder, item: DirectusField) => {
	const { field: name, required } = item;
	const { db_type, indexed, primary, options, relation, default_value } = item.db_options;
	// @ts-ignore ...
	const db_field = options ? table[db_type](name, options) : table[db_type](name);
	if (primary) db_field.primary();
	if (indexed) db_field.index();
	if (default_value) db_field.defaultTo(default_value === 'current_timestamp' ? knex.fn.now() : default_value);
	if (required) db_field.notNullable();

	if (relation)
		db_field
			.references(relation.references)
			.inTable(relation.collection)
			.onUpdate(relation.onUpdate ?? 'NO ACTION')
			.onDelete(relation.onDelete ?? 'SET NULL');

	return db_field;
};

const createField = async (_knex: Knex | Knex.Transaction<any, any[]>, options: DirectusField) => {
	const knex: Knex.Transaction<any, any[]> = _knex.isTransaction
		? (_knex as Knex.Transaction<any, any[]>)
		: await _knex.transaction();

	const meta: DirectusField = {
		...getFieldDefaults(),
		...options,
	};
	await knex('directus_fields').insert({
		collection: meta.collection,
		field: meta.field,
		special: meta.special,
		interface: meta.interface,
		//options: meta.options,
		display: meta.display,
		//display_options: meta.display_options,
		readonly: meta.readonly,
		hidden: meta.hidden,
		sort: meta.sort,
		width: meta.width,
		//translations: meta.translations,
		note: meta.note,
		conditions: meta.conditions,
		required: meta.required,
		// group: meta.group,
		// validation: meta.validation,
		// validation_message: meta.validation_message,
	});

	if (meta.db_options?.relation) {
		await knex('directus_relations').insert({
			many_collection: meta.collection,
			many_field: meta.field,
			one_collection: meta.db_options.relation.collection,
			one_deselect_action: 'nullify',
		});
	}
};

export const addField = async (_knex: Knex | Knex.Transaction<any, any[]>, options: DirectusField) => {
	const { collection } = options;
	const knex: Knex.Transaction<any, any[]> = _knex.isTransaction
		? (_knex as Knex.Transaction<any, any[]>)
		: await _knex.transaction();
	try {
		await createField(knex, options);

		await knex.schema.alterTable(collection, (table) => {
			createDatabaseField(knex, table, options);
		});
		await knex.commit();
	} catch (e: any) {
		await knex.rollback();
	}
};

export const createCollection = async (_knex: Knex | Knex.Transaction<any, any[]>, options: DirectusCollection) => {
	const knex: Knex.Transaction<any, any[]> = _knex.isTransaction
		? (_knex as Knex.Transaction<any, any[]>)
		: await _knex.transaction();

	const defaults: Partial<DirectusCollection> = {
		hidden: false,
		singleton: false,
		accountability: null,
		collapse: 'open',
	};
	const meta: DirectusCollection = {
		...defaults,
		...options,
	};

	try {
		await knex.schema.createTable(meta.collection, (table) => {
			meta.fields.map((item) => createDatabaseField(knex, table, item));
		});

		await knex('directus_collections').insert({
			collection: meta.collection,
			icon: meta.icon,
			note: meta.note,
			// display_template: meta.display_template,
			hidden: meta.hidden,
			singleton: meta.singleton,
			// translations?: meta.translations,
			archive_field: meta.archive_field,
			archive_app_filter: meta.archive_app_filter,
			archive_value: meta.archive_value,
			unarchive_value: meta.unarchive_value,
			sort_field: meta.sort_field,
			accountability: meta.accountability,
			color: meta.color,
			// item_duplication_fields: meta.item_duplication_fields,
			sort: meta.sort,
			group: meta.group,
			collapse: meta.collapse,
		});

		await Promise.all(meta.fields.map((field) => createField(knex, field)));
		await knex.commit();
	} catch (e) {
		await knex.rollback();
		throw e;
	}
};

export const renameCollection = async (knex: Knex, old_name: string, new_name: string) => {
	await knex('directus_collections').where({ collection: old_name }).update({ collection: new_name });
	await knex('directus_fields').where({ collection: old_name }).update({ collection: new_name });
	await knex('directus_revisions').where({ collection: old_name }).update({ collection: new_name });
	await knex('directus_relations').where({ many_collection: old_name }).update({ many_collection: new_name });
	await knex('directus_relations').where({ one_collection: old_name }).update({ one_collection: new_name });
	await knex('directus_activity').where({ collection: old_name }).update({ collection: new_name });

	const exists = await knex.schema.hasTable(old_name);
	if (exists) await knex.schema.renameTable(old_name, new_name);
};

export const dropCollection = async (knex: Knex, collection: string) => {
	await knex('directus_collections').where({ collection }).delete();
	await knex('directus_fields').where({ collection }).delete();
	await knex('directus_revisions').where({ collection }).delete();
	await knex('directus_relations').where({ many_collection: collection }).delete();
	await knex('directus_relations').where({ one_collection: collection }).delete();
	await knex('directus_activity').where({ collection }).delete();

	const exists = await knex.schema.hasTable(collection);
	if (exists) await knex.schema.dropTable(collection);
};

export const defaultPrimaryField = (collection: string): DirectusField => ({
	collection,
	field: 'uuid',
	special: 'uuid',
	interface: 'input',
	readonly: true,
	hidden: true,
	sort: 1,
	width: 'full',
	required: false,
	db_options: {
		db_type: 'uuid',
		primary: true,
	},
});
export const defaultUpdatedAt = (collection: string): DirectusField => ({
	collection,
	field: 'date_updated',
	special: 'cast-timestamp,date-updated',
	interface: 'datetime',
	display: 'datetime',
	display_options: JSON.stringify({ relative: true }),
	readonly: true,
	hidden: true,
	width: 'half',
	required: false,
	db_options: {
		db_type: 'timestamp',
		default_value: 'current_timestamp',
	},
});
export const defaultCreatedAt = (collection: string): DirectusField => ({
	collection,
	field: 'date_created',
	special: 'cast-timestamp,date-created',
	interface: 'datetime',
	display: 'datetime',
	display_options: JSON.stringify({ relative: true }),
	readonly: true,
	hidden: true,
	width: 'half',
	required: false,
	db_options: {
		db_type: 'timestamp',
		default_value: 'current_timestamp',
	},
});
export const defaultCreatedBy = (collection: string): DirectusField => ({
	collection,
	field: 'user_created',
	special: 'user-created',
	interface: 'select-dropdown-m2o',
	options: JSON.stringify({ template: '{{avatar.$thumbnail}} {{first_name}} {{last_name}}' }),
	display: 'user',
	readonly: true,
	hidden: true,
	width: 'half',
	required: false,
	db_options: {
		db_type: 'uuid',
		relation: {
			references: 'id',
			collection: 'directus_users',
			onUpdate: 'NO ACTION',
			onDelete: 'SET NULL',
		},
	},
});
export const defaultUpdatedBy = (collection: string): DirectusField => ({
	collection,
	field: 'user_updated',
	special: 'user-created',
	interface: 'select-dropdown-m2o',
	options: JSON.stringify({ template: '{{avatar.$thumbnail}} {{first_name}} {{last_name}}' }),
	display: 'user',
	readonly: true,
	hidden: true,
	width: 'half',
	required: false,
	db_options: {
		db_type: 'uuid',
		relation: {
			references: 'id',
			collection: 'directus_users',
			onUpdate: 'NO ACTION',
			onDelete: 'SET NULL',
		},
	},
});
