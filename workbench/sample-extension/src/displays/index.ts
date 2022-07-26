import { defineDisplay } from '@directus/extensions-sdk';
import SampleDisplay from './components/SampleDisplay.vue';

export default defineDisplay({
	id: 'sample-extension-display',
	name: 'SampleExtensionDisplay',
	icon: 'bolt',
	description: 'This is a sample display',
	component: SampleDisplay,
	options: null,
	types: ['string'],
});
