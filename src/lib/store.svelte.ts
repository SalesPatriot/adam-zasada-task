import type { AppState, Line, Product, Vendor } from './types';

const SAVE_DEBOUNCE_MS = 350;

function createStore() {
	let state = $state<AppState>({ vendors: [] });
	let initialized = false;
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let savingCount = $state(0);

	async function persist() {
		savingCount += 1;
		try {
			const res = await fetch('/api/state', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(state)
			});
			if (!res.ok) throw new Error(`save failed: ${res.status}`);
		} finally {
			savingCount = Math.max(0, savingCount - 1);
		}
	}

	function scheduleSave() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			saveTimer = null;
			void persist();
		}, SAVE_DEBOUNCE_MS);
	}

	return {
		/** First call wins; subsequent calls are ignored so client edits aren't clobbered by stale server data on navigation. */
		init(initial: AppState) {
			if (initialized) return;
			state = initial;
			initialized = true;
		},
		get vendors() {
			return state.vendors;
		},
		get isSaving() {
			return savingCount > 0;
		},
		getVendor(id: string) {
			return state.vendors.find((v) => v.id === id);
		},
		updateVendor(vendorId: string, patch: Partial<Vendor>) {
			const idx = state.vendors.findIndex((v) => v.id === vendorId);
			if (idx === -1) return;
			state.vendors[idx] = { ...state.vendors[idx], ...patch };
			scheduleSave();
		},
		updateProduct(vendorId: string, productId: string, patch: Partial<Product>) {
			const vendor = state.vendors.find((v) => v.id === vendorId);
			if (!vendor) return;
			const idx = vendor.products.findIndex((p) => p.id === productId);
			if (idx === -1) return;
			vendor.products[idx] = { ...vendor.products[idx], ...patch };
			scheduleSave();
		},
		updateLine(vendorId: string, productId: string, lineId: string, patch: Partial<Line>) {
			const vendor = state.vendors.find((v) => v.id === vendorId);
			if (!vendor) return;
			const product = vendor.products.find((p) => p.id === productId);
			if (!product) return;
			const idx = product.lines.findIndex((l) => l.id === lineId);
			if (idx === -1) return;
			product.lines[idx] = { ...product.lines[idx], ...patch };
			scheduleSave();
		},
		flush() {
			if (saveTimer) {
				clearTimeout(saveTimer);
				saveTimer = null;
			}
			return persist();
		},
		async submitVendor(vendorId: string): Promise<void> {
			await this.flush();
			const res = await fetch(`/api/quote/${vendorId}/submit`, { method: 'POST' });
			if (!res.ok) {
				const body = (await res.json().catch(() => null)) as { message?: string } | null;
				throw new Error(body?.message ?? `submit failed: ${res.status}`);
			}
			const { vendor } = (await res.json()) as { vendor: { submittedAt: string } };
			const local = state.vendors.find((v) => v.id === vendorId);
			if (local) local.submittedAt = vendor.submittedAt;
		}
	};
}

export const store = createStore();
