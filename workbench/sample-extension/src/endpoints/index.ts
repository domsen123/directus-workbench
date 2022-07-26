import { defineEndpoint } from '@directus/extensions-sdk';

export default defineEndpoint((router) => {
	router.get('/', (_, res) => {
		res.send('sample-extension');
	});
});
