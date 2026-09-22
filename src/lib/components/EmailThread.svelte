<script lang="ts">
	import type { Email } from '$lib/types';
	import { Paperclip, ChevronDown, Mail } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import { avatarColor, initials } from '$lib/avatar';
	import PdfAttachment from './PdfAttachment.svelte';

	let { emails }: { emails: Email[] } = $props();

	let openIds = $state(new Set<string>());

	$effect(() => {
		const last = emails[emails.length - 1];
		openIds = new Set(last ? [last.id] : []);
	});

	function toggle(id: string) {
		const next = new Set(openIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		openIds = next;
	}

	function shortDate(iso: string) {
		const d = new Date(iso);
		return (
			d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
			' · ' +
			d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
		);
	}

	function teaser(body: string) {
		return body.replace(/\s+/g, ' ').trim().slice(0, 120);
	}
</script>

<ol class="divide-y divide-gray-100">
	{#each emails as email (email.id)}
		{@const open = openIds.has(email.id)}
		<li>
			<button
				type="button"
				class="group flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50/80"
				onclick={() => toggle(email.id)}
			>
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ring-1 ring-inset {avatarColor(email.fromName)}"
				>
					{initials(email.fromName)}
				</div>

				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between gap-2">
						<span class="truncate text-sm font-semibold text-gray-900">{email.fromName}</span>
						<span class="shrink-0 tabular-nums text-[11px] text-gray-400">
							{shortDate(email.date)}
						</span>
					</div>
					<p class="mt-0.5 truncate text-xs font-medium text-gray-700">{email.subject}</p>
					{#if !open}
						<p class="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">
							{teaser(email.body)}
						</p>
					{/if}
					{#if email.attachments.length}
						<div
							class="mt-2 inline-flex items-center gap-1 rounded border border-blue-200/60 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700"
						>
							<Paperclip class="h-3 w-3" />
							{email.attachments.length} attachment{email.attachments.length === 1 ? '' : 's'}
						</div>
					{/if}
				</div>

				<ChevronDown
					class="mt-1 h-4 w-4 shrink-0 text-gray-300 transition-transform duration-200 {open
						? 'rotate-180 text-gray-500'
						: 'group-hover:text-gray-500'}"
				/>
			</button>

			{#if open}
				<div
					transition:slide={{ duration: 180 }}
					class="border-t border-gray-100 bg-gray-50/60 px-5 py-4"
				>
					<dl class="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
						<dt class="text-gray-400">From</dt>
						<dd class="font-mono text-gray-700">{email.from}</dd>
						<dt class="text-gray-400">To</dt>
						<dd class="font-mono text-gray-700">{email.to}</dd>
						<dt class="text-gray-400">Date</dt>
						<dd class="text-gray-700">{shortDate(email.date)}</dd>
					</dl>

					<pre
						class="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-gray-800">{email.body}</pre>

					{#if email.attachments.length}
						<div class="mt-4 space-y-3">
							{#each email.attachments as attachment (attachment.id)}
								<PdfAttachment {attachment} />
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</li>
	{:else}
		<li class="flex flex-col items-center justify-center px-5 py-12 text-center">
			<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
				<Mail class="h-5 w-5 text-gray-400" />
			</div>
			<p class="text-sm font-medium text-gray-700">No messages yet</p>
		</li>
	{/each}
</ol>
