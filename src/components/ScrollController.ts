/**
 * ScrollController:
 * 1. Synchronizes aria-current="true" with native CSS `scroll-target-group: auto` and `:target-current`,
 *    and provides an IntersectionObserver fallback toggling `.\:target-current` for older browsers.
 * 2. Provides progressive-enhancement fallback for CSS `view-timeline` scroll animations.
 * 3. Animates SVG CAD blueprint dividers and background grid scroll offset.
 */
export function initScrollController(): void {
  const navContainer = document.querySelector('.nav-links-group');
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-links-group a');
  const sections = document.querySelectorAll<HTMLElement>('main section[id]');

  // 1. Background Spatial Grid Scroll Parallax Offset
  window.addEventListener(
    'scroll',
    () => {
      const offset = (window.scrollY * -0.28).toFixed(1);
      document.documentElement.style.setProperty('--scroll-y', `${offset}px`);
    },
    { passive: true }
  );

  // 2. Scrollspy Native Support & Fallback (scrollspy guidance)
  const supportsScrollTargetGroup =
    typeof CSS !== 'undefined' && CSS.supports && CSS.supports('scroll-target-group: auto');

  if (supportsScrollTargetGroup && navContainer) {
    const syncAriaCurrent = () => {
      const currentLink = navContainer.querySelector('a:target-current');
      navLinks.forEach((link) => {
        link.setAttribute('aria-current', link === currentLink ? 'true' : 'false');
      });
    };
    syncAriaCurrent();
    document.addEventListener('scrollend', syncAriaCurrent, { passive: true });
  } else {
    // Fallback for browsers without scroll-target-group support
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach((link) => {
              const isActive = link.getAttribute('href') === `#${id}`;
              link.classList.toggle(':target-current', isActive);
              link.setAttribute('aria-current', isActive ? 'true' : 'false');
            });
          }
        });
      },
      { rootMargin: '-42% 0px -48% 0px', threshold: 0 }
    );

    sections.forEach((section) => spyObserver.observe(section));
  }

  // 3. Fallback for browsers without native CSS view-timeline support (parallax-scroll-effects guidance)
  const supportsViewTimeline =
    typeof CSS !== 'undefined' &&
    CSS.supports &&
    CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

  const revealBlocks = document.querySelectorAll<HTMLElement>('.scroll-reveal-block');
  if (!supportsViewTimeline) {
    revealBlocks.forEach((el) => el.classList.add('scroll-reveal-fallback'));

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    revealBlocks.forEach((el) => revealObserver.observe(el));
  }

  // 4. SVG CAD Blueprint Line Reveal Observer
  const blueprintDividers = document.querySelectorAll<SVGElement>('.blueprint-divider');
  const blueprintObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-drawn');
        }
      });
    },
    { threshold: 0.25 }
  );
  blueprintDividers.forEach((svg) => blueprintObserver.observe(svg));
}
