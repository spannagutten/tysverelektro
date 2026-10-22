(() => {
    const carousel = document.querySelector('.guide-carousel');
    if (!carousel) return;
    const track = carousel.querySelector('.guide-carousel-track');
    const originals = Array.from(track.children);
    const count = originals.length;
    if (!count) return;
    // Nabokopier gir sammenhengende innhold på begge sider av første og siste guide.
    function copy(slide) {
        const clone = slide.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.tabIndex = -1;
        return clone;
    }
    track.prepend(...originals.map(copy));
    track.append(...originals.map(copy));
    const slides = Array.from(track.children);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let active = count, timer, frame, settle;
    let interacting = false;
    const position = slide => slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
    function highlight() {
        active = slides.reduce((best, slide, i) => Math.abs(position(slide) - track.scrollLeft) < Math.abs(position(slides[best]) - track.scrollLeft) ? i : best, count);
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === active));
    }
    function jump(index) {
        track.classList.add('is-repositioning');
        track.scrollTo({ left: position(slides[index]), behavior: 'instant' });
        highlight();
        requestAnimationFrame(() => track.classList.remove('is-repositioning'));
    }
    function normalize() {
        if (interacting) return;
        highlight();
        if (active < count || active >= count * 2) jump(count + active % count);
    }
    function move(direction) {
        normalize();
        const next = Math.max(0, Math.min(slides.length - 1, active + direction));
        track.scrollTo({ left: position(slides[next]), behavior: reduced.matches ? 'instant' : 'smooth' });
    }
    function stop() { window.clearInterval(timer); }
    function start() {
        stop();
        if (!reduced.matches && !interacting && !document.hidden && !carousel.matches(':hover') && !carousel.contains(document.activeElement)) timer = window.setInterval(() => move(1), 5000);
    }
    track.addEventListener('scroll', () => {
        cancelAnimationFrame(frame); frame = requestAnimationFrame(highlight);
        clearTimeout(settle); settle = window.setTimeout(normalize, 180);
    }, { passive: true });
    carousel.querySelector('.guide-carousel-prev').addEventListener('click', () => { stop(); move(-1); });
    carousel.querySelector('.guide-carousel-next').addEventListener('click', () => { stop(); move(1); });
    track.addEventListener('pointerdown', () => { interacting = true; stop(); });
    function release() { if (interacting) { interacting = false; clearTimeout(settle); settle = window.setTimeout(normalize, 180); start(); } }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    track.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); stop(); move(e.key === 'ArrowRight' ? 1 : -1); }
    });
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', () => window.setTimeout(start, 0));
    document.addEventListener('visibilitychange', start);
    reduced.addEventListener('change', start);
    window.addEventListener('resize', () => jump(count + active % count));
    jump(count); start();
})();
