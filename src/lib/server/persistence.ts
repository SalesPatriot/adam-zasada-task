import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { AppState } from '$lib/types';
import { buildSeedState } from '$lib/seed';

const STATE_FILE = resolve(process.cwd(), 'data/state.json');

let writeQueue: Promise<void> = Promise.resolve();

function hasObsoleteResponseText(state: AppState): boolean {
	const correspondence = state.vendors.flatMap((vendor) =>
		vendor.emails.flatMap((email) => [email.body, ...email.attachments.flatMap((a) => a.pages)])
	);
	return correspondence.some((text) =>
		[
			'requested breaks',
			'quoted breaks',
			'quoted PN',
			'skipped requested',
			'| Screw, machine',
			'| Washer, flat',
			'| Nut, self-locking'
		].some((phrase) => text.includes(phrase))
	);
}

function hasResponseDescriptions(state: AppState): boolean {
	return state.vendors.some((vendor) =>
		vendor.emails.some(
			(email) =>
				email.body.includes('desc: ') || email.attachments.some((a) => a.pages.some((p) => p.includes('desc: ')))
		)
	);
}

function isCurrentSeedShape(state: AppState): boolean {
	const firstVendor = state.vendors[0];
	const firstProduct = firstVendor?.products[0];
	const firstLine = firstProduct?.lines[0];
	return (
		state.vendors.length >= 3 &&
		!!firstVendor &&
		!!firstProduct &&
		!!firstLine &&
		'paymentTerms' in firstVendor &&
		'followUpDraft' in firstVendor &&
		'packagingIncluded' in firstProduct &&
		'price' in firstLine &&
		hasResponseDescriptions(state) &&
		!hasObsoleteResponseText(state)
	);
}

export async function loadState(): Promise<AppState> {
	try {
		const raw = await readFile(STATE_FILE, 'utf8');
		const state = JSON.parse(raw) as AppState;
		if (isCurrentSeedShape(state)) return state;
		const seed = buildSeedState();
		await saveState(seed);
		return seed;
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
		const seed = buildSeedState();
		await saveState(seed);
		return seed;
	}
}

export function saveState(state: AppState): Promise<void> {
	writeQueue = writeQueue.then(async () => {
		await mkdir(dirname(STATE_FILE), { recursive: true });
		await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
	});
	return writeQueue;
}
