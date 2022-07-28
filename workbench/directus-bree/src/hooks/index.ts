import { resolve } from 'path';
import { defineHook } from '@directus/extensions-sdk';
import { Service } from '../services';

export default defineHook(({ init, schedule }, { logger, env, database }) => {
	const jobsRoot = resolve(env.EXTENSIONS_PATH, 'jobs');
	const service = new Service({
		env,
		logger,
		jobsRoot,
		knex: database,
	});

	init('app.before', async ({ app }) => {
		app.set('bree', service);
		await service.checkHealth();
	});

	schedule('0 * * * *', async () => {
		await service.checkHealth();
	});
});
