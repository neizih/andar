<!-- routes/reports/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import MediaUpload from '$lib/components/MediaUpload.svelte';
  
  let reports = [];
  let filteredReports = [];
  let showForm = false;
  let showDetails = false;
  let editingReport = null;
  let viewingReport = null;
  
  // Form data
  let form = {
    title: '',
    description: '',
    date: getLocalISODate(new Date()), // Usar fecha local corregida
    files: []
  };
  
  // Pagination and filtering
  let filterDateFrom = '';
  let filterDateTo = '';
  let currentPage = 1;
  let itemsPerPage = 10;
  let paginatedReports = [];
  let totalPages = 1;
  
  let submitting = false;
  
  // Función para obtener la fecha en formato ISO sin desplazamiento de zona horaria
  function getLocalISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Función para convertir fecha ISO a objeto Date sin problemas de zona horaria
  function parseISODate(isoString) {
    const [year, month, day] = isoString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  onMount(() => {
    loadReports();
  });

  // Reactive statements for filtering and pagination - CORREGIDO
  $: {
    let filtered = reports;
    
    // Apply date filters
    if (filterDateFrom || filterDateTo) {
      filtered = filtered.filter(report => {
        // Extraer solo la parte de la fecha (YYYY-MM-DD)
        const reportDateStr = report.date.split('T')[0];
        const reportDate = parseISODate(reportDateStr);
        
        let matchesFrom = true;
        let matchesTo = true;
        
        if (filterDateFrom) {
          const fromDate = parseISODate(filterDateFrom);
          matchesFrom = reportDate >= fromDate;
        }
        
        if (filterDateTo) {
          const toDate = parseISODate(filterDateTo);
          matchesTo = reportDate <= toDate;
        }
        
        return matchesFrom && matchesTo;
      });
    }
    
    filteredReports = filtered;
  }

  $: {
    totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    paginatedReports = filteredReports.slice(startIndex, startIndex + itemsPerPage);
  }
  
  async function loadReports() {
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        reports = await response.json();
      } else {
        console.error('Failed to load reports');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  }
  
  async function handleSubmit() {
    if (!form.title.trim()) {
      alert('El título es requerido');
      return;
    }
    
    submitting = true;
    
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('date', form.date);
      
      // Add files
      form.files.forEach(file => {
        formData.append('files', file);
      });
      
      const url = editingReport ? `/api/reports/${editingReport.id}` : '/api/reports';
      const method = editingReport ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData
      });
      
      if (response.ok) {
        await loadReports();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al guardar el reporte');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error al guardar el reporte');
    } finally {
      submitting = false;
    }
  }
  
  async function deleteReport(id) {
    if (!confirm('¿Está seguro de que desea eliminar este reporte? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadReports();
      } else {
        alert('Error al eliminar el reporte');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Error al eliminar el reporte');
    }
  }
  
  async function deleteMedia(mediaId) {
    if (!confirm('¿Está seguro de que desea eliminar este archivo multimedia?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadReports();
        if (viewingReport) {
          const updatedReport = reports.find(r => r.id === viewingReport.id);
          if (updatedReport) {
            viewingReport = updatedReport;
          }
        }
      } else {
        alert('Error al eliminar el archivo');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Error al eliminar el archivo');
    }
  }

  function editReport(report) {
    editingReport = report;
    // Usar la fecha local corregida al editar
    const reportDate = parseISODate(report.date.split('T')[0]);
    form = {
      title: report.title,
      description: report.description || '',
      date: getLocalISODate(reportDate),
      files: []
    };
    showForm = true;
  }

  function viewReport(report) {
    viewingReport = report;
    showDetails = true;
  }

  function resetForm() {
    form = {
      title: '',
      description: '',
      date: getLocalISODate(new Date()), // Usar fecha local corregida
      files: []
    };
    editingReport = null;
    showForm = false;
  }

  function closeDetails() {
    showDetails = false;
    viewingReport = null;
  }

  function clearFilters() {
    filterDateFrom = '';
    filterDateTo = '';
    currentPage = 1;
  }

  function changePage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function handleFilesChanged(event) {
    form.files = event.detail;
  }
  
  function formatDate(dateString) {
    const date = parseISODate(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  function getMediaIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    return '📎';
  }

  function handleModalClick(event) {
    if (event.target === event.currentTarget) {
      resetForm();
    }
  }

  function handleDetailsModalClick(event) {
    if (event.target === event.currentTarget) {
      closeDetails();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      if (showForm) {
        resetForm();
      } else if (showDetails) {
        closeDetails();
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />
<svelte:head>
  <title>Reportes Diarios</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-semibold text-gray-900">Reportes Diarios</h1>
    <button 
      on:click={() => showForm = true}
      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
    >
      + Nuevo Reporte
    </button>
  </div>

  {#if reports.length > 0}
    <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-700">Filtrar por fecha:</span>
        </div>

        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <label class="block text-xs text-gray-600 mb-1">Desde</label>
            <input
              type="date"
              bind:value={filterDateFrom}
              on:change={() => currentPage = 1}
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div class="flex-1">
            <label class="block text-xs text-gray-600 mb-1">Hasta</label>
            <input
              type="date"
              bind:value={filterDateTo}
              on:change={() => currentPage = 1}
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {#if filterDateFrom || filterDateTo}
            <div class="flex items-end">
              <button 
                on:click={clearFilters}
                class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                Limpiar filtros
              </button>
            </div>
          {/if}
        </div>

        <div class="flex justify-between items-center">
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

          <div class="text-sm text-gray-600">
            {#if filteredReports.length !== reports.length}
              Encontrados {filteredReports.length} de {reports.length} reportes
            {:else}
              Total: {reports.length} reportes
            {/if}
          </div>
        </div>
      </div>
    </div>

    <div class="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Multimedia</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each paginatedReports as report (report.id)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-medium text-gray-900">
                <div class="max-w-xs truncate">{report.title}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(report.date)}</td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <div class="max-w-xs truncate">{report.description || '—'}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {#if report.media && report.media.length > 0}
                  {report.media.length} archivo{report.media.length !== 1 ? 's' : ''}
                {:else}
                  —
                {/if}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button on:click={() => viewReport(report)} class="text-green-600 hover:text-green-900 mr-3">Ver</button>
                <button on:click={() => editReport(report)} class="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                <button on:click={() => deleteReport(report.id)} class="text-red-600 hover:text-red-900">Eliminar</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-3">
      {#each paginatedReports as report (report.id)}
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex justify-between items-start mb-3">
            <h3 class="font-medium text-gray-900 text-lg truncate pr-2">{report.title}</h3>
            <div class="flex gap-1 flex-shrink-0">
              <button on:click={() => viewReport(report)} class="text-green-600 hover:text-green-900 text-sm font-medium">Ver</button>
              <button on:click={() => editReport(report)} class="text-blue-600 hover:text-blue-900 text-sm font-medium">Editar</button>
              <button on:click={() => deleteReport(report.id)} class="text-red-600 hover:text-red-900 text-sm font-medium">Eliminar</button>
            </div>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex items-start">
              <span class="text-gray-500 w-16 flex-shrink-0">Fecha:</span>
              <span class="text-gray-900">{formatDate(report.date)}</span>
            </div>
            {#if report.description}
              <div class="flex items-start">
                <span class="text-gray-500 w-16 flex-shrink-0">Desc:</span>
                <span class="text-gray-900 line-clamp-2">{report.description}</span>
              </div>
            {/if}
            {#if report.media && report.media.length > 0}
              <div class="flex items-start">
                <span class="text-gray-500 w-16 flex-shrink-0">Media:</span>
                <span class="text-gray-900">{report.media.length} archivo{report.media.length !== 1 ? 's' : ''}</span>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    {#if paginatedReports.length === 0 && filteredReports.length === 0}
      <div class="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p class="text-gray-500 mb-2">No se encontraron reportes con los filtros aplicados</p>
        <button on:click={clearFilters} class="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">Limpiar filtros</button>
      </div>
    {/if}

    {#if totalPages > 1}
      <div class="bg-white border border-gray-200 rounded-lg p-4 mt-4">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredReports.length)} de {filteredReports.length}
          </div>
          <div class="flex items-center gap-2">
            <button on:click={() => changePage(currentPage - 1)} disabled={currentPage === 1} class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Anterior</button>
            {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
              const start = Math.max(1, currentPage - 2);
              return start + i;
            }).filter(p => p <= totalPages) as page}
              <button on:click={() => changePage(page)} class="px-3 py-1 text-sm border border-gray-300 rounded {page === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}">{page}</button>
            {/each}
            <button on:click={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Siguiente</button>
          </div>
        </div>
      </div>
    {/if}
  {:else}
    <div class="bg-white border border-gray-200 rounded-lg p-12 text-center">
      <p class="text-gray-500 mb-4">No se han creado reportes todavía.</p>
      <button on:click={() => showForm = true} class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Crear Primer Reporte</button>
    </div>
  {/if}
</div>

{#if showForm}
  <div class="fixed inset-0 flex items-center justify-center p-4 z-50" style="background-color: rgba(0, 0, 0, 0.3);" on:click={handleModalClick}>
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">{editingReport ? 'Editar Reporte' : 'Crear Nuevo Reporte'}</h2>
        <button on:click={resetForm} class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-6">
        <form on:submit|preventDefault={handleSubmit}>
          <div class="space-y-4 mb-6">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input id="title" type="text" placeholder="Ingrese el título del reporte" bind:value={form.title} required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label for="date" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input id="date" type="date" bind:value={form.date} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea id="description" placeholder="Ingrese la descripción del reporte" bind:value={form.description} rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[100px]"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Archivos Multimedia</label>
              <MediaUpload bind:files={form.files} on:filesChanged={handleFilesChanged} />
            </div>
          </div>
          <div class="flex justify-end gap-3">
            <button type="button" on:click={resetForm} class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={submitting || !form.title.trim()} class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Guardando...' : (editingReport ? 'Actualizar Reporte' : 'Crear Reporte')}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

{#if showDetails && viewingReport}
  <div class="fixed inset-0 flex items-center justify-center p-4 z-50" style="background-color: rgba(0, 0, 0, 0.3);" on:click={handleDetailsModalClick}>
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">{viewingReport.title}</h2>
          <p class="text-sm text-gray-500 mt-1">{formatDate(viewingReport.date)}</p>
        </div>
        <button on:click={closeDetails} class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-6">
        {#if viewingReport.description}
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-2">Descripción</h3>
            <p class="text-gray-700 whitespace-pre-wrap">{viewingReport.description}</p>
          </div>
        {/if}
        {#if viewingReport.media && viewingReport.media.length > 0}
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Archivos Multimedia ({viewingReport.media.length})</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each viewingReport.media as media}
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                  {#if media.mimeType.startsWith('image/')}
                    <img src={media.path} alt={media.originalName} class="w-full h-48 object-cover" />
                  {:else if media.mimeType.startsWith('video/')}
                    <video controls class="w-full h-48 object-cover bg-gray-100">
                      <source src={media.path} type={media.mimeType} />
                      <track kind="captions" />
                    </video>
                  {:else}
                    <div class="h-48 flex flex-col items-center justify-center bg-gray-50">
                      <span class="text-4xl mb-2">{getMediaIcon(media.mimeType)}</span>
                      <p class="text-sm text-gray-600 text-center px-2 font-medium">{media.originalName}</p>
                      <p class="text-xs text-gray-500 mt-1">{formatFileSize(media.size)}</p>
                    </div>
                  {/if}
                  <div class="p-3 bg-white border-t border-gray-200">
                    <p class="text-sm font-medium text-gray-900 truncate" title={media.originalName}>{media.originalName}</p>
                    <p class="text-xs text-gray-500 mt-1">{formatFileSize(media.size)}</p>
                    <div class="flex justify-between items-center mt-2">
                      <a href={media.path} target="_blank" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Descargar</a>
                      <button on:click={() => deleteMedia(media.id)} class="text-red-600 hover:text-red-800 text-sm font-medium">Eliminar</button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <div class="text-center py-8">
            <p class="text-gray-500">No hay archivos multimedia adjuntos a este reporte.</p>
          </div>
        {/if}
      </div>
      <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
        <button on:click={() => { closeDetails(); editReport(viewingReport); }} class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">Editar Reporte</button>
        <button on:click={closeDetails} class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">Cerrar</button>
      </div>
    </div>
  </div>
{/if}