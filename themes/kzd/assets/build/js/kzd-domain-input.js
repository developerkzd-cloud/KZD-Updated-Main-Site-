/* One domain field instead of a name field plus an extension dropdown.
 *
 * Visitors type the whole domain ("harbourtable.co.za"). FOSSBilling still
 * takes the name and the extension as two values (register_sld /
 * register_tld and friends), so this splits what was typed and writes the
 * two parts into hidden fields that keep the original names -- nothing on
 * the server side changes.
 *
 * The extension is matched against the list the site actually sells,
 * longest first, so "name.co.za" is .co.za and never .za. For a domain the
 * customer already owns ("own domain"), any extension is accepted.
 */
(function () {
    'use strict';

    function clean(raw) {
        return String(raw || '')
            .trim()
            .toLowerCase()
            .replace(/^[a-z]+:\/\//, '')   // pasted https://
            .replace(/^www\./, '')          // pasted www.
            .replace(/[\/?#].*$/, '')       // pasted path or query
            .replace(/\s+/g, '');
    }

    /* The ending suggested in messages: .co.za when it is sold (this is a
       South African host), otherwise the first ending on offer. */
    function sample(tlds) {
        if (!tlds || !tlds.length) { return '.co.za'; }
        return tlds.indexOf('.co.za') !== -1 ? '.co.za' : tlds[0];
    }

    /* -> { ok, sld, tld, domain, error } */
    function parse(raw, tlds, opts) {
        opts = opts || {};
        var v = clean(raw);
        var example = 'yourname' + sample(tlds);
        if (!v) {
            return { ok: false, error: 'Enter a domain name, for example ' + example + '.' };
        }
        if (v.indexOf('.') === -1) {
            return { ok: false, error: 'Add the ending, for example ' + v + sample(tlds) + '.' };
        }

        var sld, tld;
        if (opts.anyTld) {
            var i = v.indexOf('.');
            sld = v.slice(0, i);
            tld = v.slice(i);
            if (tld.length < 3 || /\.\./.test(tld) || /\.$/.test(tld)) {
                return { ok: false, error: 'That ending does not look right. Check the domain, for example ' + example + '.' };
            }
        } else {
            var sorted = (tlds || []).slice().sort(function (a, b) { return b.length - a.length; });
            for (var k = 0; k < sorted.length; k++) {
                var t = sorted[k].toLowerCase();
                if (v.length > t.length && v.slice(-t.length) === t) { tld = t; break; }
            }
            if (!tld) {
                var typed = v.slice(v.indexOf('.'));
                return {
                    ok: false,
                    error: 'We do not offer ' + typed + ' domains. Try ' + (tlds || []).slice(0, 5).join(', ') + '.',
                };
            }
            sld = v.slice(0, -tld.length);
            if (sld.indexOf('.') !== -1) {
                return { ok: false, error: 'Enter the domain without a subdomain, for example ' + sld.split('.').pop() + tld + '.' };
            }
        }

        if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(sld)) {
            return { ok: false, error: 'Use only letters, numbers and hyphens in the name (no hyphen at the start or end).' };
        }
        return { ok: true, sld: sld, tld: tld, domain: sld + tld };
    }

    /* Keep the hidden name/extension fields in step with the visible one.
       Invalid input clears them, so a stale half never gets submitted. */
    function bind(visible, sldField, tldField, tlds, opts) {
        if (!visible || !sldField || !tldField) { return; }
        function sync() {
            var r = parse(visible.value, tlds, opts);
            sldField.value = r.ok ? r.sld : '';
            tldField.value = r.ok ? r.tld : '';
            return r;
        }
        visible.addEventListener('input', sync);
        visible.addEventListener('change', sync);
        if (visible.value) { sync(); }
        return sync;
    }

    /* ---- "That one is taken, try another ending" ----
       Renders into `box` a result line for the domain that was searched and
       a list of the same name on other endings, each with its real yearly
       registration price and a Check button. These alternatives are
       suggestions, not availability results: Check runs the real lookup.

       opts: { sld, tld, message, tlds: [{ tld, price }], currency, onPick(tld) } */
    var PRIORITY = ['.co.za', '.com', '.africa', '.net', '.org', '.joburg', '.capetown', '.durban', '.web.za', '.za'];
    var SHOW_FIRST = 6;

    function esc(t) {
        return String(t).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function money(amount, code) {
        try {
            return new Intl.NumberFormat(undefined, { style: 'currency', currency: code || 'ZAR', currencyDisplay: 'narrowSymbol' }).format(amount);
        } catch (e) { return (code || '') + ' ' + Number(amount).toFixed(2); }
    }

    function renderSuggestions(box, opts) {
        if (!box) { return; }
        var sld = opts.sld, tld = opts.tld;
        var alts = (opts.tlds || []).filter(function (t) { return t.tld !== tld; });
        alts.sort(function (a, b) {
            var ia = PRIORITY.indexOf(a.tld), ib = PRIORITY.indexOf(b.tld);
            if (ia === -1) { ia = 99; } if (ib === -1) { ib = 99; }
            return ia - ib || (a.price - b.price);
        });
        var msg = String(opts.message || '');
        /* The lookup itself failed (registrar unreachable, API refused,
           TLS/config problem). Say so plainly instead of leaking the raw
           server message, but still offer the other endings below, the same
           as for a taken name. */
        var failed = /failed to|registrar|error|whitelist|trust anchor|timed? ?out|could not connect|curl/i.test(msg);
        var taken = !failed && (!msg || /not available|registered|taken|unavailable/i.test(msg));
        var head = failed
            ? '<div class="kzd-dsug-head">' +
                '<span class="kzd-dsug-badge">Unavailable</span>' +
                '<span><strong>' + esc(sld + tld) + '</strong> is unavailable right now. Try another ending below.</span>' +
                '</div>'
            : '<div class="kzd-dsug-head">' +
                '<span class="kzd-dsug-badge">' + (taken ? 'Taken' : 'Unavailable') + '</span>' +
                '<span><strong>' + esc(sld + tld) + '</strong> ' + (taken ? 'is already registered.' : esc(msg)) + '</span>' +
                '</div>';
        var rows = alts.map(function (t, i) {
            return '<li' + (i >= SHOW_FIRST ? ' class="kzd-dsug-extra" hidden' : '') + '>' +
                '<button type="button" class="kzd-dsug-row" data-tld="' + esc(t.tld) + '" aria-label="' +
                    esc('Check ' + sld + t.tld + (t.price > 0 ? ', ' + money(t.price, opts.currency) + ' per year' : '')) + '">' +
                '<span class="kzd-dsug-name"><span class="kzd-dsug-sld">' + esc(sld) + '</span><b>' + esc(t.tld) + '</b></span>' +
                (t.price > 0 ? '<span class="kzd-dsug-price">' + esc(money(t.price, opts.currency)) + '<small>/yr</small></span>' : '<span></span>') +
                '<span class="kzd-dsug-go">Check</span>' +
                '</button></li>';
        }).join('');
        var more = alts.length > SHOW_FIRST
            ? '<button type="button" class="kzd-dsug-more">Show all ' + alts.length + ' endings</button>'
            : '';
        box.innerHTML = head + (alts.length ? '<div class="kzd-dsug-label">Try the same name on another ending</div><ul class="kzd-dsug-list">' + rows + '</ul>' + more : '');
        box.classList.add('kzd-dsug');
        box.style.display = '';

        box.querySelectorAll('.kzd-dsug-row').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (typeof opts.onPick === 'function') { opts.onPick(btn.getAttribute('data-tld')); }
            });
        });
        var moreBtn = box.querySelector('.kzd-dsug-more');
        if (moreBtn) {
            moreBtn.addEventListener('click', function () {
                box.querySelectorAll('.kzd-dsug-extra').forEach(function (li) { li.hidden = false; });
                moreBtn.remove();
            });
        }
    }

    window.KZDDomain = { parse: parse, bind: bind, clean: clean, renderSuggestions: renderSuggestions };
})();
