(function(){'use strict';
const root=document.documentElement,button=document.getElementById('theme-toggle'),system=matchMedia('(prefers-color-scheme: dark)');
function show(theme){root.dataset.theme=theme;const dark=theme==='dark';button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label',dark?'切換淺色模式':'切換深色模式');document.getElementById('theme-label').textContent=dark?'淺色模式':'深色模式';document.getElementById('theme-icon').textContent=dark?'☀':'☾';}
show(root.dataset.theme||'light');button.addEventListener('click',()=>{const theme=root.dataset.theme==='dark'?'light':'dark';show(theme);try{localStorage.setItem('pet-star-theme',theme);}catch(e){}});
system.addEventListener('change',e=>{try{if(localStorage.getItem('pet-star-theme'))return;}catch(error){}show(e.matches?'dark':'light');});
})();
