(function () {
    "use strict";

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function init() {
        var targets = document.querySelectorAll('.card:not(.kzd-fx-skip), .kzd-fx-row');
        if (!targets.length) return;

        targets.forEach(function (el, i) {
            el.classList.add('kzd-fx');
            el.style.setProperty('--kzd-fx-delay', (Math.min(i, 8) * 55) + 'ms');
        });

        if (!('IntersectionObserver' in window) || reduceMotion) {
            targets.forEach(function (el) { el.classList.add('kzd-fx-in'); });
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('kzd-fx-in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        targets.forEach(function (el) { io.observe(el); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
