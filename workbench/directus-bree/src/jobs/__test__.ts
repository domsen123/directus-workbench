/* eslint-disable no-console */
import { parentPort, workerData } from 'worker_threads';

(async () => {
	await new Promise((resolve) => {
		console.log(`SEARCHING EXTENSIONS_PATH`);
		setTimeout(() => {
			console.log(`found: ${workerData.env.EXTENSIONS_PATH}`);
			resolve(1);
		}, 5000);
	});

	if (parentPort) parentPort.postMessage('done');
	else process.exit(0);
})();
