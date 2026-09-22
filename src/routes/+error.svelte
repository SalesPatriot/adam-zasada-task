<script lang="ts">
	import { page } from '$app/state';
	import { Inbox, AlertCircle } from '@lucide/svelte';
</script>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white px-6">
	<div class="w-full max-w-sm text-center">
		<div
			class="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-inset ring-red-200/60"
		>
			<AlertCircle class="h-6 w-6 text-red-600" />
		</div>
		<p
			class="mb-2 font-mono text-[11px] font-medium uppercase tracking-wider text-gray-400"
		>
			Error {page.status}
		</p>
		<h1 class="mb-2 text-xl font-semibold tracking-tight text-gray-900">
			{page.status === 404 ? 'Page not found' : 'Something went wrong'}
		</h1>
		<p class="mb-6 text-sm text-gray-500">
			{page.error?.message ?? 'The page you were looking for does not exist.'}
		</p>
		<a
			href="/"
			class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
		>
			<Inbox class="h-4 w-4 text-gray-500" />
			Back to inbox
		</a>
	</div>
</div>
