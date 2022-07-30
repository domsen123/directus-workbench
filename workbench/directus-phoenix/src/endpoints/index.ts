import { defineEndpoint } from '@directus/extensions-sdk';
import { PhoenixService } from '../services';

export default defineEndpoint({
	id: 'phoenix',
	handler: (router, { database, logger }) => {
		router.put('/:uuid', async (req, res) => {
			const uuid = req.params.uuid;
			const service = new PhoenixService(database, logger);
			const result = await service.start(uuid);
			res.json(result);
		});
	},
});
