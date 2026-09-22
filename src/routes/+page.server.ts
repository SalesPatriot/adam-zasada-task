import { loadState } from '$lib/server/persistence';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const state = await loadState();
	return { state };
};
