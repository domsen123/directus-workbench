import { defineDisplay } from '@directus/extensions-sdk';
import Masked from './Masked.vue';

export default defineDisplay({
	id: 'masked',
	name: 'Masked',
	icon: 'visibility_off',
	description: 'Maskes an input on table',
	component: Masked,
	options: null,
	types: ['string', 'integer', 'bigInteger', 'float', 'decimal', 'date', 'dateTime', 'time', 'json', 'uuid', 'hash'],
});
