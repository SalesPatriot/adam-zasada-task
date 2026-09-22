<script lang="ts">
	import { store } from '$lib/store.svelte';
	import type { Vendor } from '$lib/types';
	import { Inbox, ChevronRight, Mail, FileText, Check } from '@lucide/svelte';
	import { avatarColor, avatarHoverColor, initials } from '$lib/avatar';

	let { data } = $props();

	$effect(() => store.init(data.state));

	const vendors = $derived(store.vendors);

	function lineCounts(vendor: Vendor) {
		const lines = vendor.products.flatMap((p) => p.lines);
		const priced = lines.filter((l) => l.price !== null).length;
		return { priced, total: lines.length };
	}

	function lastEmail(vendor: Vendor) {
		return vendor.emails[vendor.emails.length - 1];
	}

	function shortDate(iso: string) {
		const d = new Date(iso);
		return (
			d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
			' · ' +
			d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
		);
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
	<div class="mx-auto max-w-4xl px-6 pb-16 pt-12">
		<header class="mb-10">
			<div class="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
				<span class="font-mono">RFQ-5247</span>
				<span class="text-gray-300">/</span>
				<span>Vendor responses</span>
			</div>
			<div class="flex items-start gap-4">
				<div
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-inset ring-blue-100"
				>
					<Inbox class="h-5 w-5 text-blue-600" />
				</div>
				<div class="flex-1">
					<h1 class="text-2xl font-semibold tracking-tight text-gray-900">Quote Inbox</h1>
					<p class="mt-1 text-sm text-gray-500">
						{vendors.length} vendor responses awaiting processing · due May 20
					</p>
				</div>
			</div>
		</header>

		<ul class="space-y-3">
			{#each vendors as vendor (vendor.id)}
				{@const counts = lineCounts(vendor)}
				{@const email = lastEmail(vendor)}
				{@const complete = counts.priced === counts.total}
				{@const avatarBase = avatarColor(vendor.name)}
				{@const avatarHover = avatarHoverColor(vendor.name)}
				<li>
					<a
						href="/quote/{vendor.id}"
						class="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md"
					>
						<div class="flex items-start gap-4 px-5 py-4">
							<div
								class="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-semibold tracking-tight ring-1 ring-inset transition-colors {avatarBase} {avatarHover}"
							>
								{initials(vendor.name)}
							</div>

							<div class="min-w-0 flex-1">
								<div class="flex items-baseline justify-between gap-3">
									<div class="min-w-0">
										<h2 class="truncate text-sm font-semibold tracking-tight text-gray-900">
											{vendor.name}
										</h2>
										<p class="truncate text-xs text-gray-500">
											{vendor.contactName} ·
											<span class="font-mono text-gray-400">cage {vendor.cage}</span>
										</p>
									</div>
									<span class="shrink-0 tabular-nums text-[11px] text-gray-400">
										{shortDate(email.date)}
									</span>
								</div>

								<p
									class="mt-2.5 flex items-center gap-2 truncate text-sm text-gray-700"
								>
									<Mail class="h-3.5 w-3.5 shrink-0 text-gray-400" />
									<span class="truncate">{email.subject}</span>
								</p>

								<div class="mt-3 flex flex-wrap items-center gap-1.5">
									<span
										class="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700"
									>
										{vendor.products.length} products
										<span class="text-gray-300">·</span>
										{counts.total} lines
									</span>

									<span
										class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold {complete
											? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
											: 'border border-amber-200 bg-amber-50 text-amber-700'}"
									>
										{counts.priced}/{counts.total} priced
									</span>

									{#if email.attachments.length}
										<span
											class="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
										>
											<FileText class="h-3 w-3" />
											{email.attachments.length}
											{email.attachments.length === 1 ? 'attachment' : 'attachments'}
										</span>
									{/if}

									{#if vendor.submittedAt}
										<span
											class="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
										>
											<Check class="h-3 w-3" strokeWidth={3} />
											Submitted
										</span>
									{/if}
								</div>
							</div>

							<ChevronRight
								class="mt-3 h-4 w-4 shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gray-600"
							/>
						</div>
					</a>
				</li>
			{/each}
		</ul>

		<footer class="mt-8 flex items-center justify-between text-[11px] text-gray-400">
			<p>
				State persists to <span class="font-mono text-gray-500">data/state.json</span> on every edit.
			</p>
			<div class="flex items-center gap-1.5">
				<kbd
					class="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gray-500 shadow-sm"
					>←</kbd
				>
				<kbd
					class="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gray-500 shadow-sm"
					>→</kbd
				>
				<span class="ml-1">switch</span>
				<span class="mx-1.5 text-gray-300">·</span>
				<kbd
					class="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gray-500 shadow-sm"
					>Esc</kbd
				>
				<span class="ml-1">back</span>
			</div>
		</footer>
	</div>
</div>
