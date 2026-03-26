document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    initCaseStudyInteractions(prefersReducedMotion);
    initMobileNav();
});

function initMobileNav() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (!hamburger || !navLinks) return;

    hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', isOpen);
        hamburger.textContent = isOpen ? '✕' : '☰';
    });

    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            hamburger.setAttribute('aria-expanded', false);
            hamburger.textContent = '☰';
        });
    });
}

function initCaseStudyInteractions(prefersReducedMotion) {
    const detailCards = document.querySelectorAll('[data-detail-card]');
    const statElements = document.querySelectorAll('[data-count-target]');

    detailCards.forEach((card) => {
        const label = card.querySelector('[data-detail-label]');
        card.addEventListener('toggle', () => {
            if (label) label.textContent = card.open ? 'Hide Details' : 'View Details';
            if (card.open) animateStats(statElements, prefersReducedMotion);
        });
    });

    if (!statElements.length) return;
    if (prefersReducedMotion) { statElements.forEach(setFinalValue); return; }

    const observer = new IntersectionObserver((entries, obs) => {
        if (entries.some((e) => e.isIntersecting)) {
            animateStats(statElements, false);
            obs.disconnect();
        }
    }, { threshold: 0.5 });

    const container = statElements[0].closest('.cs-stats');
    if (container) observer.observe(container);
}

function animateStats(elements, prefersReducedMotion) {
    elements.forEach((el) => {
        if (el.dataset.countAnimated === 'true') return;
        if (prefersReducedMotion) { setFinalValue(el); el.dataset.countAnimated = 'true'; return; }

        const target = parseFloat(el.dataset.countTarget || '0');
        const decimals = parseInt(el.dataset.countDecimals || '0', 10);
        const suffix = el.dataset.countSuffix || '';
        const start = performance.now();

        (function step(now) {
            const p = Math.min((now - start) / 1400, 1);
            el.textContent = `${(target * (1 - Math.pow(1 - p, 3))).toFixed(decimals)}${suffix}`;
            if (p < 1) requestAnimationFrame(step);
            else { setFinalValue(el); el.dataset.countAnimated = 'true'; }
        })(performance.now());
    });
}

function setFinalValue(el) {
    const target = parseFloat(el.dataset.countTarget || '0');
    const decimals = parseInt(el.dataset.countDecimals || '0', 10);
    el.textContent = `${target.toFixed(decimals)}${el.dataset.countSuffix || ''}`;
}
