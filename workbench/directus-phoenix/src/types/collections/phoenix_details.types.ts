export type PhoenixResultErrorType = 'MISSING' | 'ORPHANED' | 'NOT_IN_SYNC';

export interface PhoenixDetailsCollection {
	uuid: string;
	date_created: Date;
	history: string;
	system_name: string;
	identifier_field: string;
	identifier_field_description: string;
	distinct_field: string;
	distinct_field_description: string;
	error_type: PhoenixResultErrorType;
	data: Record<string, any> | Record<string, any>[] | string;
}
