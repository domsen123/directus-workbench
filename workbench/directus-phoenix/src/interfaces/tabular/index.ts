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
		return [
			{
				field: 'tableFields',
				name: 'Add Fields',
				meta: {
					special: 'cast-json',
					interface: 'list',
					options: {
						choices: [{ text: 'Add Fields', value: 'Add Fields' }],
						fields: [
							{
								field: 'field_name',
								name: 'field_name',
								type: 'string',
								meta: { field: 'field_name', width: 'half', type: 'string', interface: null },
							},
						],
					},
					width: 'half',
				},
			},
		];
	},
});
