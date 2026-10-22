(() => {
    const carousel = document.querySelector('.guide-carousel');
    if (!carousel) return;
    const track = carousel.querySelector('.guide-carousel-track');
    const slides = Array.from(track.children);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer, frame, active = 0;
    let interacting = false;
    const position = slide => slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
    function highlight() {
        active = slides.reduce((best, slide, i) => Math.abs(position(slide) - track.scrollLeft) < Math.abs(position(slides[best]) - track.scrollLeft) ? i : best, 0);
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === active));
    }
    function move(direction) {
        highlight();
        const next = (active + direction + slides.length) % slides.length;
        track.scrollTo({ left: position(slides[next]), behavior: reduced.matches ? 'instant' : 'smooth' });
    }
    function stop() { window.clearInterval(timer); }
    function start() {
        stop();
        if (!reduced.matches && !interacting && !document.hidden && !carousel.matches(':hover') && !carousel.contains(document.activeElement)) timer = window.setInterval(() => move(1), 5000);
    }
    track.addEventListener('scroll', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(highlight); }, { passive: true });
    track.addEventListener('pointerdown', () => { interacting = true; stop(); });
    window.addEventListener('pointerup', () => { if (interacting) { interacting = false; start(); } });
    window.addEventListener('pointercancel', () => { interacting = false; start(); });
    track.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); stop(); move(e.key === 'ArrowRight' ? 1 : -1); }
    });
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', () => window.setTimeout(start, 0));
    document.addEventListener('visibilitychange', start);
    reduced.addEventListener('change', start);
    window.addEventListener('resize', () => { track.scrollTo({ left: position(slides[active]), behavior: 'instant' }); highlight(); });
    highlight(); start();
})();
