<script lang="ts">
	import type { Vendor } from '$lib/types';
	import { Mail, Send } from '@lucide/svelte';
	import { store } from '$lib/store.svelte';
	import EmailThread from './EmailThread.svelte';

	let { vendor }: { vendor: Vendor } = $props();

	function updateDraft(value: string) {
		store.updateVendor(vendor.id, { followUpDraft: value });
	}
</script>

<section
	class="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
>
	<header class="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
		<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
			<Mail class="h-4 w-4 text-blue-600" />
		</div>
		<div class="min-w-0 flex-1">
			<div class="flex items-baseline justify-between gap-2">
				<h2 class="truncate text-sm font-semibold tracking-tight text-gray-900">
					Correspondence
				</h2>
				<span class="shrink-0 font-mono text-[11px] text-gray-400">
					{vendor.emails.length} message{vendor.emails.length === 1 ? '' : 's'}
				</span>
			</div>
			<p class="truncate text-xs text-gray-500">
				{vendor.contactName} ·
				<span class="font-mono text-gray-400">{vendor.contactEmail}</span>
			</p>
		</div>
	</header>

	<div class="min-h-0 flex-1 overflow-y-auto">
		<EmailThread emails={vendor.emails} />
	</div>

	<div class="border-t border-gray-100 bg-gray-50/80 p-4">
		<div class="mb-2 flex items-center justify-between gap-3">
			<div class="flex min-w-0 items-center gap-2">
				<Send class="h-3.5 w-3.5 shrink-0 text-gray-400" />
				<h3 class="truncate text-xs font-semibold uppercase tracking-wide text-gray-500">
					Reply draft
				</h3>
			</div>
			<span class="shrink-0 text-[11px] text-gray-400">not sent</span>
		</div>
		<textarea
			rows="7"
			class="block w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 font-sans text-[13px] leading-relaxed text-gray-800 shadow-sm transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
			value={vendor.followUpDraft}
			oninput={(e) => updateDraft(e.currentTarget.value)}
		></textarea>
		<div class="mt-2 flex justify-end">
			<button
				type="button"
				class="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-400"
				disabled
			>
				<Send class="h-3.5 w-3.5" />
				<span>Send</span>
			</button>
		</div>
	</div>
</section>
