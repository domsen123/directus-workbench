import { defineInterface } from '@directus/extensions-sdk';
import SampleInterface from './components/SampleInterface.vue';

export default defineInterface({
	id: 'sample-extension-interface',
	name: 'SampleExtensionInterface',
	icon: 'bolt',
	description: 'This is a sample interface',
	component: SampleInterface,
	options: null,
	types: ['string'],
});
