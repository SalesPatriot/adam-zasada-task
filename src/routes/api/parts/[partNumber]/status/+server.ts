import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const STATUSES = ['in_stock', 'low_stock'] as const;

function statusFor(partNumber: string): (typeof STATUSES)[number] {
	let h = 0;
	for (let i = 0; i < partNumber.length; i++) h = partNumber.charCodeAt(i) + ((h << 5) - h);
	return STATUSES[Math.abs(h) % STATUSES.length];
}

function lastQuotedFor(partNumber: string): string {
	let h = 0;
	for (let i = 0; i < partNumber.length; i++) h = partNumber.charCodeAt(i) + ((h << 5) - h);
	const daysAgo = (Math.abs(h) % 180) + 7;
	const d = new Date();
	d.setDate(d.getDate() - daysAgo);
	return d.toISOString();
}

export const GET: RequestHandler = async ({ params }) => {
	await new Promise((r) => setTimeout(r, 300 + Math.random() * 350));
	return json({
		partNumber: params.partNumber,
		stockStatus: statusFor(params.partNumber),
		lastQuoted: lastQuotedFor(params.partNumber)
	});
};
