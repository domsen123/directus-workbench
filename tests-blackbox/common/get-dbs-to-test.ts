export const allVendors = ['postgres', 'sqlite3', 'mysql', 'maria', 'postgres10', 'cockroachdb', 'mssql', 'oracle'];

const vendors = process.env.TEST_DB?.split(',').map((v) => v.trim()) ?? allVendors;

if (vendors.length > 1 && process.env.TEST_LOCAL) {
	throw new Error(
		`You can't test multiple databases simultaneously when using the locally running instance of Directus.`
	);
}

for (const vendor of vendors) {
	if (allVendors.includes(vendor) === false) {
		throw new Error(`No e2e testing capabilities for vendor "${vendor}".`);
	}
}

export default vendors;
