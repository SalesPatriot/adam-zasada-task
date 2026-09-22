<script lang="ts">
	import type { Line, Product, Vendor } from '$lib/types';
	import { HEADER_FIELD_DEFS, LINE_FIELD_DEFS, PRODUCT_FIELD_DEFS } from '$lib/fields';
	import { store } from '$lib/store.svelte';
	import { ClipboardList } from '@lucide/svelte';
	import FieldInput from './FieldInput.svelte';

	type StockStatus = 'in_stock' | 'low_stock';
	type PartStatus = { partNumber: string; stockStatus: StockStatus; lastQuoted: string };

	const STATUS_LABEL: Record<StockStatus, string> = {
		in_stock: 'In stock',
		low_stock: 'Low stock'
	};

	const STATUS_CLASS: Record<StockStatus, string> = {
		in_stock: 'border-emerald-200 bg-emerald-50 text-emerald-700',
		low_stock: 'border-amber-200 bg-amber-50 text-amber-700'
	};

	let { vendor }: { vendor: Vendor } = $props();

	const totalLines = $derived(vendor.products.reduce((s, p) => s + p.lines.length, 0));
	const pricedLines = $derived(
		vendor.products.reduce((s, p) => s + p.lines.filter((l) => l.price !== null).length, 0)
	);

	let partStatuses = $state<Record<string, PartStatus>>({});

	$effect(() => {
		const vendorId = vendor.id;
		const partNumbers = vendor.products.map((p) => p.partNumber);
		partStatuses = {};

		void Promise.all(
			partNumbers.map((pn) =>
				fetch(`/api/parts/${encodeURIComponent(pn)}/status`).then(
					(r) => r.json() as Promise<PartStatus>
				)
			)
		).then((results) => {
			if (vendorId !== vendor.id) return;
			const next: Record<string, PartStatus> = {};
			for (const s of results) next[s.partNumber] = s;
			partStatuses = next;
		});
	});

	function updateLine(productId: string, lineId: string, patch: Partial<Line>) {
		store.updateLine(vendor.id, productId, lineId, patch);
	}

	function updateVendor(patch: Partial<Vendor>) {
		store.updateVendor(vendor.id, patch);
	}

	function updateProduct(productId: string, patch: Partial<Product>) {
		store.updateProduct(vendor.id, productId, patch);
	}

	function scalarValue(value: unknown): string | number | boolean | null | undefined {
		return value as string | number | boolean | null | undefined;
	}
</script>

<section
	class="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
>
	<header class="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
		<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
			<ClipboardList class="h-4 w-4 text-blue-600" />
		</div>
		<div class="min-w-0 flex-1">
			<h2 class="text-sm font-semibold tracking-tight text-gray-900">Vendor processing</h2>
			<p class="mt-0.5 text-xs text-gray-500">
				{vendor.products.length} products · {totalLines} lines ·
				<span class="font-medium {pricedLines === totalLines ? 'text-emerald-600' : 'text-amber-600'}">
					{pricedLines}/{totalLines} priced
				</span>
			</p>
		</div>
	</header>

	<div class="flex-1 space-y-6 overflow-y-auto bg-gray-50/40 p-5">
		<section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
			<header class="border-b border-gray-100 bg-gray-50/60 px-4 py-3">
				<h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500">Quote header</h3>
			</header>
			<div class="grid gap-3 px-4 py-4 sm:grid-cols-2">
				{#each HEADER_FIELD_DEFS as def (def.field)}
					<div class={def.type === 'textarea' ? 'sm:col-span-2' : ''}>
						<FieldInput
							{def}
							value={scalarValue(vendor[def.field])}
							onChange={(value) =>
								updateVendor({
									[def.field]: value
								} as Partial<Vendor>)}
						/>
					</div>
				{/each}
			</div>
		</section>

		{#each vendor.products as product, productIdx (product.id)}
			{@const status = partStatuses[product.partNumber]}
			<article class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				<header class="flex items-start gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-3">
					<div
						class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white font-mono text-[11px] font-semibold text-gray-500 ring-1 ring-gray-200"
					>
						{productIdx + 1}
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-baseline justify-between gap-3">
							<div class="flex min-w-0 items-baseline gap-2">
								<h3 class="truncate font-mono text-sm font-semibold tracking-tight text-gray-900">
									{product.partNumber}
								</h3>
								{#if status}
									<span
										class="inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide {STATUS_CLASS[status.stockStatus]}"
									>
										{STATUS_LABEL[status.stockStatus]}
									</span>
								{:else}
									<span
										class="inline-block h-4 w-16 shrink-0 animate-pulse rounded-md bg-gray-200/80"
										aria-label="loading part status"
									></span>
								{/if}
							</div>
							<span class="shrink-0 font-mono text-[11px] text-gray-400">
								NSN {product.nsn}
							</span>
						</div>
						<p class="mt-0.5 truncate text-xs text-gray-500">{product.description}</p>
					</div>
				</header>

				<div class="divide-y divide-gray-100">
					<section class="px-4 py-4">
						<h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
							Product fields
						</h4>
						<div class="grid gap-3 sm:grid-cols-2">
							{#each PRODUCT_FIELD_DEFS as def (def.field)}
								<div class={def.type === 'textarea' ? 'sm:col-span-2' : ''}>
									<FieldInput
										{def}
										value={scalarValue(product[def.field])}
										onChange={(value) =>
											updateProduct(product.id, {
												[def.field]: value
											} as Partial<Product>)}
									/>
								</div>
							{/each}
						</div>
					</section>

					{#each product.lines as line, lineIdx (line.id)}
						<div class="px-4 py-5">
							<div class="mb-5 flex items-center gap-2">
								<span
									class="rounded-md bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-white"
								>
									Line {lineIdx + 1}
								</span>
								<span
									class="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-gray-700"
								>
									qty {line.quantity.toLocaleString()}
								</span>
							</div>

							<div class="space-y-3">
								{#each LINE_FIELD_DEFS as def (def.field)}
									<FieldInput
										{def}
										value={scalarValue(line[def.field])}
										onChange={(value) =>
											updateLine(product.id, line.id, {
												[def.field]: value
											} as Partial<Line>)}
									/>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</article>
		{/each}
	</div>
</section>
