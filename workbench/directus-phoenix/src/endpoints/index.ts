import { defineEndpoint } from '@directus/extensions-sdk';
import { PhoenixService } from '../services';

export default defineEndpoint({
	id: 'phoenix',
	handler: (router, { database, logger, services }) => {
		const { MailService } = services;
		router.put('/:uuid', async (req, res) => {
			const uuid = req.params.uuid;
			const service = new PhoenixService(database, logger, new MailService({ schema: req.schema }));
			const result = await service.start(uuid);
			res.json(result);
		});
	},
});
