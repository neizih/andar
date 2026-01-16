<script>
  import { onMount } from 'svelte';

  let inventory = [];
  let filteredInventory = [];
  let showForm = false;
  let editingItem = null;

  // Form data
  let form = {
    name: '',
    quantity: 0,
    lowStockThreshold: 5
  };

  // Pagination and filtering
  let searchTerm = '';
  let currentPage = 1;
  let itemsPerPage = 10;
  let paginatedInventory = [];
  let totalPages = 1;

  let submitting = false;

  onMount(() => {
    fetchInventory();
  });

  // Reactive statements for filtering and pagination
  $: {
    if (searchTerm) {
      filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      filteredInventory = inventory;
    }
  }

  $: {
    totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    paginatedInventory = filteredInventory.slice(startIndex, startIndex + itemsPerPage);
  }

  async function fetchInventory() {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        inventory = await response.json();
        console.log('Inventory loaded:', inventory); // Debug: ver qué datos llegan
      } else {
        console.error('Failed to fetch inventory');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      alert('Por favor ingrese un nombre');
      return;
    }

    if (form.quantity < 0) {
      alert('La cantidad debe ser 0 o mayor');
      return;
    }

    if (form.lowStockThreshold < 0) {
      alert('El umbral de stock bajo debe ser 0 o mayor');
      return;
    }

    submitting = true;

    try {
      const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          quantity: Number(form.quantity),
          lowStockThreshold: Number(form.lowStockThreshold)
        })
      });

      if (response.ok) {
        await fetchInventory();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al guardar el artículo');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error al guardar el artículo');
    } finally {
      submitting = false;
    }
  }

  async function deleteItem(id) {
    if (!confirm('¿Está seguro de que desea eliminar este artículo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchInventory();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al eliminar el artículo');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error al eliminar el artículo');
    }
  }

  function editItem(item) {
    editingItem = item;
    form = {
      name: item.name,
      quantity: Number(item.quantity),
      lowStockThreshold: Number(item.lowStockThreshold) || 5
    };
    showForm = true;
  }

  function resetForm() {
    form = {
      name: '',
      quantity: 0,
      lowStockThreshold: 5
    };
    editingItem = null;
    showForm = false;
  }

  function changePage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function getQuantityColor(item) {
    const threshold = item.lowStockThreshold || 5;
    if (item.quantity === 0) return 'text-red-600';
    if (item.quantity <= threshold) return 'text-yellow-600';
    return 'text-green-600';
  }

  function getQuantityBadge(item) {
    const threshold = item.lowStockThreshold || 5;
    if (item.quantity === 0) return 'bg-red-100 text-red-800';
    if (item.quantity <= threshold) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  function getQuantityStatus(item) {
    const threshold = item.lowStockThreshold || 5;
    if (item.quantity === 0) return 'Agotado';
    if (item.quantity <= threshold) return 'Stock Bajo';
    return 'En Stock';
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

  // Function to download inventory as CSV
  function downloadCSV() {
    // Prepare CSV headers
    const headers = ['Nombre del Artículo', 'Cantidad', 'Umbral Stock Bajo', 'Estado', 'Fecha de Ingreso'];

    // Prepare CSV data
    const csvData = inventory.map(item => {
      return [
        item.name || '',
        item.quantity || '0',
        item.lowStockThreshold || '5',
        getQuantityStatus(item),
        item.createdAt ? formatDateSpanish(item.createdAt) : ''
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
    link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

    alert(`Se han exportado ${inventory.length} artículos a CSV exitosamente.`);
  }
</script>

<svelte:window on:keydown={handleKeydown} />
<svelte:head>
  <title>Gestor de Inventario</title>
</svelte:head>

<!-- Header -->
<div class="mb-6">
  <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
    <h1 class="text-2xl font-semibold text-gray-900">Gestor de Inventario</h1>
    <div class="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
      <button
        on:click={downloadCSV}
        disabled={inventory.length === 0}
        class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
        title={inventory.length === 0 ? 'No hay artículos para exportar' : 'Descargar todos los artículos en CSV'}
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
        + Agregar Artículo
      </button>
    </div>
  </div>
</div>
<div class="max-w-6xl mx-auto p-6">
   {#if inventory.length > 0}
    <!-- Search and Controls -->
    <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <!-- Search -->
        <div class="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar artículos..."
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
          Encontrados {filteredInventory.length} de {inventory.length} artículos
        {:else}
          Total: {inventory.length} artículos
        {/if}
      </div>
    </div>

    <!-- Desktop Table -->
    <div class="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre del Artículo
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cantidad
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Umbral
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
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
          {#each paginatedInventory as item (item.id)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.name}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm {getQuantityColor(item)} font-semibold">
                {item.quantity}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ≤ {item.lowStockThreshold || 5}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {getQuantityBadge(item)}">
                  {getQuantityStatus(item)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(item.createdAt).toLocaleDateString('es-ES')}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  on:click={() => editItem(item)}
                  class="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Editar
                </button>
                <button
                  on:click={() => deleteItem(item.id)}
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
      {#each paginatedInventory as item (item.id)}
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex justify-between items-start mb-3">
            <h3 class="font-medium text-gray-900 text-lg">
              {item.name}
            </h3>
            <div class="flex gap-2">
              <button
                on:click={() => editItem(item)}
                class="text-blue-600 hover:text-blue-900 text-sm font-medium"
              >
                Editar
              </button>
              <button
                on:click={() => deleteItem(item.id)}
                class="text-red-600 hover:text-red-900 text-sm font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex items-start">
              <span class="text-gray-500 w-24 flex-shrink-0">Cantidad:</span>
              <span class="{getQuantityColor(item)} font-semibold">{item.quantity}</span>
            </div>

            <div class="flex items-start">
              <span class="text-gray-500 w-24 flex-shrink-0">Umbral:</span>
              <span class="text-gray-900">≤ {item.lowStockThreshold || 5}</span>
            </div>

            <div class="flex items-start">
              <span class="text-gray-500 w-24 flex-shrink-0">Estado:</span>
              <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {getQuantityBadge(item)}">
                {getQuantityStatus(item)}
              </span>
            </div>

            <div class="flex items-start">
              <span class="text-gray-500 w-24 flex-shrink-0">Agregado:</span>
              <span class="text-gray-900">{new Date(item.createdAt).toLocaleDateString('es-ES')}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Empty filtered results -->
    {#if paginatedInventory.length === 0 && filteredInventory.length === 0 && searchTerm}
      <div class="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p class="text-gray-500">No se encontraron artículos que coincidan con "{searchTerm}"</p>
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
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredInventory.length)} de {filteredInventory.length}
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
      <p class="text-gray-500 mb-4">No hay artículos en el inventario todavía.</p>
      <button
        on:click={() => showForm = true}
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Agregar Primer Artículo
      </button>
    </div>
  {/if}
</div>

<!-- Form Modal -->
{#if showForm}
  <div
    class="fixed inset-0 flex items-center justify-center p-4 z-50"
    style="background-color: rgba(0, 0, 0, 0.3);"
    on:click={handleModalClick}
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">
          {editingItem ? 'Editar Artículo' : 'Agregar Nuevo Artículo'}
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
          <div class="space-y-4 mb-6">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Artículo *
              </label>
              <input
                id="name"
                type="text"
                placeholder="Ej: Pala, Semillas de tomate, Fertilizante"
                bind:value={form.name}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label for="quantity" class="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Actual *
              </label>
              <input
                id="quantity"
                type="number"
                placeholder="0"
                min="0"
                bind:value={form.quantity}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
              disabled={submitting || !form.name.trim()}
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Guardando...' : (editingItem ? 'Actualizar Artículo' : 'Agregar Artículo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
