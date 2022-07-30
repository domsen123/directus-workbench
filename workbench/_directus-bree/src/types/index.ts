import type { Job } from 'bree/types';
import type { Knex } from 'knex';
import type { Logger } from 'pino';

export type BreeAction = 'enable' | 'disable' | 'start' | 'stop' | 'restart' | 'run';
export type BreeStatus = 'running' | 'waiting' | 'disabled' | 'enabled';
export type BreeJob = Omit<Job, 'path' | 'cron'> & {
	status: BreeStatus;
	path: string;
	cron: string | null;
};

export interface ServiceOptions {
	knex: Knex;
	logger: Logger;
	env: Record<string, any>;
	jobsRoot: string;
}

export interface DBBreeJobUnsaved {
	name: string;
	path: string;
	status?: BreeStatus;
	cron: string | null;
	orphaned?: boolean;
}

export interface DBBreeJob extends DBBreeJobUnsaved {
	uuid: string;
	date_created?: Date;
	date_updated?: Date;
}
