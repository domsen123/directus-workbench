import type { Logger } from 'pino';
import { resolve, join } from 'path';
import Bree from 'bree';
import type { Knex } from 'knex';
import Graceful from '@ladjs/graceful';
import fg from 'fast-glob';
import { BreeJob } from '../types';

export class BreeService {
	private isInstalled = false;
	private root: string;
	private bree: Bree;

	constructor(private env: any, private logger: Logger, private knex: Knex) {
		this.root = resolve(this.env.EXTENSIONS_PATH, 'jobs');
		this.bree = new Bree({
			logger,
			root: this.root,
			silenceRootCheckError: true,
			doRootCheck: false,
			jobs: [],
		});
		const graceful = new Graceful({ brees: [this.bree] });
		graceful.listen();
	}

	public install = async (): Promise<void> => {
		this.isInstalled = true;
		await this.knex.migrate.latest({
			directory: resolve(this.env.EXTENSIONS_PATH, 'migrations'),
		});
	};

	public checkJobName = async (jobName: string) => {
		const jobs = await this.listJobs();
		if (!jobs.some((j) => j.name === jobName)) throw new Error('Job name does not exist');
	};

	public listJobs = async (): Promise<BreeJob[]> => {
		const jobFiles = await fg(join(this.root, '*.js'));
		const breeJobs = this.bree.config.jobs as BreeJob[];

		return jobFiles.map((jobPath) => {
			const breeJob = breeJobs.find((j) => j.path === jobPath);
			if (breeJob) {
				breeJob.status = 'done';
				if (this.bree.workers.has(breeJob.name)) breeJob.status = 'active';
				else if (this.bree.timeouts.has(breeJob.name)) breeJob.status = 'delayed';
				else if (this.bree.intervals.has(breeJob.name)) breeJob.status = 'waiting';
				return breeJob;
			} else {
				return {
					name: jobPath.split('/').pop()!.replace('.js', ''),
					path: jobPath,
					status: 'disabled',
					timeout: 0,
					interval: 0,
				} as BreeJob;
			}
		});
	};

	public getJobByName = async (jobName: string): Promise<BreeJob> => {
		return (await this.listJobs()).find((j) => j.name === jobName)!;
	};

	public enable = async (jobName: string, cron: string): Promise<BreeJob> => {
		const job = await this.getJobByName(jobName);
		await this.bree.add({
			name: jobName,
			path: job.path,
			cron,
		});
		await this.start(jobName);
		return await this.getJobByName(jobName);
	};

	public disable = async (jobName: string): Promise<BreeJob> => {
		const job = await this.getJobByName(jobName);
		if (job.status !== 'disabled') {
			await this.stop(jobName);
			await this.bree.remove(jobName);
		}
		return await this.getJobByName(jobName);
	};

	public run = async (jobName: string): Promise<BreeJob> => {
		//const job = await this.getJobByName(jobName);
		await this.bree.run(jobName);
		return await this.getJobByName(jobName);
	};

	public start = async (jobName: string): Promise<BreeJob> => {
		//const job = await this.getJobByName(jobName);
		await this.bree.start(jobName);
		return await this.getJobByName(jobName);
	};

	public stop = async (jobName: string): Promise<BreeJob> => {
		//const job = await this.getJobByName(jobName);
		await this.bree.stop(jobName);
		return await this.getJobByName(jobName);
	};

	public restart = async (jobName: string): Promise<BreeJob> => {
		//const job = await this.getJobByName(jobName);
		await this.stop(jobName);
		await this.start(jobName);
		return this.getJobByName(jobName);
	};
}
