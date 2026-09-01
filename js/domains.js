// domains.js - Domain page UI behaviour.
//
// This file used to simulate domain availability, pricing, and a shopping
// cart entirely in JavaScript (Math.random() "availability", a fake
// checkout.html redirect, a localStorage cart). None of that was real.
//
// Real availability checks, pricing, and ordering all happen in FOSSBilling.
// This file only handles page UI (tooltips, TLD shortcuts, billing toggle
// display) and hands the customer's search/transfer intent off to
// KZD.goToDomainOrder() / KZD.goToDomainTransfer() from kzd-integration.js.

document.addEventListener('DOMContentLoaded', function () {
    // Bootstrap tooltips, if any are present on the page.
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Domain search -> forward straight to the FOSSBilling order flow.
    const domainSearchForm = document.getElementById('domainSearchForm');
    const domainInput = document.getElementById('domainInput');
    const tldSelect = document.getElementById('tldSelect');

    // Populate the TLD dropdown from KZD.tlds (single source of truth) so it
    // always matches everything KZD Solutions actually sells, grouped the
    // same way domain-pricing.html / tld-extensions.html group them.
    if (tldSelect) {
        const categoryLabels = {
            'south-african': 'South Africa',
            'global': 'Global',
            'african': 'Africa',
            'business': 'Business',
        };
        const groups = {};
        KZD.tlds.forEach(function (tld) {
            const label = categoryLabels[tld.category] || 'Other';
            groups[label] = groups[label] || [];
            groups[label].push(tld);
        });
        tldSelect.innerHTML = Object.keys(groups).map(function (label) {
            const options = groups[label].map(function (tld) {
                return `<option value="${tld.ext}">${tld.ext}</option>`;
            }).join('');
            return `<optgroup label="${label}">${options}</optgroup>`;
        }).join('');
        tldSelect.value = '.co.za';
    }

    if (domainSearchForm) {
        domainSearchForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitDomainSearch();
        });
    }

    if (domainInput) {
        domainInput.focus();
    }

    function submitDomainSearch() {
        if (!domainInput) return;
        const raw = domainInput.value.trim();
        if (!raw) {
            showNotification('Please enter a domain name', 'warning');
            return;
        }

        // If the customer typed just a name (no dot), use the selected TLD.
        const hasDot = raw.includes('.');
        const sld = hasDot ? KZD.splitDomain(raw).sld : raw;
        const tld = hasDot ? KZD.splitDomain(raw).tld : (tldSelect ? tldSelect.value : '.co.za');

        if (!tld || !KZD.isSupportedTld(tld)) {
            showNotification(
                `"${tld || raw}" isn't a domain extension we currently offer. Try one of: ${KZD.tlds.slice(0, 5).map(t => t.ext).join(', ')}...`,
                'warning'
            );
            return;
        }

        KZD.goToDomainOrder(sld + tld);
    }

    // Domain transfer form -> forward to the FOSSBilling transfer flow.
    const transferForm = document.getElementById('transferForm');
    if (transferForm) {
        transferForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const domainField = document.getElementById('transferDomain');
            const authField = document.getElementById('authCode');
            const domain = domainField ? domainField.value.trim() : '';
            if (!domain) {
                showNotification('Please enter the domain you want to transfer', 'warning');
                return;
            }
            KZD.goToDomainTransfer(domain, authField ? authField.value.trim() : '');
        });
    }

    // TLD shortcut chips/boxes -> append the TLD to whatever's typed and go.
    document.querySelectorAll('.tld-item, .tld-box').forEach(function (item) {
        item.addEventListener('click', function () {
            const tld = this.getAttribute('data-tld');
            if (!tld) return;
            const current = domainInput ? domainInput.value.split('.')[0] : '';
            if (domainInput) {
                domainInput.value = current + tld;
            }
            if (tldSelect) {
                tldSelect.value = tld;
            }
            if (current) {
                KZD.goToDomainOrder(current + tld);
            }
        });
    });

    setupDomainSuggestions();

    // Billing period toggle (visual only -- annual/monthly framing on this
    // page; actual registration years/pricing are selected inside FOSSBilling).
    const billingToggle = document.getElementById('billingToggle');
    if (billingToggle) {
        billingToggle.addEventListener('change', function () {
            const toggleSection = document.querySelector('.toggle-section');
            if (toggleSection) {
                toggleSection.classList.toggle('toggle-on', this.checked);
            }
        });
    }

    // FAQ accordion (chp-faq-* -- shared with hosting.html's pricing FAQ).
    document.querySelectorAll('.chp-faq-question').forEach(function (btn) {
        btn.addEventListener('click', function () {
            btn.parentElement.classList.toggle('active');
        });
    });

    // Reveal .chp-animate elements on scroll (same component/behaviour as
    // hosting.html's pricing section -- .chp-animate starts hidden until
    // .chp-visible is added).
    const domainsObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('chp-visible');
            }
        });
    }, { threshold: 0.15 });
    document.querySelectorAll('.chp-animate').forEach(function (el) {
        domainsObserver.observe(el);
    });
});

// TLD extension category filter (used on tld-extensions.html).
function filterByCategory(category) {
    const items = document.querySelectorAll('.tld-item, .tld-card');
    const buttons = document.querySelectorAll('.category-filter button');

    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(category) ||
            (category === 'all' && btn.textContent.toLowerCase().includes('all'))) {
            btn.classList.add('active');
        }
    });

    items.forEach((item, index) => {
        if (category === 'all' || item.getAttribute('data-category') === category) {
            item.style.display = 'block';
            item.style.animationDelay = `${index * 0.05}s`;
        } else {
            item.style.display = 'none';
        }
    });
}

// Pricing table search (used on domain-pricing.html).
function filterTLDs(searchTerm) {
    const rows = document.querySelectorAll('[data-tld-row]');
    searchTerm = (searchTerm || '').toLowerCase().trim();

    rows.forEach(row => {
        const ext = (row.getAttribute('data-tld-row') || '').toLowerCase();
        const text = row.textContent.toLowerCase();
        row.style.display = (!searchTerm || ext.includes(searchTerm) || text.includes(searchTerm)) ? '' : 'none';
    });
}

// Suggested domain names while typing (format hints only -- these are not
// availability checks, just common extension combinations to try).
function setupDomainSuggestions() {
    const domainInput = document.getElementById('domainInput');
    const suggestionsBox = document.getElementById('domainSuggestions');

    if (!domainInput || !suggestionsBox) return;

    domainInput.addEventListener('input', function () {
        const query = this.value.trim().replace(/\..+$/, '');
        if (query.length < 2) {
            suggestionsBox.style.display = 'none';
            return;
        }

        const popular = KZD.tlds.filter(t => t.popular).map(t => t.ext);
        const suggestions = popular.map(ext => `${query}${ext}`);

        suggestionsBox.innerHTML = suggestions.map(suggestion =>
            `<div class="suggestion-item" onclick="selectSuggestion('${suggestion}')">${suggestion}</div>`
        ).join('');

        suggestionsBox.style.display = 'block';
    });

    document.addEventListener('click', function (e) {
        if (!domainInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = 'none';
        }
    });
}

function selectSuggestion(domain) {
    const domainInput = document.getElementById('domainInput');
    const suggestionsBox = document.getElementById('domainSuggestions');

    if (suggestionsBox) {
        suggestionsBox.style.display = 'none';
    }

    KZD.goToDomainOrder(domain);
}

// Lightweight toast used across the domain pages.
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}
