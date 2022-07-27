/* eslint-disable no-console */
import { defineConfig } from 'tsup';
import fg from 'fast-glob';
import { dirname, join, resolve } from 'path';
import { existsSync, lstatSync, symlinkSync } from 'fs';
import rimraf from 'rimraf';
import chalk from 'chalk';

const tsupConfig: any[] = [];

const getNameAndType = (extension: string) => {
	const _e = extension.split('/workbench/')[1];
	const extensionName = _e.split('/')[0];
	const extensionType = _e.split('/')[2];
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
const clientExtensions = await fg(join(workbenchExtensionsRoot, '/[!_]*/src/', clientExtensionsCollection, 'index.ts'));

rimraf.sync(distRoot);

for (const extension of [...serverExtensions, ...rawExtensions]) {
	const { extensionName, extensionType } = getNameAndType(extension);

	const isMigrationOrJob = extension.includes('/jobs/') || extension.includes('/migrations/');

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
		})
	);
}

// CLEANUP => DELETE ALL SYMLINKS IN APPROOT
const appExtensions = await fg(join(applicationsRoot, clientExtensionsCollection, '*/index.ts'));
for (const _l of appExtensions) {
	if (lstatSync(dirname(_l)).isSymbolicLink()) {
		const displayPath = dirname(_l).split('/').slice(-2).join('/');
		console.log(`${chalk.red('REMOVING SYMLINK:')} ${displayPath}`);
		rimraf.sync(dirname(_l));
	}
}

for (const extension of clientExtensions) {
	const { extensionName, extensionType } = getNameAndType(extension);
	const appExtensionPath = join(applicationsRoot, extensionType, extensionName);
	const exists = existsSync(appExtensionPath);
	if (!exists) {
		console.log(`${chalk.blue('ADDING SYMLINK:')} ${extensionType}/${extensionName}`);
		symlinkSync(dirname(extension), appExtensionPath);
	}
}

export default tsupConfig;
