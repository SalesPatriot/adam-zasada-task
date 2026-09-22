import { json, error } from '@sveltejs/kit';
import { loadState, saveState } from '$lib/server/persistence';
import type { AppState } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json(await loadState());
};

export const PUT: RequestHandler = async ({ request }) => {
	let body: AppState;
	try {
		body = (await request.json()) as AppState;
	} catch {
		throw error(400, 'invalid json');
	}
	if (!body || !Array.isArray(body.vendors)) throw error(400, 'invalid state shape');
	const sanitized: AppState = { vendors: body.vendors };
	await saveState(sanitized);
	return json({ ok: true });
};
