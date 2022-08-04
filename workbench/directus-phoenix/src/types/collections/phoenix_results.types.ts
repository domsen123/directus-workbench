export interface PhoenixResultsCollection {
	uuid: string;
	date_created: string;
	history: string;
	system_name: string;
	distinct_field: string;
	distinct_field_description: string;
	missing_count: number;
	orphaned_count: number;
	not_in_sync_count: number;
	match_percent: number;
}
