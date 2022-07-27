import { ref } from 'vue';
import { defineLayout } from '@directus/extensions-sdk';
import SampleLayout from './components/SampleLayout.vue';

export default defineLayout({
	id: 'sample-extension-layout',
	name: 'SampleExtensionLayout',
	icon: 'bolt',

	component: SampleLayout,
	slots: {
		options: () => null,
		sidebar: () => null,
		actions: () => null,
	},
	setup() {
		const name = ref('Sample Layout');

		return { name };
	},
});
