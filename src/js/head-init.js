/**
 * Evita que o scroll “grude” após reload / bfcache: o scrollTo cedo no head corre antes do layout.
 */
(function () {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    function hardScrollTop() {
        window.scrollTo(0, 0);
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
    }

    hardScrollTop();

    window.addEventListener(
        'pageshow',
        function (event) {
            if (event.persisted) {
                hardScrollTop();
            }
        },
        { passive: true }
    );

    window.addEventListener('load', hardScrollTop, { passive: true });
})();
