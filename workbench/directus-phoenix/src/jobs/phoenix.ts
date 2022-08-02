/* eslint-disable no-console */
import { parentPort, workerData } from 'worker_threads';

(async () => {
	console.log(`PHOENIX_COMPARE`);
	const { result_alpha, result_omega } = workerData;
	// const sql = `SELECT * FROM :result_alpha WHERE COMPANY_CODE IN (SELECT DISTINCT COMPANY_CODE FROM :result_omega)`;
	console.log(`ALPHA: ${result_alpha.length}`);
	console.log(`ALPHA: ${result_omega.length}`);

	const base = result_alpha.filter((item: any) =>
		[...new Set(result_omega.map((item: any) => item.COMPANY_CODE))].includes(item.COMPANY_CODE)
	);

	console.log(`BASE: ${base.length}`);

	if (parentPort) parentPort.postMessage('done');
	else process.exit(0);
})();
