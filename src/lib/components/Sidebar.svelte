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
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/reports', label: 'Reportes', icon: '📈' },
    { href: '/people', label: 'Voluntarios', icon: '👥' },
    { href: '/inventory', label: 'Inventario', icon: '📦' }
  ];
</script>

<!-- Mobile menu button -->
<button
  class="menu-button lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border"
  on:click={() => isOpen = !isOpen}
  aria-label="Toggle menu"
>
  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
  </svg>
</button>

<!-- Sidebar -->
<aside class="sidebar fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 {isOpen ? 'translate-x-0 z-40' : '-translate-x-full z-40'}">
  <!-- Logo/Header -->
  <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200">
    <h1 class="text-xl font-semibold text-gray-800">Dashboard</h1>
    <button
      class="lg:hidden p-1 rounded-md hover:bg-gray-100"
      on:click={() => isOpen = false}
      aria-label="Close menu"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 px-4 py-6 space-y-2">
    {#each navItems as item}
      <a
        href={item.href}
        class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 {
          $page.url.pathname === item.href 
            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }"
        on:click={() => isOpen = false}
      >
        <span class="mr-3 text-lg">{item.icon}</span>
        {item.label}
      </a>
    {/each}
  </nav>
</aside>

<!-- Mobile overlay -->
{#if isOpen}
  <div class="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity" on:click={() => isOpen = false}></div>
{/if}

<style>
  /* Additional styles if needed */
</style>