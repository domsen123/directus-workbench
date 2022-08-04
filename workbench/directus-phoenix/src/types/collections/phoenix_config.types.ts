export interface PhoenixConfigCollection {
	uuid: string;
	user_created: string;
	user_updated: string;
	date_created: string;
	date_updated: string;
	identifier_field: string;
	distinct_field: string;
	connection_alpha: string;
	connection_omega: string;
	linked_name_alpha?: string;
	linked_name_omega?: string;
}

export interface PhoenixConfigAdvancedCollection extends PhoenixConfigCollection {
	advanced_mode: true;
	query_alpha: string;
	query_omega: string;
}

export interface PhoenixConfigBasicCollection extends PhoenixConfigCollection {
	advanced_mode: false;
	database_alpha: string;
	database_omega: string;
	// TODO
}
