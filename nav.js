// Mobile nav toggle, shared by the home, dark, and studio pages
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');

function setOpen(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
}

toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));

// Close on link tap, outside tap, or Escape
nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('header')) setOpen(false);
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
});
