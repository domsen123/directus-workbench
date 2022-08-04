export interface ExternalAccountCollection {
	uuid: string;
	date_created: Date;
	date_updated: Date;
	user_created: string;
	user_updated: string;
	title: string;
	driver: 'mssql' | 'pg' | 'mysql';
	host: string;
	port: number;
	service_account: string;
}
