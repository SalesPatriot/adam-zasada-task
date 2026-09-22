<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { store } from '$lib/store.svelte';
	import { ArrowLeft, ArrowRight, Inbox, Loader2, Check, Send, X } from '@lucide/svelte';
	import { avatarColor, initials } from '$lib/avatar';
	import EmailCorrespondence from '$lib/components/EmailCorrespondence.svelte';
	import VendorProcessingForm from '$lib/components/VendorProcessingForm.svelte';

	let { data } = $props();

	$effect(() => store.init(data.state));

	const vendor = $derived(store.getVendor(data.vendorId));

	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	async function submit() {
		if (!vendor || submitting) return;
		submitError = null;
		submitting = true;
		try {
			await store.submitVendor(vendor.id);
		} catch (err) {
			submitError = err instanceof Error ? err.message : 'submit failed';
		} finally {
			submitting = false;
		}
	}

	function formatSubmittedAt(iso: string) {
		const d = new Date(iso);
		return (
			d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
			' · ' +
			d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
		);
	}

	onMount(() => {
		function onKey(e: KeyboardEvent) {
			const target = e.target as HTMLElement | null;
			if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
			if (e.key === 'ArrowLeft' && data.prevId) {
				e.preventDefault();
				void goto(`/quote/${data.prevId}`);
			} else if (e.key === 'ArrowRight' && data.nextId) {
				e.preventDefault();
				void goto(`/quote/${data.nextId}`);
			} else if (e.key === 'Escape') {
				void goto('/');
			}
		}
		const onUnload = () => {
			void store.flush();
		};
		window.addEventListener('keydown', onKey);
		window.addEventListener('beforeunload', onUnload);
		return () => {
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('beforeunload', onUnload);
		};
	});
</script>

<div class="flex h-screen flex-col bg-gray-50">
	<header class="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
		<div class="flex items-center justify-between gap-4 px-5 py-3">
			<div class="flex min-w-0 items-center gap-3">
				<a
					href="/"
					class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
					aria-label="Back to inbox"
				>
					<Inbox class="h-4 w-4" />
				</a>

				{#if vendor}
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ring-1 ring-inset {avatarColor(vendor.name)}"
					>
						{initials(vendor.name)}
					</div>
				{/if}

				<div class="min-w-0">
					<h1 class="truncate text-sm font-semibold tracking-tight text-gray-900">
						{vendor?.name ?? 'Unknown vendor'}
					</h1>
					<p class="text-[11px] text-gray-500">
						Quote <span class="tabular-nums">{data.position} of {data.total}</span>
						{#if vendor}
							<span class="mx-1 text-gray-300">·</span>
							<span class="font-mono text-gray-400">cage {vendor.cage}</span>
						{/if}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<div
					class="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium {store.isSaving
						? 'text-gray-500'
						: 'text-emerald-700'}"
				>
					{#if store.isSaving}
						<Loader2 class="h-3 w-3 animate-spin text-gray-400" />
						<span>Saving…</span>
					{:else}
						<Check class="h-3 w-3 text-emerald-500" strokeWidth={3} />
						<span>Saved</span>
					{/if}
				</div>

				{#if vendor?.submittedAt}
					<div
						class="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
					>
						<Check class="h-3 w-3" strokeWidth={3} />
						<span>Submitted {formatSubmittedAt(vendor.submittedAt)}</span>
					</div>
				{:else}
					<button
						type="button"
						class="inline-flex items-center gap-1.5 rounded-md border border-gray-900 bg-gray-900 px-2.5 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
						onclick={submit}
						disabled={submitting || !vendor}
					>
						{#if submitting}
							<Loader2 class="h-3.5 w-3.5 animate-spin" />
							<span>Submitting…</span>
						{:else}
							<Send class="h-3.5 w-3.5" />
							<span>Submit</span>
						{/if}
					</button>
				{/if}

				<nav class="flex items-center" aria-label="Quote navigation">
					<a
						href={data.prevId ? `/quote/${data.prevId}` : undefined}
						aria-disabled={!data.prevId}
						aria-label="Previous vendor"
						class="inline-flex h-8 w-8 items-center justify-center rounded-l-lg border border-gray-200 transition-colors {data.prevId
							? 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
							: 'pointer-events-none text-gray-300'}"
					>
						<ArrowLeft class="h-4 w-4" />
					</a>
					<a
						href={data.nextId ? `/quote/${data.nextId}` : undefined}
						aria-disabled={!data.nextId}
						aria-label="Next vendor"
						class="-ml-px inline-flex h-8 w-8 items-center justify-center rounded-r-lg border border-gray-200 transition-colors {data.nextId
							? 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
							: 'pointer-events-none text-gray-300'}"
					>
						<ArrowRight class="h-4 w-4" />
					</a>
				</nav>
			</div>
		</div>

		{#if submitError}
			<div class="border-t border-rose-200 bg-rose-50 px-5 py-2">
				<div class="flex items-center justify-between gap-3 text-xs">
					<p class="text-rose-700">
						<span class="font-semibold">Submit failed.</span>
						{submitError}
					</p>
					<button
						type="button"
						class="rounded p-0.5 text-rose-500 hover:bg-rose-100 hover:text-rose-700"
						onclick={() => (submitError = null)}
						aria-label="Dismiss"
					>
						<X class="h-3.5 w-3.5" />
					</button>
				</div>
			</div>
		{/if}
	</header>

	{#if vendor}
		<main
			class="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(0,7fr)_minmax(360px,5fr)]"
		>
			<EmailCorrespondence {vendor} />
			<VendorProcessingForm {vendor} />
		</main>
	{:else}
		<main class="flex flex-1 items-center justify-center text-sm text-gray-500">
			Vendor not found.
		</main>
	{/if}
</div>
