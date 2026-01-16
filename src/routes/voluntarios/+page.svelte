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
		phone: '',
		isActive: true,
		inactiveDate: null
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

	// Reactive statement for filtering and sorting
	$: {
		if (searchTerm) {
			filteredPeople = people.filter(person =>
				`${person.firstName} ${person.lastName} ${person.email} ${person.phone || ''}`
					.toLowerCase()
					.includes(searchTerm.toLowerCase())
			);
		} else {
			filteredPeople = [...people];
		}

		// Sort: Active volunteers first, then inactive
		// Within each group, sort by creation date (newest first)
		filteredPeople.sort((a, b) => {
			// First sort by active status (active first)
			if (a.isActive && !b.isActive) return -1;
			if (!a.isActive && b.isActive) return 1;

			// Then sort by creation date (newest first within each group)
			return new Date(b.createdAt) - new Date(a.createdAt);
		});
	}

	// Reactive statements for pagination
	$: {
		totalPages = Math.ceil(filteredPeople.length / itemsPerPage);
		if (currentPage > totalPages && totalPages > 0) {
			currentPage = totalPages;
		}
		const startIndex = (currentPage - 1) * itemsPerPage;
		paginatedPeople = filteredPeople.slice(startIndex, startIndex + itemsPerPage);
	}

	// Computed values for display
	$: activePeople = people.filter(person => person.isActive);
	$: inactivePeople = people.filter(person => !person.isActive);

	async function fetchPeople() {
		try {
			const response = await fetch('/api/people');

			if (response.ok) {
				const data = await response.json();
				people = data;
			} else {
				alert('Error al cargar voluntarios. Por favor, inténtalo de nuevo.');
			}
		} catch (error) {
			alert('Error al cargar voluntarios. Por favor, verifica tu conexión.');
		}
	}

	async function handleSubmit() {
		try {
			const url = editingPerson ? `/api/people/${editingPerson.id}` : '/api/people';
			const method = editingPerson ? 'PUT' : 'POST';

			// Convert dates to ISO string if they exist
			const submitData = {
				...form,
				inactiveDate: (!form.isActive && form.inactiveDate) ? new Date(form.inactiveDate).toISOString() : null
			};

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(submitData)
			});

			if (response.ok) {
				await fetchPeople();
				resetForm();
				alert(editingPerson ? 'Voluntario actualizado correctamente.' : 'Voluntario agregado correctamente.');
			} else {
				const error = await response.json();
				alert(error.error || 'Ocurrió un error al guardar');
			}
		} catch (error) {
			alert('Error al guardar voluntario. Por favor, inténtalo de nuevo.');
		}
	}

	async function deletePerson(id) {
		if (confirm('¿Estás seguro de que quieres eliminar este voluntario?')) {
			try {
				const response = await fetch(`/api/people/${id}`, {
					method: 'DELETE'
				});

				if (response.ok) {
					await fetchPeople();
					alert('Voluntario eliminado correctamente.');
				} else {
					alert('Error al eliminar voluntario. Por favor, inténtalo de nuevo.');
				}
			} catch (error) {
				alert('Error al eliminar voluntario. Por favor, inténtalo de nuevo.');
			}
		}
	}

	async function togglePersonStatus(person) {
		const action = person.isActive ? 'desactivar' : 'reactivar';
		const confirmMessage = person.isActive
			? '¿Estás seguro de que quieres desactivar este voluntario?'
			: '¿Estás seguro de que quieres reactivar este voluntario?';

		if (confirm(confirmMessage)) {
			try {
				const updateData = {
					firstName: person.firstName,
					lastName: person.lastName,
					email: person.email,
					phone: person.phone || null,
					isActive: !person.isActive,
					inactiveDate: person.isActive ? new Date().toISOString() : null
				};

				const response = await fetch(`/api/people/${person.id}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(updateData)
				});

				if (response.ok) {
					await fetchPeople();
					alert(`Voluntario ${action === 'desactivar' ? 'desactivado' : 'reactivado'} correctamente.`);
				} else {
					alert(`Error al ${action} voluntario. Por favor, inténtalo de nuevo.`);
				}
			} catch (error) {
				alert(`Error al ${action} voluntario. Por favor, inténtalo de nuevo.`);
			}
		}
	}

	function editPerson(person) {
		editingPerson = person;
		form = {
			...person,
			inactiveDate: person.inactiveDate ? person.inactiveDate.split('T')[0] : null
		};
		showForm = true;
	}

	function resetForm() {
		form = {
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			isActive: true,
			inactiveDate: null
		};
		editingPerson = null;
		showForm = false;
	}

	function changePage(page) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	// Close modal when clicking outside
	function handleModalClick(event) {
		if (event.target === event.currentTarget) {
			resetForm();
		}
	}

	// Close modal on Escape key
	function handleKeydown(event) {
		if (event.key === 'Escape' && showForm) {
			resetForm();
		}
	}

	// Helper function to format dates in Spanish
	function formatDateSpanish(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Function to download volunteers as CSV
	function downloadCSV() {
		// Prepare CSV headers
		const headers = ['Nombre', 'Apellido', 'Correo Electrónico', 'Teléfono', 'Estado', 'Fecha de Ingreso'];

		// Prepare CSV data
		const csvData = people.map(person => {
			return [
				person.firstName || '',
				person.lastName || '',
				person.email || '',
				person.phone || '',
				person.isActive ? 'Activo' : 'Inactivo',
				person.createdAt ? formatDateSpanish(person.createdAt) : ''
			];
		});

		// Combine headers and data
		const allRows = [headers, ...csvData];

		// Convert to CSV string
		const csvContent = allRows.map(row => {
			return row.map(field => {
				// Escape quotes and wrap in quotes if contains comma, quote, or newline
				const fieldStr = String(field);
				const escaped = fieldStr.replace(/"/g, '""');
				return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
			}).join(',');
		}).join('\n');

		// Create blob and download
		const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);

		link.setAttribute('href', url);
		link.setAttribute('download', `voluntarios_${new Date().toISOString().split('T')[0]}.csv`);
		link.style.visibility = 'hidden';

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Clean up
		URL.revokeObjectURL(url);

		alert(`Se han exportado ${people.length} voluntarios a CSV exitosamente.`);
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="max-w-6xl mx-auto p-6">
    <!-- Header -->
	<div class="mb-6">
		<div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
			<div>
				<h1 class="text-2xl font-semibold text-gray-900">Registro de Voluntarios</h1>
				<p class="text-sm text-gray-600 mt-1">
					{activePeople.length} activos • {inactivePeople.length} inactivos
				</p>
			</div>
			<div class="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
				<button
					on:click={downloadCSV}
					disabled={people.length === 0}
					class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
					title={people.length === 0 ? 'No hay voluntarios para exportar' : 'Descargar todos los voluntarios en CSV'}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					Exportar CSV
				</button>
				<button
					on:click={() => showForm = true}
					class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
				>
					+ Agregar Voluntario
				</button>
			</div>
		</div>
	</div>

	{#if people.length > 0}
		<!-- Search and Controls -->
		<div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<!-- Search -->
				<div class="flex items-center gap-2">
					<input
						type="text"
						placeholder="Buscar voluntarios..."
						bind:value={searchTerm}
						class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
					/>
					{#if searchTerm}
						<button
							on:click={() => { searchTerm = ''; currentPage = 1; }}
							class="text-gray-500 hover:text-gray-700 text-sm"
						>
							Limpiar
						</button>
					{/if}
				</div>

				<!-- Items per page -->
				<div class="flex items-center gap-2 text-sm text-gray-600">
					<span>Mostrar:</span>
					<select
						bind:value={itemsPerPage}
						on:change={() => currentPage = 1}
						class="px-2 py-1 border border-gray-300 rounded text-sm"
					>
						<option value={10}>10</option>
						<option value={25}>25</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
					</select>
					<span>por página</span>
				</div>
			</div>

			<!-- Results info -->
			<div class="mt-2 text-sm text-gray-600">
				{#if searchTerm}
					Encontrados {filteredPeople.length} de {people.length} voluntarios
				{:else}
					Total: {people.length} voluntarios
				{/if}
			</div>
		</div>

		<!-- Desktop Table -->
		<div class="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Nombre
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Correo Electrónico
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Teléfono
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Fecha de Ingreso
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
							Acciones
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each paginatedPeople as person (person.id)}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{person.firstName} {person.lastName}
								{#if person.isActive}
									<span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
										Activo
									</span>
								{:else}
									<span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
										Inactivo
									</span>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{person.email}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{person.phone || '—'}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{formatDateSpanish(person.createdAt)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
								<button
									on:click={() => editPerson(person)}
									class="text-blue-600 hover:text-blue-900 mr-3"
								>
									Editar
								</button>
								<button
									on:click={() => togglePersonStatus(person)}
									class="{person.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'} mr-3"
								>
									{person.isActive ? 'Desactivar' : 'Reactivar'}
								</button>
								<button
									on:click={() => deletePerson(person.id)}
									class="text-red-600 hover:text-red-900"
								>
									Eliminar
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
						<div>
							<h3 class="font-medium text-gray-900 text-lg">
								{person.firstName} {person.lastName}
							</h3>
							{#if person.isActive}
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
									Activo
								</span>
							{:else}
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
									Inactivo
								</span>
							{/if}
						</div>
						<div class="flex flex-col gap-2">
							<button
								on:click={() => editPerson(person)}
								class="text-blue-600 hover:text-blue-900 text-sm font-medium text-right"
							>
								Editar
							</button>
							<button
								on:click={() => togglePersonStatus(person)}
								class="{person.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'} text-sm font-medium text-right"
							>
								{person.isActive ? 'Desactivar' : 'Reactivar'}
							</button>
							<button
								on:click={() => deletePerson(person.id)}
								class="text-red-600 hover:text-red-900 text-sm font-medium text-right"
							>
								Eliminar
							</button>
						</div>
					</div>

					<div class="space-y-2 text-sm">
						<div class="flex items-start">
							<span class="text-gray-500 w-20 flex-shrink-0">Correo:</span>
							<span class="text-gray-900 break-all">{person.email}</span>
						</div>

						{#if person.phone}
							<div class="flex items-start">
								<span class="text-gray-500 w-20 flex-shrink-0">Teléfono:</span>
								<span class="text-gray-900">{person.phone}</span>
							</div>
						{/if}

						<div class="flex items-start">
							<span class="text-gray-500 w-20 flex-shrink-0">Ingreso:</span>
							<span class="text-gray-900">{formatDateSpanish(person.createdAt)}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Empty filtered results -->
		{#if paginatedPeople.length === 0 && filteredPeople.length === 0 && searchTerm}
			<div class="bg-white border border-gray-200 rounded-lg p-12 text-center">
				<p class="text-gray-500">No se encontraron voluntarios que coincidan con "{searchTerm}"</p>
				<button
					on:click={() => { searchTerm = ''; currentPage = 1; }}
					class="mt-2 text-blue-600 hover:text-blue-800 text-sm"
				>
					Limpiar búsqueda
				</button>
			</div>
		{/if}

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="bg-white border border-gray-200 rounded-lg p-4 mt-4">
				<div class="flex items-center justify-between">
					<div class="text-sm text-gray-600">
						Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredPeople.length)}
						de {filteredPeople.length}
					</div>

					<div class="flex items-center gap-2">
						<!-- Previous button -->
						<button
							on:click={() => changePage(currentPage - 1)}
							disabled={currentPage === 1}
							class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
						>
							Anterior
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
							Siguiente
						</button>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<!-- Empty state -->
		<div class="bg-white border border-gray-200 rounded-lg p-12 text-center">
			<p class="text-gray-500 mb-4">No hay voluntarios registrados aún.</p>
			<button
				on:click={() => showForm = true}
				class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
			>
				Agregar Primer Voluntario
			</button>
		</div>
	{/if}
</div>

<!-- Modal Overlay -->
{#if showForm}
	<div
		class="fixed inset-0 flex items-center justify-center p-4 z-50"
		style="background-color: rgba(0, 0, 0, 0.3);"
		on:click={handleModalClick}
	>
		<!-- Modal Content -->
		<div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
			<!-- Modal Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200">
				<h2 class="text-xl font-semibold text-gray-900">
					{editingPerson ? 'Editar Voluntario' : 'Agregar Nuevo Voluntario'}
				</h2>
				<button
					on:click={resetForm}
					class="text-gray-400 hover:text-gray-600 transition-colors"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Modal Body -->
			<div class="p-6">
				<form on:submit|preventDefault={handleSubmit}>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
						<div>
							<label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
								Nombre *
							</label>
							<input
								id="firstName"
								type="text"
								placeholder="Ingresa el nombre"
								bind:value={form.firstName}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
								Apellido *
							</label>
							<input
								id="lastName"
								type="text"
								placeholder="Ingresa el apellido"
								bind:value={form.lastName}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
								Correo Electrónico *
							</label>
							<input
								id="email"
								type="email"
								placeholder="Ingresa el correo electrónico"
								bind:value={form.email}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
								Teléfono
							</label>
							<input
								id="phone"
								type="tel"
								placeholder="Ingresa el número de teléfono"
								bind:value={form.phone}
								class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>

					<!-- Status Section -->
					<div class="border-t border-gray-200 pt-6 mb-6">
						<h3 class="text-lg font-medium text-gray-900 mb-4">Estado</h3>

						<div class="space-y-4">
							<div class="flex items-center">
								<input
									id="isActive"
									type="checkbox"
									bind:checked={form.isActive}
									class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<label for="isActive" class="ml-2 block text-sm text-gray-900">
									Voluntario actualmente activo
								</label>
							</div>

							{#if !form.isActive}
								<div>
									<label for="inactiveDate" class="block text-sm font-medium text-gray-700 mb-1">
										Fecha de Desactivación
									</label>
									<input
										id="inactiveDate"
										type="date"
										bind:value={form.inactiveDate}
										class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
							{/if}
						</div>
					</div>

					<!-- Modal Footer -->
					<div class="flex justify-end gap-3">
						<button
							type="button"
							on:click={resetForm}
							class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
						>
							Cancelar
						</button>
						<button
							type="submit"
							class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
						>
							{editingPerson ? 'Actualizar Voluntario' : 'Agregar Voluntario'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
