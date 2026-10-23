/* Add-to-cart celebration.
 *
 * Every add-to-cart in the order flow is a form posting to cart/add_item
 * (hosting plans, domains, anything else), so this listens for that submit
 * rather than for particular buttons -- a new product type is covered
 * without touching it.
 *
 * It listens in the bubble phase on the document, so it only fires once the
 * order is actually going through: the browser does not submit a form with
 * an unmet `required` field, and the own-domain check stops propagation
 * when the domain is malformed -- neither case gets a celebration.
 *
 * The form redirects to checkout as soon as the item is added, which would
 * cut a single burst short. So it bursts from the button on click, leaves a
 * note in sessionStorage, and the checkout page plays the full splash and
 * "Added to your cart" on arrival.
 *
 * Colours are the design document's five neutrals. Reduced motion: no confetti, only the
 * message.
 */
(function () {
    'use strict';

    var COLORS = ['#1A1A1A', '#3A3A3A', '#6B6B6B', '#A7A7A7', '#D9D9D9'];
    var KEY = 'kzd-celebrate';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function canvas() {
        var c = document.createElement('canvas');
        c.setAttribute('aria-hidden', 'true');
        c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000';
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        c.width = window.innerWidth * dpr;
        c.height = window.innerHeight * dpr;
        document.body.appendChild(c);
        var ctx = c.getContext('2d');
        ctx.scale(dpr, dpr);
        return { el: c, ctx: ctx };
    }

    /* origin: {x, y} in viewport px. spread: cone in radians around "up".
       power: launch speed. count: pieces. */
    function burst(origin, opts) {
        if (reduce) { return; }
        opts = opts || {};
        var count = opts.count || 110;
        var spread = opts.spread || Math.PI * 0.9;
        var power = opts.power || 13;
        var angle = opts.angle == null ? -Math.PI / 2 : opts.angle;
        var cv = canvas();
        var ctx = cv.ctx;
        var parts = [];
        for (var i = 0; i < count; i++) {
            var a = angle + (Math.random() - 0.5) * spread;
            var v = power * (0.45 + Math.random() * 0.75);
            parts.push({
                x: origin.x, y: origin.y,
                vx: Math.cos(a) * v, vy: Math.sin(a) * v,
                w: 6 + Math.random() * 6, h: 3 + Math.random() * 5,
                r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35,
                round: Math.random() < 0.3,
                color: COLORS[(Math.random() * COLORS.length) | 0],
                life: 0, max: 70 + Math.random() * 50,
            });
        }
        // A soft ring at the origin: the "splash".
        var ring = { r: 0, a: 0.55 };
        var start = null;
        function frame(t) {
            if (start === null) { start = t; }
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            if (ring.a > 0) {
                ctx.beginPath();
                ctx.arc(origin.x, origin.y, ring.r, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(26, 26, 26,' + ring.a + ')';
                ctx.lineWidth = 3;
                ctx.stroke();
                ring.r += 7; ring.a -= 0.02;
            }
            var alive = 0;
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];
                if (p.life > p.max) { continue; }
                alive++;
                p.life++;
                p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.32; // drag + gravity
                p.x += p.vx; p.y += p.vy; p.r += p.vr;
                ctx.save();
                ctx.globalAlpha = Math.max(0, 1 - Math.max(0, p.life - p.max * 0.6) / (p.max * 0.4));
                ctx.translate(p.x, p.y);
                ctx.rotate(p.r);
                ctx.fillStyle = p.color;
                if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.h / 1.4, 0, Math.PI * 2); ctx.fill(); }
                else { ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)) + 1); }
                ctx.restore();
            }
            if (alive > 0 && t - start < 4000) { requestAnimationFrame(frame); }
            else { cv.el.remove(); }
        }
        requestAnimationFrame(frame);
    }

    function toast(text) {
        var el = document.createElement('div');
        el.setAttribute('role', 'status');
        el.textContent = text;
        el.style.cssText = [
            'position:fixed', 'left:50%', 'top:24px', 'z-index:2147483001',
            'transform:translate(-50%,-12px)', 'opacity:0',
            'padding:12px 20px 12px 16px', 'border-radius:999px',
            'background:#1A1A1A', 'color:#FFFFFF',
            'font:700 15px/1.2 "Hanken Grotesk",system-ui,sans-serif',
            'box-shadow:0 18px 40px -16px rgba(26, 26, 26,0.55)',
            'display:flex', 'align-items:center', 'gap:10px',
            'transition:opacity 220ms ease, transform 320ms cubic-bezier(0.16,1,0.3,1)'
        ].join(';');
        var tick = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        tick.setAttribute('width', '18'); tick.setAttribute('height', '18'); tick.setAttribute('viewBox', '0 0 16 16');
        tick.setAttribute('aria-hidden', 'true');
        tick.innerHTML = '<circle cx="8" cy="8" r="8" fill="#FFFFFF"/><path d="M4.5 8.3L7 10.7L11.5 5.8" stroke="#1A1A1A" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
        el.insertBefore(tick, el.firstChild);
        document.body.appendChild(el);
        requestAnimationFrame(function () { el.style.opacity = '1'; el.style.transform = 'translate(-50%,0)'; });
        setTimeout(function () {
            el.style.opacity = '0'; el.style.transform = 'translate(-50%,-12px)';
            setTimeout(function () { el.remove(); }, 400);
        }, 2600);
    }

    function isAddToCart(form) {
        var action = form && (form.getAttribute('action') || '');
        return /cart\/add_item/.test(action);
    }

    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!isAddToCart(form)) { return; }
        var btn = e.submitter || form.querySelector('[type="submit"]');
        var r = btn ? btn.getBoundingClientRect() : null;
        var origin = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight * 0.6 };
        burst(origin, { count: 120, spread: Math.PI * 1.1, power: 14 });
        try { sessionStorage.setItem(KEY, String(Date.now())); } catch (err) {}
    });

    // Arrival at checkout after an add: the full splash.
    function arrival() {
        var at = null;
        try { at = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch (err) {}
        if (!at || Date.now() - Number(at) > 20000) { return; }
        toast('Added to your cart');
        var w = window.innerWidth, h = window.innerHeight;
        // Two cannons from the lower corners and one from the top, crossing
        // the middle of the screen.
        burst({ x: 0, y: h * 0.85 }, { angle: -Math.PI / 3, spread: 0.7, power: 19, count: 90 });
        burst({ x: w, y: h * 0.85 }, { angle: -Math.PI * 2 / 3, spread: 0.7, power: 19, count: 90 });
        setTimeout(function () { burst({ x: w / 2, y: h * 0.28 }, { spread: Math.PI * 2, power: 11, count: 90 }); }, 180);
    }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', arrival); }
    else { arrival(); }

    window.KZDCelebrate = { burst: burst, toast: toast };
})();
