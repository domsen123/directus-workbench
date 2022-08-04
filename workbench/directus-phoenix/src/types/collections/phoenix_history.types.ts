export type PhoenixHistoryStatus = 'running' | 'success' | 'error';

export interface PhoenixHistoryCollection {
	uuid: string;
	date_created: string;
	date_updated: string;
	phoenix_config: string;
	system_name_alpha: string;
	system_name_omega: string;
	status: PhoenixHistoryStatus;
}
