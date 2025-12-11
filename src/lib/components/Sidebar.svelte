<!-- Sidebar.svelte -->
<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  let isOpen = false;
  
  // Close sidebar when clicking outside on mobile
  function handleClickOutside(event) {
    if (isOpen && !event.target.closest('.sidebar') && !event.target.closest('.menu-button')) {
      isOpen = false;
    }
  }
  
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });
  
  const navItems = [
    { href: '/', label: 'Dashboard', icon: '' },
    { href: '/inventario', label: 'Inventario', icon: '' },
    { href: '/reportes', label: 'Reportes', icon: '' },
    { href: '/voluntarios', label: 'Voluntarios', icon: '' },
  ];
</script>

<!-- Mobile menu button -->
<button
  class="menu-button lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-white shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-200 backdrop-blur-sm"
  on:click={() => isOpen = !isOpen}
  aria-label="Toggle menu"
>
  <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {#if isOpen}
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    {:else}
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
    {/if}
  </svg>
</button>

<!-- Sidebar -->
<aside class="sidebar fixed inset-y-0 left-0 w-72 bg-white/95 backdrop-blur-lg border-r border-gray-200/50 shadow-2xl transform transition-all duration-300 ease-out lg:translate-x-0 lg:shadow-none lg:bg-white lg:backdrop-blur-none {isOpen ? 'translate-x-0 z-40' : '-translate-x-full z-40'}">
  <!-- Logo/Header -->
  <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
    <h1 class="text-xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Andar</h1>
    
  </div>

  <!-- Navigation -->
  <nav class="flex-1 px-4 py-6 space-y-2">
    {#each navItems as item}
      <a
        href={item.href}
        class="group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 {
          $page.url.pathname === item.href 
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100' 
            : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 hover:text-gray-900 hover:shadow-sm'
        }"
        on:click={() => isOpen = false}
      >
        <span class="mr-3 text-lg transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
        <span class="font-medium">{item.label}</span>
        {#if $page.url.pathname === item.href}
          <div class="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
        {/if}
      </a>
    {/each}
  </nav>
</aside>

<!-- Mobile overlay with glass effect -->
{#if isOpen}
  <div 
    class="lg:hidden fixed inset-0 z-30 transition-all duration-300 backdrop-blur-sm"
    style="background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.05) 100%);"
    on:click={() => isOpen = false}
  ></div>
{/if}

<style>
  /* Glass morphism effect for sidebar on mobile */
  @media (max-width: 1023px) {
    .sidebar {
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
  }
  
  /* Smooth transitions */
  .sidebar {
    will-change: transform;
  }
  
  /* Enhanced hover effects */
  .group:hover .text-lg {
    transform: scale(1.1);
  }
</style>