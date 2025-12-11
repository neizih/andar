<!-- routes/dashboard/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  
  let people = [];
  let inventory = [];
  let reports = [];
  let loading = true;
  let error = null;
  
  // Computed metrics
  $: activePeople = people.filter(person => person.isActive);
  $: inactivePeople = people.filter(person => !person.isActive);
  $: lowStockItems = inventory.filter(item => item.quantity > 0 && item.quantity <= 5);
  $: outOfStockItems = inventory.filter(item => item.quantity === 0);
  $: recentReports = reports.filter(report => {
    const reportDate = new Date(report.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return reportDate >= weekAgo;
  }).length;
  
  // Recent activity (last 7 days)
  $: recentVolunteers = people.filter(person => {
    const createdDate = new Date(person.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate >= weekAgo;
  }).length;

  // Sort people by most recently updated
  $: sortedPeople = [...people].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt);
    const dateB = new Date(b.updatedAt || b.createdAt);
    return dateB - dateA; // Most recent first
  });

  onMount(async () => {
    await loadDashboardData();
  });

  async function loadDashboardData() {
    loading = true;
    error = null;
    
    try {
      const [peopleRes, inventoryRes, reportsRes] = await Promise.all([
        fetch('/api/people'),
        fetch('/api/inventory'),
        fetch('/api/reports')
      ]);

      if (peopleRes.ok) people = await peopleRes.json();
      if (inventoryRes.ok) inventory = await inventoryRes.json();
      if (reportsRes.ok) reports = await reportsRes.json();
      
    } catch (err) {
      error = 'Failed to load dashboard data';
      console.error('Dashboard error:', err);
    } finally {
      loading = false;
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function getInventoryStatusColor(quantity) {
    if (quantity === 0) return 'text-red-600';
    if (quantity <= 5) return 'text-yellow-600';
    return 'text-green-600';
  }
</script>

<svelte:head>
  <title>Dashboard</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
    <p class="text-gray-600 mt-2">Vista general del sistema de gestión</p>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Cargando datos...</span>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-600">{error}</p>
      <button 
        on:click={loadDashboardData}
        class="mt-2 text-red-700 hover:text-red-900 font-medium text-sm"
      >
        Reintentar
      </button>
    </div>
  {:else}
    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <!-- Active Volunteers -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Voluntarios Activos</p>
            <p class="text-3xl font-bold text-green-600">{activePeople.length}</p>
            <p class="text-xs text-gray-500 mt-1">
              {inactivePeople.length} inactivos
            </p>
          </div>
          <div class="bg-green-100 p-3 rounded-lg">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
        </div>
        {#if recentVolunteers > 0}
          <div class="mt-4 flex items-center text-sm">
            <span class="text-green-600 font-medium">+{recentVolunteers}</span>
            <span class="text-gray-600 ml-1">esta semana</span>
          </div>
        {/if}
      </div>

      <!-- Inventory Items -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Items en Inventario</p>
            <p class="text-3xl font-bold text-blue-600">{inventory.length}</p>
            <p class="text-xs text-gray-500 mt-1">
              {inventory.reduce((sum, item) => sum + item.quantity, 0)} unidades totales
            </p>
          </div>
          <div class="bg-blue-100 p-3 rounded-lg">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
        {#if lowStockItems.length > 0}
          <div class="mt-4 flex items-center text-sm">
            <span class="text-yellow-600 font-medium">{lowStockItems.length}</span>
            <span class="text-gray-600 ml-1">con stock bajo</span>
          </div>
        {/if}
      </div>

      <!-- Reports -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Reportes Totales</p>
            <p class="text-3xl font-bold text-purple-600">{reports.length}</p>
            <p class="text-xs text-gray-500 mt-1">
              {recentReports} esta semana
            </p>
          </div>
          <div class="bg-purple-100 p-3 rounded-lg">
            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Volunteers -->
      <div class="lg:col-span-1">
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Voluntarios Recientes</h3>
            <p class="text-sm text-gray-600">Últimas 5 actualizaciones</p>
          </div>
          <div class="p-6">
            {#if people.length > 0}
              <div class="space-y-4">
                {#each sortedPeople.slice(0, 5) as person}
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-gray-900">
                        {person.firstName} {person.lastName}
                      </p>
                      <p class="text-sm text-gray-500">{person.email}</p>
                    </div>
                    <div class="text-right">
                      <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {person.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        {person.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                      <p class="text-xs text-gray-500 mt-1">
                        {formatDate(person.createdAt)}
                      </p>
                    </div>
                  </div>
                {/each}
              </div>
              <div class="mt-6">
                <a href="/volunteers" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver todos los voluntarios →
                </a>
              </div>
            {:else}
              <p class="text-gray-500 text-center py-4">No hay voluntarios registrados</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Inventory Alerts -->
      <div class="lg:col-span-1">
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Alertas de Inventario</h3>
            <p class="text-sm text-gray-600">Stock bajo y agotado</p>
          </div>
          <div class="p-6">
            {#if outOfStockItems.length > 0 || lowStockItems.length > 0}
              <div class="space-y-4">
                {#each outOfStockItems.slice(0, 3) as item}
                  <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p class="font-medium text-gray-900">{item.name}</p>
                      <p class="text-sm text-red-600">Agotado</p>
                    </div>
                    <span class="text-red-600 font-bold">0</span>
                  </div>
                {/each}
                
                {#each lowStockItems.slice(0, Math.min(3, 5 - outOfStockItems.length)) as item}
                  <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p class="font-medium text-gray-900">{item.name}</p>
                      <p class="text-sm text-yellow-600">Stock bajo</p>
                    </div>
                    <span class="text-yellow-600 font-bold">{item.quantity}</span>
                  </div>
                {/each}
              </div>
              <div class="mt-6">
                <a href="/inventory" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver inventario completo →
                </a>
              </div>
            {:else}
              <div class="text-center py-8">
                <svg class="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <p class="text-gray-500">Todo el inventario está en buen estado</p>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Recent Reports -->
      <div class="lg:col-span-1">
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Reportes Recientes</h3>
            <p class="text-sm text-gray-600">Últimos 5 reportes</p>
          </div>
          <div class="p-6">
            {#if reports.length > 0}
              <div class="space-y-4">
                {#each reports.slice(0, 5) as report}
                  <div class="border-l-4 border-purple-400 pl-4">
                    <p class="font-medium text-gray-900 truncate" title={report.title}>
                      {report.title}
                    </p>
                    <p class="text-sm text-gray-500">
                      {formatDate(report.date)}
                    </p>
                    {#if report.description}
                      <p class="text-sm text-gray-600 mt-1 truncate" title={report.description}>
                        {report.description}
                      </p>
                    {/if}
                  </div>
                {/each}
              </div>
              <div class="mt-6">
                <a href="/reports" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver todos los reportes →
                </a>
              </div>
            {:else}
              <p class="text-gray-500 text-center py-4">No hay reportes creados</p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>