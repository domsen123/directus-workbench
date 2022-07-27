import { defineHook } from '@directus/extensions-sdk';
import { BreeService } from '../services';

export default defineHook(({ init }, { logger, env, database }) => {
	init('app.before', async ({ app }) => {
		const bree = new BreeService(env, logger, database);
		await bree.install();
		app.set('bree', bree);
	});
});
