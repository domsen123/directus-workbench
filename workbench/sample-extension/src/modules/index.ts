import { defineModule } from '@directus/extensions-sdk';
import SampleExtension from './routes/SampleExtension.vue';

export default defineModule({
	id: 'sample-extension-module',
	name: 'SampleExtensionModule',
	icon: 'bolt',
	routes: [
		{
			path: '',
			component: SampleExtension,
		},
	],
});
