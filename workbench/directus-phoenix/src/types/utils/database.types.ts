type DB_TYPE =
	| 'integer'
	| 'tinyint'
	| 'smallint'
	| 'mediumint'
	| 'bigint'
	| 'bigInteger'
	| 'string'
	| 'float'
	| 'double'
	| 'boolean'
	| 'date'
	| 'dateTime'
	| 'time'
	| 'timestamp'
	| 'json'
	| 'uuid'
	| 'decimal';

export interface DirectusFieldRelation {
	references: string;
	collection: string;
	onUpdate?: 'CASCADE' | 'SET NULL' | 'NO ACTION';
	onDelete?: 'CASCADE' | 'SET NULL' | 'NO ACTION';
}

export interface DirectusFieldDatabaseOptions {
	db_type: DB_TYPE;
	primary?: boolean;
	indexed?: boolean;
	options?: any;
	relation?: DirectusFieldRelation;
	default_value?: string | 'current_timestamp';
}
export interface DirectusField {
	collection: string;
	field: string;
	special?: string;
	interface?: string;
	options?: string;
	display?: string;
	display_options?: string;
	readonly?: boolean;
	hidden?: boolean;
	sort?: number;
	width?: 'half' | 'full';
	//translations?: any;
	note?: string;
	conditions?: string;
	required?: boolean;
	db_options: DirectusFieldDatabaseOptions;
	// group?: any;
	// validation?: any;
	// validation_message?: any;
}

export interface DirectusCollection {
	collection: string;
	icon?: string;
	note?: string;
	//display_template?: any;
	hidden?: boolean;
	singleton?: boolean;
	//translations?: any;
	archive_field?: string;
	archive_app_filter?: boolean;
	archive_value?: string;
	unarchive_value?: string;
	sort_field?: string;
	accountability?: null | 'all' | 'activity';
	color?: string;
	//item_duplication_fields?: any;
	sort?: number;
	group?: string;
	collapse?: 'open' | 'closed' | 'locked';
	fields: DirectusField[];
}
