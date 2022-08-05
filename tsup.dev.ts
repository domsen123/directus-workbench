/* eslint-disable no-console */
import {
	tsupConfig,
	clientExtensions,
	getNameAndType,
	applicationsRoot,
	clientExtensionsCollection,
} from './tsup.base';
import chalk from 'chalk';
import { existsSync, lstatSync, symlinkSync } from 'fs';
import { dirname, join } from 'path';
import rimraf from 'rimraf';
import fg from 'fast-glob';

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
