import { error } from '@sveltejs/kit';
import { loadState } from '$lib/server/persistence';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const state = await loadState();
	const idx = state.vendors.findIndex((v) => v.id === params.vendorId);
	if (idx === -1) throw error(404, 'vendor not found');

	const prev = idx > 0 ? state.vendors[idx - 1].id : null;
	const next = idx < state.vendors.length - 1 ? state.vendors[idx + 1].id : null;

	return {
		state,
		vendorId: params.vendorId,
		position: idx + 1,
		total: state.vendors.length,
		prevId: prev,
		nextId: next
	};
};
