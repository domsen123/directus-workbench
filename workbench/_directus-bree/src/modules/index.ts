import { defineModule } from '@directus/extensions-sdk';
import BreeDashboard from './routes/BreeDashboard.vue';

export default defineModule({
	id: 'bree',
	name: 'Scheduler',
	icon: 'update',
	routes: [
		{
			path: '',
			component: BreeDashboard,
		},
	],
});
