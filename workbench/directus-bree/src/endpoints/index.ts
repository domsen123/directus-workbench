import { defineEndpoint } from '@directus/extensions-sdk';
import { Service } from '../services';
import { BreeAction, BreeJob } from '../types';

export default defineEndpoint({
	id: 'bree',
	handler: (router) => {
		router.put('/jobs/:uuid', async (req, res, next) => {
			const bree: Service = req.app.get('bree');

			const uuid = req.params.uuid;

			const job = await bree.dbGetItemByuuid(uuid);
			if (!job) return res.status(404).send();

			const jobName = job.name;
			const action: BreeAction = req.body.action;
			const cron: BreeAction = req.body.cron;

			try {
				if (!['enable', 'disable', 'start', 'stop', 'restart', 'run'].includes(action)) {
					throw new Error('Invalid action! Valid actions are: enable, disable, start, stop, restart');
				}

				const handler: Record<BreeAction, (jobName: string) => Promise<BreeJob | undefined>> = {
					enable: async (jobName: string) => await bree.enable(jobName, cron),
					disable: async (jobName: string) => await bree.disable(jobName),
					start: async (jobName: string) => await bree.start(jobName),
					stop: async (jobName: string) => await bree.stop(jobName),
					restart: async (jobName: string) => await bree.restart(jobName),
					run: async (jobName: string) => await bree.run(jobName),
				};

				const result = await handler[action](jobName);
				if (!result) return res.status(500).send();

				return res.json(result);
			} catch (e: any) {
				next(e);
			}
		});
	},
});
