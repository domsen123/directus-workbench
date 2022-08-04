export interface ServiceAccountCollection {
	uuid: string;
	date_created: Date;
	date_updated: Date;
	user_created: string;
	user_updated: string;
	title: string;
	username: string;
	password: string;
	expires_at?: Date;
}
