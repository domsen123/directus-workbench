import { join } from 'path';
import fg from 'fast-glob';
import Bree from 'bree';
import Graceful from '@ladjs/graceful';
import chokidar from 'chokidar';
import { v4 as uuidv4 } from 'uuid';
import { COLLECTION_NAME } from '../constants';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { BreeJob, BreeStatus, DBBreeJob, DBBreeJobUnsaved, ServiceOptions } from '../types';

export class Service {
	private isInstalled = false;
	private bree: Bree;
	private knex: Knex;
	private logger: Logger;
	private env: Record<string, any>;
	private jobsRoot: string;

	constructor(options: ServiceOptions) {
		const { knex, logger, env, jobsRoot } = options;
		this.knex = knex;
		this.logger = logger;
		this.env = env;
		this.jobsRoot = jobsRoot;

		// Creating Bree Instance
		this.bree = new Bree({
			logger: this.logger,
			root: this.jobsRoot,
			silenceRootCheckError: true,
			jobs: [],
		});

		this.bree.on('worker created', async (name) => {
			const job = await this.getJob(name);
			if (!job) return;
			await this.dbSetStatus(job.path, 'running');
		});

		this.bree.on('worker deleted', async (name) => {
			const job = await this.getJob(name);
			if (!job) return;
			await this.dbSetStatus(job.path, 'waiting');
		});
		chokidar.watch(this.jobsRoot, { ignoreInitial: true }).on('add', async (path) => {
			await this.enable(this.pathToName(path));
		});

		// Gracefull
		const graceful = new Graceful({ brees: [this.bree] });
		graceful.listen();
	}

	/*  DATABASE STUFF START */
	// private dbDelete = async (path: string | string[]): Promise<void> => {
	// 	if (Array.isArray(path)) await this.knex<DBBreeJob>(COLLECTION_NAME).whereIn('path', path).delete();
	// 	else await this.knex<DBBreeJob>(COLLECTION_NAME).where('path', path).delete();
	// };
	// private dbList = async (): Promise<DBBreeJob[]> => {
	// 	return await this.knex<DBBreeJob>(COLLECTION_NAME).select('*');
	// };
	public dbGetItemByuuid = async (uuid: string): Promise<DBBreeJob | undefined> => {
		return await this.knex<DBBreeJob>(COLLECTION_NAME).where('uuid', uuid).first();
	};
	private dbGet = async (path: string): Promise<DBBreeJob | undefined> => {
		return await this.knex<DBBreeJob>(COLLECTION_NAME).where('path', path).first();
	};

	private dbInsert = async (job: DBBreeJobUnsaved): Promise<void> => {
		await this.knex<DBBreeJob>(COLLECTION_NAME).insert({
			...job,
			uuid: uuidv4(),
		});
	};
	private dbUpdate = async (path: string, update: Partial<DBBreeJobUnsaved>): Promise<void> => {
		await this.knex<DBBreeJob>(COLLECTION_NAME)
			.where('path', path)
			.update({ ...update, date_updated: this.knex.fn.now() });
	};
	private dbSetStatus = async (path: string, status: BreeStatus) => {
		await this.dbUpdate(path, { status });
	};

	private dbSetOrphaned = async (path: string | string[]) => {
		let query: Knex.QueryBuilder<DBBreeJob> = this.knex<DBBreeJob>(COLLECTION_NAME);
		query = Array.isArray(path) ? query.whereIn('path', path) : query.where('path', path);
		await query.update({
			orphaned: true,
			date_updated: this.knex.fn.now(),
		});
	};

	public checkHealth = async () => {
		this.logger.debug(`-== Starting Bree Health Check ==-`);
		this.logger.debug(`-- Jobs Root: ${join(this.jobsRoot)}`);
		// Check if extension is installed
		this.isInstalled = await this.knex.schema.hasTable(COLLECTION_NAME);
		if (!this.isInstalled) {
			this.logger.warn(`Bree is not installed! Bootstrap directus first!`);
			return;
		}

		// Jobs
		const existingJobs = await this.getFileJobs();
		this.logger.debug(`-- ${existingJobs.length} job files`);

		// Get orphaned Jobs
		const oprhanedJobs = await this.knex<DBBreeJob>(COLLECTION_NAME)
			.whereNotIn(
				'path',
				existingJobs.map((j) => j.path)
			)
			.select('path');
		// Set orphaned in database
		this.logger.debug(`-- ${oprhanedJobs.length} orphaned jobs`);
		if (oprhanedJobs.length > 0) await this.dbSetOrphaned(oprhanedJobs.map((j) => j.path));

		const dbJobs = await this.knex<DBBreeJob>(COLLECTION_NAME)
			.where('orphaned', false)
			.select('path', 'cron', 'name', 'status');

		const newJobs = existingJobs.filter((j) => !dbJobs.map((r) => r.path).includes(j.path));
		this.logger.debug(`-- ${newJobs.length} new jobs`);
		if (newJobs.length > 0) {
			await Promise.all(
				newJobs.map((j) =>
					this.dbInsert({
						name: j.name,
						path: j.path,
						cron: null,
						status: 'disabled',
						orphaned: false,
					})
				)
			);
		}
		const jobsToResumeWithCron = dbJobs.filter((j) => !!j.cron && j.status !== 'disabled');
		this.logger.debug(`-- ${jobsToResumeWithCron.length} resumable jobs`);
		await Promise.all(jobsToResumeWithCron.map((j) => this.enable(j.name)));
	};

	/*  DATABASE STUFF END */

	private pathToName = (path: string) => {
		return path.split('/').pop()!.replace('.js', '');
	};
	private trimPath = (path: string) => {
		return `/jobs/${path.split('/jobs/')[1]}`;
	};

	private getFileJobs = async (trimPath = false): Promise<BreeJob[]> => {
		const jobFiles = await fg(join(this.jobsRoot, '*.js'));
		return jobFiles.map((path) => ({
			name: this.pathToName(path),
			path: trimPath ? this.trimPath(path) : path,
			status: 'disabled',
			cron: null,
			timeout: 0,
			interval: 0,
		}));
	};

	private getFileJob = async (name: string, trimPath = false): Promise<BreeJob | undefined> => {
		const jobFiles = await this.getFileJobs(trimPath);
		return jobFiles.find((f) => f.name === name);
	};

	private getJob = async (name: string, trimPath = false): Promise<BreeJob | undefined> => {
		const jobFile = await this.getFileJob(name);
		if (!jobFile) return;

		const jobStored = await this.dbGet(jobFile.path);

		jobFile.cron = jobStored && jobStored.cron ? jobStored.cron : null;
		if (trimPath) jobFile.path = this.trimPath(jobFile.path);

		return jobFile;
	};

	public enable = async (name: string, cron?: string): Promise<BreeJob | undefined> => {
		const job = await this.getJob(name);
		const alreadyEnabled = this.bree.config.jobs.find((j) => j.name === name);
		if (!job || alreadyEnabled) return;
		this.logger.debug(`--| enabling job: ${name}`);
		await this.bree.add({
			name: job.name,
			path: job.path,
			cron: cron ?? job.cron ?? '',
		});
		const exists = await this.dbGet(job.path);
		if (!exists) await this.dbInsert(job);
		if (cron) await this.dbUpdate(job.path, { cron });
		await this.dbSetStatus(job.path, 'enabled');

		return this.getJob(name);
	};

	public disable = async (name: string): Promise<BreeJob | undefined> => {
		const job = await this.getJob(name);
		const isEnabled = this.bree.config.jobs.find((j) => j.name === name);
		if (!job || !isEnabled) return;
		this.logger.debug(`--| disabling job: ${name}`);

		await this.bree.remove(name);
		await this.dbSetStatus(job.path, 'disabled');

		return this.getJob(name);
	};

	public start = async (name: string): Promise<BreeJob | undefined> => {
		const job = await this.getJob(name);
		if (!job) return;
		this.logger.debug(`--| starting job: ${name}`);

		await this.bree.start(name);
		await this.dbSetStatus(job.path, 'waiting');

		return this.getJob(name);
	};

	public stop = async (name: string): Promise<BreeJob | undefined> => {
		const job = await this.getJob(name);
		if (!job) return;
		this.logger.debug(`--| stopping job: ${name}`);

		await this.bree.stop(name);
		await this.dbSetStatus(job.path, 'waiting');

		return this.getJob(name);
	};

	public run = async (name: string): Promise<BreeJob | undefined> => {
		const job = await this.getJob(name);
		if (!job) return;
		this.logger.debug(`--| running job: ${name}`);

		await this.bree.run(name);
		await this.dbSetStatus(job.path, 'running');

		return this.getJob(name);
	};

	public restart = async (name: string): Promise<BreeJob | undefined> => {
		const job = await this.getJob(name);
		if (!job) return;
		this.logger.debug(`--| restarting job: ${name}`);

		await this.bree.stop(name);
		await this.bree.start(name);
		await this.dbSetStatus(job.path, 'waiting');

		return this.getJob(name);
	};
}
