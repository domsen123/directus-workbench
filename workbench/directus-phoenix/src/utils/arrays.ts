import { chunk } from 'lodash';

export const getChunks = <T>(insert: T[], params = 65000, additionalColumns?: number): T[][] => {
	const fieldCount = Object.keys(insert[0]).length;
	const add = additionalColumns ? additionalColumns : 6;
	const CHUNKSIZE = Math.floor(params / (fieldCount + add));

	return chunk(insert, CHUNKSIZE);
};
