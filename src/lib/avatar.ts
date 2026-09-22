const PALETTE = [
	'bg-blue-100 text-blue-700 ring-blue-200/60',
	'bg-purple-100 text-purple-700 ring-purple-200/60',
	'bg-amber-100 text-amber-700 ring-amber-200/60',
	'bg-emerald-100 text-emerald-700 ring-emerald-200/60',
	'bg-rose-100 text-rose-700 ring-rose-200/60',
	'bg-indigo-100 text-indigo-700 ring-indigo-200/60',
	'bg-teal-100 text-teal-700 ring-teal-200/60'
] as const;

const HOVER_PALETTE = [
	'group-hover:bg-blue-200/70',
	'group-hover:bg-purple-200/70',
	'group-hover:bg-amber-200/70',
	'group-hover:bg-emerald-200/70',
	'group-hover:bg-rose-200/70',
	'group-hover:bg-indigo-200/70',
	'group-hover:bg-teal-200/70'
] as const;

function hash(seed: string): number {
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
	return Math.abs(h);
}

export function avatarColor(seed: string): string {
	return PALETTE[hash(seed) % PALETTE.length];
}

export function avatarHoverColor(seed: string): string {
	return HOVER_PALETTE[hash(seed) % HOVER_PALETTE.length];
}

export function initials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
