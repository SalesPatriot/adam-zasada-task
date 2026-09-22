import { json, error } from '@sveltejs/kit';
import { loadState, saveState } from '$lib/server/persistence';
import { HEADER_FIELD_DEFS, LINE_FIELD_DEFS, PRODUCT_FIELD_DEFS } from '$lib/fields';
import type { Vendor } from '$lib/types';
import type { RequestHandler } from './$types';

function countMissingRequired(vendor: Vendor): number {
	let count = 0;
	for (const field of HEADER_FIELD_DEFS.filter((f) => f.required).map((f) => f.field)) {
		const value = vendor[field];
		if (value === null || value === '' || value === undefined) count++;
	}
	for (const product of vendor.products) {
		for (const field of PRODUCT_FIELD_DEFS.filter((f) => f.required).map((f) => f.field)) {
			const value = product[field];
			if (value === null || value === '' || value === undefined) count++;
		}
		for (const line of product.lines) {
			for (const field of LINE_FIELD_DEFS.filter((f) => f.required).map((f) => f.field)) {
				const value = line[field];
				if (value === null || value === '' || value === undefined) count++;
			}
		}
	}
	return count;
}

export const POST: RequestHandler = async ({ params }) => {
	await new Promise((r) => setTimeout(r, 400));

	const state = await loadState();
	const vendor = state.vendors.find((v) => v.id === params.vendorId);
	if (!vendor) throw error(404, 'vendor not found');

	const missing = countMissingRequired(vendor);
	if (missing > 0) throw error(400, `${missing} required fields are missing`);

	vendor.submittedAt = new Date().toISOString();
	await saveState(state);

	return json({ vendor });
};
