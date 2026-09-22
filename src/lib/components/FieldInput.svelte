<script lang="ts">
	import type { FieldDef } from '$lib/fields';
	import { Check, ChevronDown } from '@lucide/svelte';

	type FieldValue = string | number | boolean | null | undefined;

	type Props = {
		def: FieldDef<any>;
		value: FieldValue;
		onChange: (value: Exclude<FieldValue, undefined>) => void;
	};

	let { def, value, onChange }: Props = $props();

	function toNumberOrNull(v: string): number | null {
		if (v.trim() === '') return null;
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	}

	const baseInput =
		'block w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
</script>

<label class="flex flex-col gap-1.5">
	<span class="text-xs font-medium text-gray-700">
		{def.header}
		{#if def.required}
			<span class="ml-0.5 text-red-500">*</span>
		{/if}
	</span>

	{#if def.type === 'text'}
		<input
			type="text"
			class={baseInput}
			value={(value as string) ?? ''}
			oninput={(e) => onChange(e.currentTarget.value)}
		/>
	{:else if def.type === 'textarea'}
		<textarea
			rows="2"
			class="{baseInput} resize-y"
			value={(value as string) ?? ''}
			oninput={(e) => onChange(e.currentTarget.value)}
		></textarea>
	{:else if def.type === 'integer' || def.type === 'float' || def.type === 'currency'}
		<div class="relative">
			{#if def.type === 'currency'}
				<span
					class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400"
				>
					$
				</span>
			{/if}
			<input
				type="number"
				step={def.type === 'integer' ? '1' : '0.01'}
				class="{baseInput} {def.type === 'currency' ? 'pl-7' : ''} tabular-nums"
				value={value === null || value === undefined ? '' : String(value)}
				oninput={(e) => onChange(toNumberOrNull(e.currentTarget.value))}
			/>
		</div>
	{:else if def.type === 'checkbox'}
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="flex h-5 w-5 items-center justify-center rounded border shadow-sm transition-colors {value ===
				true
					? 'border-blue-600 bg-blue-600 text-white'
					: 'border-gray-300 bg-white hover:border-gray-400'}"
				aria-pressed={value === true}
				onclick={() => onChange(value === true ? false : true)}
			>
				{#if value === true}
					<Check class="h-3 w-3" strokeWidth={3} />
				{/if}
			</button>
			<span class="text-xs text-gray-500">
				{value === true ? 'Yes' : value === false ? 'No' : 'Not set'}
			</span>
		</div>
	{:else if def.type === 'single_select'}
		<div class="relative">
			<select
				class="{baseInput} cursor-pointer appearance-none pr-8"
				value={(value as string) ?? ''}
				onchange={(e) => onChange(e.currentTarget.value)}
			>
				<option value="">— select —</option>
				{#each def.options ?? [] as opt (opt)}
					<option value={opt}>{opt}</option>
				{/each}
			</select>
			<ChevronDown
				class="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
			/>
		</div>
	{/if}
</label>
