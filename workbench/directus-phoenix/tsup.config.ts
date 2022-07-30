import { defineConfig } from 'tsup';

export default defineConfig({
	external: [/knex/],
});
