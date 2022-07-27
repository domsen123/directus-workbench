import { definePanel } from '@directus/extensions-sdk';
import SamplePanel from './components/SamplePanel.vue';

export default definePanel({
	id: 'sample-extension-panel',
	name: 'SampleExtensionPanel',
	icon: 'bolt',
	description: 'This is a sample panel!',
	component: SamplePanel,
	options: [
		{
			field: 'text',
			name: 'Text',
			type: 'string',
			meta: {
				interface: 'input',
				width: 'full',
			},
		},
	],
	minWidth: 12,
	minHeight: 8,
});
