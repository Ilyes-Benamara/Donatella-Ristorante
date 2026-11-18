"use strict";

const site = document.querySelector('.site');
const nav = document.querySelector('.nav');
const burger = document.querySelector('.nav__burger');
const navLinks = document.querySelectorAll('.nav__menu a');
const filters = document.querySelectorAll('.menu__filter');
const menuItems = document.querySelectorAll('.menu__item');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Navigation
function updateNavBackground() {
    nav.classList.toggle('nav--solid', window.scrollY > 24);
}

function setMenu(isOpen) {
    nav.classList.toggle('nav--open', isOpen);
    burger.setAttribute('aria-expanded', isOpen);
    burger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
}

window.addEventListener('scroll', updateNavBackground, { passive: true });
updateNavBackground();

burger.addEventListener('click', function() {
    setMenu(!nav.classList.contains('nav--open'));
});

navLinks.forEach(function(link) {
    link.addEventListener('click', function() {
        setMenu(false);
    });
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') setMenu(false);
});

window.matchMedia('(min-width: 861px)').addEventListener('change', function(event) {
    if (event.matches) setMenu(false);
});

// Menu filter
filters.forEach(function(filter) {
    filter.addEventListener('click', function() {
        const category = filter.dataset.filter;

        filters.forEach(function(other) {
            const isActive = other === filter;
            other.classList.toggle('menu__filter--active', isActive);
            other.setAttribute('aria-pressed', isActive);
        });

        menuItems.forEach(function(item) {
            const matches = category === 'all' || item.dataset.category.split(' ').includes(category);
            item.classList.toggle('hidden', !matches);
        });

        if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
});

// Opening hours: 9 AM to 10 PM every day, Algiers time
function updateHours() {
    try {
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Africa/Algiers',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).formatToParts(new Date());
        const get = function(type) {
            const part = parts.find(function(p) { return p.type === type; });
            return part ? part.value : '';
        };
        const hour = parseInt(get('hour'), 10) % 24;
        const weekday = get('weekday').slice(0, 3);
        const isOpen = hour >= 9 && hour < 22;
        const status = document.querySelector('.hours__status');
        const statusText = document.querySelector('.hours__statusText');

        document.querySelectorAll('.hours__day').forEach(function(day) {
            if (day.textContent === weekday) day.classList.add('hours__day--today');
        });

        status.classList.add(isOpen ? 'hours__status--open' : 'hours__status--closed');
        if (isOpen) {
            statusText.textContent = 'Open now, kitchen runs until 10 PM';
        } else if (hour < 9) {
            statusText.textContent = 'Closed now, opens today at 9 AM';
        } else {
            statusText.textContent = 'Closed now, opens tomorrow at 9 AM';
        }
    } catch (error) {
        console.warn('Could not work out the opening status', error);
    }
}

updateHours();

// Hero slideshow: one photo at a time, next one every 7 seconds
const SLIDE_MS = 7000;
let slideshowTimer = null;

function startSlideshow() {
    const slides = document.querySelectorAll('.gallery__item');
    if (slides.length < 2 || slideshowTimer) return;

    let current = 0;

    slideshowTimer = setInterval(function() {
        if (document.hidden) return;
        slides[current].classList.remove('gallery__item--active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('gallery__item--active');
    }, SLIDE_MS);
}

// Stage: logo splash -> hero
function showStatic() {
    site.classList.remove('site--intro');
    site.classList.add('site--static');
    startSlideshow();
}

function initStage() {
    if (!window.gsap || reducedMotion) {
        showStatic();
        return;
    }

    const root = document.documentElement;
    const rig = document.querySelector('.gallery__rig');
    const heroItems = gsap.utils.toArray('.hero > *');

    // Logo splash: plays by itself on load (2.5s), then fades into the site. Scroll stays locked until it ends.
    const SPLASH = 2.5;
    const FADE = 0.9;

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    root.classList.add('is-intro');

    const intro = gsap.timeline({
        onComplete: function() {
            root.classList.remove('is-intro');
            gsap.set('.splash', { display: 'none' });
            startSlideshow();
            if (window.ScrollTrigger) ScrollTrigger.refresh();
        }
    });

    gsap.set([rig, nav, heroItems], { autoAlpha: 0 });
    site.classList.remove('site--intro');

    intro.fromTo('.splash__logo', { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 1.3, ease: 'power3.out' }, 0);
    intro.fromTo('.splash__figure', { scale: 1 }, { scale: 1.06, duration: SPLASH + FADE, ease: 'sine.inOut' }, 0);
    intro.to('.splash', { autoAlpha: 0, duration: FADE, ease: 'power1.inOut' }, SPLASH);
    intro.fromTo(rig, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 1.1, ease: 'power2.out', clearProps: 'scale' }, SPLASH + 0.1);
    intro.to(nav, { autoAlpha: 1, duration: 0.7, ease: 'power1.out' }, SPLASH + 0.2);
    intro.fromTo(heroItems, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }, SPLASH + 0.25);

    document.querySelectorAll('[data-go="menu"]').forEach(function(link) {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            document.querySelector('#menu').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Cards rise in as they enter
    if (window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        gsap.set('.menu__item', { y: 60, opacity: 0 });
        ScrollTrigger.batch('.menu__item', {
            start: 'top 92%',
            once: true,
            onEnter: function(batch) {
                gsap.to(batch, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: 'power3.out' });
            }
        });

        window.addEventListener('load', function() {
            ScrollTrigger.refresh();
        });
    }
}

initStage();
