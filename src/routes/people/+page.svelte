<script>
	import { onMount } from 'svelte';

	let people = [];
	let filteredPeople = [];
	let showForm = false;
	let editingPerson = null;
	let form = {
		firstName: '',
		lastName: '',
		email: '',
		phone: ''
	};
	
	// Pagination and filtering
	let searchTerm = '';
	let currentPage = 1;
	let itemsPerPage = 10;
	let paginatedPeople = [];
	let totalPages = 1;

	onMount(() => {
		fetchPeople();
	});

	// Reactive statements for filtering and pagination
	$: {
		if (searchTerm) {
			filteredPeople = people.filter(person => 
				`${person.firstName} ${person.lastName} ${person.email} ${person.phone || ''}`
					.toLowerCase()
					.includes(searchTerm.toLowerCase())
			);
		} else {
			filteredPeople = people;
		}
	}

	$: {
		totalPages = Math.ceil(filteredPeople.length / itemsPerPage);
		if (currentPage > totalPages && totalPages > 0) {
			currentPage = totalPages;
		}
		const startIndex = (currentPage - 1) * itemsPerPage;
		paginatedPeople = filteredPeople.slice(startIndex, startIndex + itemsPerPage);
	}

	async function fetchPeople() {
		try {
			const response = await fetch('/api/people');
			people = await response.json();
		} catch (error) {
			console.error('Failed to fetch people:', error);
		}
	}

	async function handleSubmit() {
		try {
			const url = editingPerson ? `/api/people/${editingPerson.id}` : '/api/people';
			const method = editingPerson ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(form)
			});

			if (response.ok) {
				await fetchPeople();
				resetForm();
			} else {
				const error = await response.json();
				alert(error.error);
			}
		} catch (error) {
			console.error('Failed to save person:', error);
		}
	}

	async function deletePerson(id) {
		if (confirm('Are you sure you want to delete this volunteer?')) {
			try {
				const response = await fetch(`/api/people/${id}`, {
					method: 'DELETE'
				});

				if (response.ok) {
					await fetchPeople();
				}
			} catch (error) {
				console.error('Failed to delete person:', error);
			}
		}
	}

	function editPerson(person) {
		editingPerson = person;
		form = { ...person };
		showForm = true;
	}

	function resetForm() {
		form = {
			firstName: '',
			lastName: '',
			email: '',
			phone: ''
		};
		editingPerson = null;
		showForm = false;
	}

	function changePage(page) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	function changeItemsPerPage(newSize) {
		itemsPerPage = parseInt(newSize);
		currentPage = 1;
	}

	function clearSearch() {
		searchTerm = '';
		currentPage = 1;
	}
</script>

<div class="max-w-6xl mx-auto p-6">
	<!-- Header -->
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-semibold text-gray-900">Volunteer Records</h1>
		<button 
			on:click={() => showForm = !showForm}
			class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
		>
			{showForm ? 'Cancel' : '+ Add Volunteer'}
		</button>
	</div>

	<!-- Form -->
	{#if showForm}
		<div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
			<h2 class="text-lg font-medium text-gray-900 mb-4">
				{editingPerson ? 'Edit Volunteer' : 'Add New Volunteer'}
			</h2>
			
			<form on:submit|preventDefault={handleSubmit}>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
					<input
						type="text"
						placeholder="First name"
						bind:value={form.firstName}
						required
						class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					
					<input
						type="text"
						placeholder="Last name"
						bind:value={form.lastName}
						required
						class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					
					<input
						type="email"
						placeholder="Email"
						bind:value={form.email}
						required
						class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					
					<input
						type="tel"
						placeholder="Phone (optional)"
						bind:value={form.phone}
						class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>
				
				<div class="flex gap-2">
					<button 
						type="submit"
						class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
					>
						{editingPerson ? 'Update' : 'Save'}
					</button>
					<button 
						type="button" 
						on:click={resetForm}
						class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}

	{#if people.length > 0}
		<!-- Search and Controls -->
		<div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<!-- Search -->
				<div class="flex items-center gap-2">
					<input
						type="text"
						placeholder="Search volunteers..."
						bind:value={searchTerm}
						class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
					/>
					{#if searchTerm}
						<button 
							on:click={clearSearch}
							class="text-gray-500 hover:text-gray-700 text-sm"
						>
							Clear
						</button>
					{/if}
				</div>

				<!-- Items per page -->
				<div class="flex items-center gap-2 text-sm text-gray-600">
					<span>Show:</span>
					<select 
						bind:value={itemsPerPage} 
						on:change={(e) => changeItemsPerPage(e.target.value)}
						class="px-2 py-1 border border-gray-300 rounded text-sm"
					>
						<option value="10">10</option>
						<option value="25">25</option>
						<option value="50">50</option>
						<option value="100">100</option>
					</select>
					<span>per page</span>
				</div>
			</div>

			<!-- Results info -->
			<div class="mt-2 text-sm text-gray-600">
				{#if searchTerm}
					Found {filteredPeople.length} of {people.length} volunteers
				{:else}
					Total: {people.length} volunteers
				{/if}
			</div>
		</div>

		<!-- Desktop Table -->
		<div class="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Name
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Email
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Phone
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Date Added
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each paginatedPeople as person (person.id)}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{person.firstName} {person.lastName}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{person.email}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{person.phone || '—'}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{new Date(person.createdAt).toLocaleDateString()}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
								<button 
									on:click={() => editPerson(person)}
									class="text-blue-600 hover:text-blue-900 mr-3"
								>
									Edit
								</button>
								<button 
									on:click={() => deletePerson(person.id)}
									class="text-red-600 hover:text-red-900"
								>
									Delete
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile Cards -->
		<div class="md:hidden space-y-3">
			{#each paginatedPeople as person (person.id)}
				<div class="bg-white border border-gray-200 rounded-lg p-4">
					<div class="flex justify-between items-start mb-3">
						<h3 class="font-medium text-gray-900 text-lg">
							{person.firstName} {person.lastName}
						</h3>
						<div class="flex gap-2">
							<button 
								on:click={() => editPerson(person)}
								class="text-blue-600 hover:text-blue-900 text-sm font-medium"
							>
								Edit
							</button>
							<button 
								on:click={() => deletePerson(person.id)}
								class="text-red-600 hover:text-red-900 text-sm font-medium"
							>
								Delete
							</button>
						</div>
					</div>
					
					<div class="space-y-2 text-sm">
						<div class="flex items-start">
							<span class="text-gray-500 w-16 flex-shrink-0">Email:</span>
							<span class="text-gray-900 break-all">{person.email}</span>
						</div>
						
						{#if person.phone}
							<div class="flex items-start">
								<span class="text-gray-500 w-16 flex-shrink-0">Phone:</span>
								<span class="text-gray-900">{person.phone}</span>
							</div>
						{/if}
						
						<div class="flex items-start">
							<span class="text-gray-500 w-16 flex-shrink-0">Added:</span>
							<span class="text-gray-900">{new Date(person.createdAt).toLocaleDateString()}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Empty filtered results -->
		{#if paginatedPeople.length === 0 && filteredPeople.length === 0 && searchTerm}
			<div class="bg-white border border-gray-200 rounded-lg p-12 text-center">
				<p class="text-gray-500">No volunteers found matching "{searchTerm}"</p>
				<button 
					on:click={clearSearch}
					class="mt-2 text-blue-600 hover:text-blue-800 text-sm"
				>
					Clear search
				</button>
			</div>
		{/if}

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="bg-white border border-gray-200 rounded-lg p-4 mt-4">
				<div class="flex items-center justify-between">
					<div class="text-sm text-gray-600">
						Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPeople.length)} of {filteredPeople.length}
					</div>

					<div class="flex items-center gap-2">
						<!-- Previous button -->
						<button 
							on:click={() => changePage(currentPage - 1)}
							disabled={currentPage === 1}
							class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
						>
							Previous
						</button>

						<!-- Page numbers -->
						{#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
							const start = Math.max(1, currentPage - 2);
							return start + i;
						}).filter(p => p <= totalPages) as page}
							<button 
								on:click={() => changePage(page)}
								class="px-3 py-1 text-sm border border-gray-300 rounded {page === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}"
							>
								{page}
							</button>
						{/each}

						<!-- Next button -->
						<button 
							on:click={() => changePage(currentPage + 1)}
							disabled={currentPage === totalPages}
							class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
						>
							Next
						</button>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<!-- Empty state -->
		<div class="bg-white border border-gray-200 rounded-lg p-12 text-center">
			<p class="text-gray-500 mb-4">No volunteers recorded yet.</p>
			<button 
				on:click={() => showForm = true}
				class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
			>
				Add First Volunteer
			</button>
		</div>
	{/if}
</div>