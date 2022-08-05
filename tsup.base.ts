/* eslint-disable no-console */
import { defineConfig } from 'tsup';
import fg from 'fast-glob';
import { join, resolve } from 'path';

import rimraf from 'rimraf';

const tsupConfig: any[] = [];

const getNameAndType = (extension: string) => {
	const _e = extension.split('/workbench/')[1];
	const parts = _e.split('/');
	let extensionName = parts[0];
	const extensionType = parts[2];
	if (parts.length > 4) {
		extensionName = `${extensionName}-${parts[3]}`;
	}
	const extensionTypeSingular = extensionType.slice(0, -1);
	return { extensionName: `${extensionName}-${extensionTypeSingular}`, extensionType };
};

const cwd = process.cwd();
const distRoot = resolve(cwd, 'workbench/_dist');
const workbenchExtensionsRoot = resolve(cwd, 'workbench');
const applicationsRoot = resolve(cwd, 'app/src');
const instanceExtensionsRoot = resolve(cwd, 'workbench/_instance/extensions');

const serverExtensionsCollection = '(hooks|endpoints)';
const clientExtensionsCollection = '(displays|interfaces|layouts|modules|panels)';
const rawExtensionsCollection = '(jobs|migrations)';

const serverExtensions = await fg(join(workbenchExtensionsRoot, '/[!_]*/src/', serverExtensionsCollection, 'index.ts'));
const rawExtensions = await fg(join(workbenchExtensionsRoot, '/[!_]*/src/', rawExtensionsCollection, '*.ts'));
const clientExtensions = await fg([
	join(workbenchExtensionsRoot, '/[!_]*/src/', clientExtensionsCollection, 'index.ts'),
	join(workbenchExtensionsRoot, '/[!_]*/src/', clientExtensionsCollection, '*/index.ts'),
]);

rimraf.sync(distRoot);

let additionalConfig: undefined | Record<string, any>;

for (const extension of [...serverExtensions, ...rawExtensions]) {
	const { extensionName, extensionType } = getNameAndType(extension);

	const isMigrationOrJob = extension.includes('/jobs/') || extension.includes('/migrations/');

	// if (!additionalConfig) {
	// 	const tsupExtendPath = join(extension.split('/src/')[0], 'tsup.config.ts');
	// 	const tsupConfigExists = await fg(tsupExtendPath);
	// 	if (tsupConfigExists.length === 1) {
	// 		const importPath = tsupConfigExists[0].replace('.ts', '').replace(cwd, '.');
	// 		console.log(importPath);
	// 		const { default: cfg } = await import(importPath);
	// 		additionalConfig = cfg;
	// 	} else {
	// 		additionalConfig = {};
	// 	}
	// }

	// console.log(additionalConfig);

	tsupConfig.push(
		defineConfig({
			entry: [extension],
			outDir: join('workbench/_dist', extensionType, isMigrationOrJob ? '' : extensionName),
			splitting: false,
			clean: true,
			format: ['cjs'],
			target: 'esnext',
			legacyOutput: true,
			noExternal: [],
			minify: true,
			onSuccess: `cp -Rf ${distRoot}/* ${instanceExtensionsRoot}`,
			external: [/knex/],
		})
	);
}

export { tsupConfig, clientExtensions, getNameAndType, applicationsRoot, clientExtensionsCollection };
