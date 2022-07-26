import { defineHook } from '@directus/extensions-sdk';

export default defineHook(({ init }, { logger }) => {
	init('app.after', () => {
		logger.info(`Hello from sample-extension!`);
	});
});
