(() => {
    const carousel = document.querySelector('.guide-carousel');
    if (!carousel) return;
    const track = carousel.querySelector('.guide-carousel-track');
    const slides = Array.from(track.children);
    const toggle = carousel.querySelector('[data-guide-toggle]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let paused = reduced.matches;
    let timer;
    function stop() { window.clearInterval(timer); }
    function move(direction) {
        const current = slides.reduce((best, slide, i) => Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft) < Math.abs(slides[best].offsetLeft - track.offsetLeft - track.scrollLeft) ? i : best, 0);
        const end = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
        const target = direction > 0 && end ? 0 : direction < 0 && track.scrollLeft < 2 ? slides.length - 1 : Math.max(0, Math.min(slides.length - 1, current + direction));
        track.scrollTo({left: slides[target].offsetLeft - track.offsetLeft, behavior: reduced.matches ? 'instant' : 'smooth'});
    }
    function render() { toggle.textContent = paused ? 'Start' : 'Pause'; toggle.setAttribute('aria-label', paused ? 'Start automatisk blaing' : 'Sett automatisk blaing på pause'); }
    function start() {
        stop();
        if (!paused && !document.hidden && !carousel.matches(':hover') && !carousel.contains(document.activeElement)) timer = window.setInterval(() => move(1), 5000);
    }
    toggle.addEventListener('click', () => { paused = !paused; render(); start(); });
    carousel.querySelector('[data-guide-prev]').addEventListener('click', () => { paused = true; render(); stop(); move(-1); });
    carousel.querySelector('[data-guide-next]').addEventListener('click', () => { paused = true; render(); stop(); move(1); });
    track.addEventListener('pointerdown', () => { paused = true; render(); stop(); });
    track.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); paused = true; render(); stop(); move(e.key === 'ArrowRight' ? 1 : -1); } });
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', () => window.setTimeout(start, 0));
    document.addEventListener('visibilitychange', start);
    reduced.addEventListener('change', () => { if (reduced.matches) paused = true; render(); start(); });
    render(); start();
})();
