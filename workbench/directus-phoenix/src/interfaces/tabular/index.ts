import { defineInterface } from '@directus/extensions-sdk';
import Component from './tabular-o2m.vue';

export default defineInterface({
	id: 'tabular-o2m',
	name: 'Tabular',
	description: 'Shows Table',
	icon: 'table',
	types: ['alias'],
	localTypes: ['o2m'],
	group: 'relational',
	relational: true,
	component: Component,
	options: ({ relations }) => {
		const collection = relations.o2m?.collection;
		return [];
	},
});
