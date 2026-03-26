// Wait for the entire HTML page to finish loading before running any JS.
// This ensures all elements exist in the DOM before we try to interact with them.
document.addEventListener('DOMContentLoaded', () => {

    // Check if the user has enabled "reduce motion" in their OS/browser settings.
    // If true, we skip animations and show final values immediately instead.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Set up the case study expand/collapse toggle and the number counting animations.
    initCaseStudyInteractions(prefersReducedMotion);

    // Set up the hamburger menu for mobile navigation.
    initMobileNav();
});

/*
 * initMobileNav()
 * ---------------
 * Handles the mobile navigation hamburger menu.
 * On small screens, the nav links are hidden by default (via CSS).
 * This function makes the hamburger button show/hide the nav links
 * when clicked, and also closes the menu when a nav link is clicked
 * (useful for single-page navigation or just keeping the UI clean).
 */
function initMobileNav() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    // If either element doesn't exist on the page, stop here to avoid errors.
    if (!hamburger || !navLinks) return;

    // When the hamburger button is clicked, toggle the 'open' class on the nav links.
    // The 'open' class in CSS switches the nav from display:none to display:flex.
    hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');

        // Update the aria-expanded attribute for screen reader accessibility.
        hamburger.setAttribute('aria-expanded', isOpen);

        // Swap the icon: ☰ (three lines) when closed, ✕ (X) when open.
        hamburger.textContent = isOpen ? '✕' : '☰';
    });

    // When any nav link is clicked, close the menu automatically.
    // This prevents the menu from staying open after the user navigates.
    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            hamburger.setAttribute('aria-expanded', false);
            hamburger.textContent = '☰';
        });
    });
}

/*
 * initCaseStudyInteractions(prefersReducedMotion)
 * -----------------------------------------------
 * Handles two things on the Projects page:
 *
 * 1. The <details> expand/collapse toggle — listens for when the user
 *    opens or closes the case study card, and triggers the stat animation
 *    when it opens (in case the stats weren't visible before).
 *
 * 2. The number counting animation — uses an IntersectionObserver to watch
 *    the stats container. When it scrolls into view, the count-up animation
 *    starts automatically. If the user prefers reduced motion, the final
 *    values are shown immediately with no animation.
 */
function initCaseStudyInteractions(prefersReducedMotion) {
    const detailCards = document.querySelectorAll('[data-detail-card]');
    const statElements = document.querySelectorAll('[data-count-target]');

    // Loop through each <details> card (there could be more than one).
    detailCards.forEach((card) => {
        const label = card.querySelector('[data-detail-label]');

        // Listen for the native 'toggle' event that fires whenever
        // a <details> element opens or closes.
        card.addEventListener('toggle', () => {
            // Swap the button label text between 'View Details' and 'Hide Details'.
            if (label) label.textContent = card.open ? 'Hide Details' : 'View Details';

            // If the card was just opened, trigger the stat count-up animation.
            if (card.open) animateStats(statElements, prefersReducedMotion);
        });
    });

    // If there are no stat elements on this page, stop here.
    if (!statElements.length) return;

    // If the user prefers no motion, skip the animation and set final values immediately.
    if (prefersReducedMotion) { statElements.forEach(setFinalValue); return; }

    // Set up a scroll observer to watch the stats container.
    // When it enters the viewport (50% visible), start the count-up animation.
    const observer = new IntersectionObserver((entries, obs) => {
        if (entries.some((e) => e.isIntersecting)) {
            animateStats(statElements, false);
            obs.disconnect(); // Stop watching once the animation has been triggered.
        }
    }, { threshold: 0.5 });

    // Find the parent container of the stats and observe it.
    const container = statElements[0].closest('.cs-stats');
    if (container) observer.observe(container);
}

/*
 * animateStats(elements, prefersReducedMotion)
 * --------------------------------------------
 * Animates each stat number counting up from 0 to its target value.
 * Uses requestAnimationFrame to run smoothly at ~60 frames per second.
 * Applies a cubic ease-out curve so it starts fast and slows at the end.
 *
 * Each element reads its settings from HTML data attributes:
 *   - data-count-target   → the final number to count to (e.g. 96)
 *   - data-count-decimals → decimal places to show (e.g. 1 for "1.8")
 *   - data-count-suffix   → text to add at the end (e.g. "%" or "s")
 *
 * Once animated, the element is marked with data-count-animated="true"
 * so it won't animate again if this function is called a second time.
 */
function animateStats(elements, prefersReducedMotion) {
    elements.forEach((el) => {
        // Skip this element if it has already been animated.
        if (el.dataset.countAnimated === 'true') return;

        // If reduced motion is preferred, just show the final value and stop.
        if (prefersReducedMotion) { setFinalValue(el); el.dataset.countAnimated = 'true'; return; }

        // Read the target number, decimal places, and suffix from the HTML element.
        const target = parseFloat(el.dataset.countTarget || '0');
        const decimals = parseInt(el.dataset.countDecimals || '0', 10);
        const suffix = el.dataset.countSuffix || '';

        // Record the exact time the animation starts.
        const start = performance.now();

        // Self-invoking step function — runs once per animation frame.
        (function step(now) {
            // Calculate how far through the 1400ms duration we are (0 to 1).
            const p = Math.min((now - start) / 1400, 1);

            // Apply a cubic ease-out curve: starts fast, decelerates to the end.
            // Formula: 1 - (1 - progress)^3
            el.textContent = `${(target * (1 - Math.pow(1 - p, 3))).toFixed(decimals)}${suffix}`;

            if (p < 1) {
                // Animation still in progress — request the next frame.
                requestAnimationFrame(step);
            } else {
                // Animation complete — snap to the exact final value and mark as done.
                setFinalValue(el);
                el.dataset.countAnimated = 'true';
            }
        })(performance.now());
    });
}

/*
 * setFinalValue(el)
 * -----------------
 * Directly sets an element's text to its final stat value without animation.
 * Used both as the reduced-motion fallback and as the finishing step
 * at the end of the count-up animation to ensure the exact number is shown
 * (avoids any floating point rounding from the animation calculation).
 */
function setFinalValue(el) {
    const target = parseFloat(el.dataset.countTarget || '0');
    const decimals = parseInt(el.dataset.countDecimals || '0', 10);
    el.textContent = `${target.toFixed(decimals)}${el.dataset.countSuffix || ''}`;
}
