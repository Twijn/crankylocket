/**
 * Navigation Toggle for Mobile
 * Handles hamburger menu animation and mobile drawer
 */
(function() {
    'use strict';

    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navBackdrop = document.getElementById('navBackdrop');

    if (!navToggle || !navMenu) return;

    // Toggle navigation
    function toggleNav() {
        const isOpen = navMenu.classList.contains('active');
        
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        navBackdrop.classList.toggle('active');
        
        // Update ARIA attribute
        navToggle.setAttribute('aria-expanded', !isOpen);
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = !isOpen ? 'hidden' : '';
    }

    // Close navigation
    function closeNav() {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        navBackdrop.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    // Event listeners
    navToggle.addEventListener('click', toggleNav);
    navBackdrop.addEventListener('click', closeNav);

    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeNav();
        }
    });

    // Close on window resize (if going back to desktop)
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 900 && navMenu.classList.contains('active')) {
                closeNav();
            }
        }, 100);
    });

    // Handle navigation link clicks on mobile (close menu after click)
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 900) {
                // Small delay for visual feedback
                setTimeout(closeNav, 150);
            }
        });
    });
})();
