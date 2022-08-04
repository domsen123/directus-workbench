import type { DirectusCollection, DirectusField, DirectusPreset } from '../types/utils';
import type { Knex } from 'knex';

const parseStringOrJson = (v?: any): string | null => {
	if (!v) return null;
	else return typeof v === 'string' ? v : JSON.stringify(v);
};

const getFieldDefaults = (): Partial<DirectusField> => ({
	readonly: false,
	hidden: false,
	width: 'full',
	interface: 'input',
	display: 'raw',
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
	try {
		await knex('directus_fields').insert({
			collection: meta.collection,
			field: meta.field,
			special: meta.special,
			interface: meta.interface,
			options: parseStringOrJson(meta.options),
			display: meta.display,
			display_options: parseStringOrJson(meta.display_options),
			readonly: meta.readonly,
			hidden: meta.hidden,
			sort: meta.sort,
			width: meta.width,
			translations: parseStringOrJson(meta.translations),
			note: meta.note,
			conditions: parseStringOrJson(meta.conditions),
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
		if (!_knex.isTransaction) await knex.commit();
	} catch (e: any) {
		if (!_knex.isTransaction) await knex.rollback();
		else throw e;
	}
};

export const createPreset = async (_knex: Knex | Knex.Transaction<any, any[]>, options: DirectusPreset) => {
	const knex: Knex.Transaction<any, any[]> = _knex.isTransaction
		? (_knex as Knex.Transaction<any, any[]>)
		: await _knex.transaction();

	const defaults: Partial<DirectusPreset> = {
		layout: 'tabular',
		icon: 'bookmark_outline',
	};
	const meta: DirectusPreset = {
		...defaults,
		...options,
	};
	try {
		await knex('directus_presets').insert({
			bookmark: meta.bookmark,
			user: meta.user,
			role: meta.role,
			collection: meta.collection,
			layout_query: parseStringOrJson(meta.layout_query),
			layout_options: parseStringOrJson(meta.layout_options),
			refresh_interval: meta.refresh_interval,
			filter: meta.filter,
			icon: meta.icon,
			color: meta.color,
		});
		if (!_knex.isTransaction) await knex.commit();
	} catch (e: any) {
		if (!_knex.isTransaction) await knex.rollback();
		else throw e;
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
		if (!_knex.isTransaction) await knex.commit();
	} catch (e: any) {
		if (!_knex.isTransaction) await knex.rollback();
		else throw e;
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
			display_template: parseStringOrJson(meta.display_template),
			hidden: meta.hidden,
			singleton: meta.singleton,
			translations: parseStringOrJson(meta.translations),
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

		await Promise.all(meta.fields.map((field, index) => createField(knex, { sort: index, ...field })));
		if (meta.presets && meta.presets.length > 0) {
			await Promise.all(meta.presets.map((preset) => createPreset(knex, preset)));
		}
		if (!_knex.isTransaction) await knex.commit();
	} catch (e: any) {
		if (!_knex.isTransaction) await knex.rollback();
		else throw e;
	}
};

export const renameCollection = async (knex: Knex, old_name: string, new_name: string) => {
	await knex('directus_collections').where({ collection: old_name }).update({ collection: new_name });
	await knex('directus_fields').where({ collection: old_name }).update({ collection: new_name });
	await knex('directus_revisions').where({ collection: old_name }).update({ collection: new_name });
	await knex('directus_presets').where({ collection: old_name }).update({ collection: new_name });
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
	await knex('directus_presets').where({ collection }).delete();
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

export const defaultAuthors = (collection: string): DirectusField[] => [
	defaultCreatedBy(collection),
	defaultUpdatedBy(collection),
];
export const defaultTimestamps = (collection: string): DirectusField[] => [
	defaultCreatedAt(collection),
	defaultUpdatedAt(collection),
];
