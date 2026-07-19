// Theme handling — no localStorage (per artifact/static-host safety), falls back to OS preference each load.
(function(){
  const root = document.documentElement;
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  let current = prefersLight ? 'light' : 'dark';
  root.setAttribute('data-theme', current);

  function apply(theme){
    current = theme;
    root.setAttribute('data-theme', theme);
    document.dispatchEvent(new CustomEvent('arena:theme', { detail:{ theme } }));
  }

  window.ArenaTheme = {
    get: () => current,
    toggle: () => apply(current === 'dark' ? 'light' : 'dark'),
    set: apply
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-toggle]').forEach(btn=>{
      btn.addEventListener('click', ()=> window.ArenaTheme.toggle());
    });
  });
})();
