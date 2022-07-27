import { defineEndpoint } from '@directus/extensions-sdk';
import { BreeService } from '../services';
import { BreeAction, BreeJob } from '../types';

export default defineEndpoint({
	id: 'bree',
	handler: (router) => {
		router.get('/jobs', async (req, res) => {
			const bree: BreeService = req.app.get('bree');
			const result = await bree.listJobs();
			res.send(result);
		});

		router.get('/jobs/:jobName', async (req, res, next) => {
			const jobName = req.params.jobName;
			const bree: BreeService = req.app.get('bree');
			try {
				const result = await bree.getJobByName(jobName);
				res.json(result);
			} catch (e: any) {
				next(e);
			}
		});

		router.put('/jobs/:jobName', async (req, res, next) => {
			const bree: BreeService = req.app.get('bree');

			const jobName = req.params.jobName;
			const cron: string = req.body.cron;
			const action: BreeAction = req.body.action;

			try {
				await bree.checkJobName(jobName);
				if (!['enable', 'disable', 'start', 'stop', 'restart', 'run'].includes(action)) {
					throw new Error('Invalid action! Valid actions are: enable, disable, start, stop, restart');
				}

				const handler: Record<BreeAction, (jobName: string) => Promise<BreeJob>> = {
					enable: async (jobName: string) => await bree.enable(jobName, cron),
					disable: async (jobName: string) => await bree.disable(jobName),
					start: async (jobName: string) => await bree.start(jobName),
					stop: async (jobName: string) => await bree.stop(jobName),
					restart: async (jobName: string) => await bree.restart(jobName),
					run: async (jobName: string) => await bree.run(jobName),
				};

				const result = await handler[action](jobName);
				res.json(result);
			} catch (e: any) {
				next(e);
			}
		});
	},
});
