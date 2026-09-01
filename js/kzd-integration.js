/**
 * kzd-integration.js
 *
 * Single source of truth for how the marketing website hands customers off
 * to the FOSSBilling client portal. Nothing on the website performs a real
 * domain availability check, pricing lookup, or cart/checkout — that's all
 * FOSSBilling's job. This file only builds the right URL and navigates.
 *
 * To add a new product later (Cloud Hosting, VPS, WordPress Hosting, etc.):
 * add one entry to KZD.products below. No page-level code should need to
 * change.
 */
const KZD = {
    // Production: FOSSBilling lives on the my.kzdsolutions.co.za subdomain,
    // the website itself is on the apex domain (kzdsolutions.co.za).
    portalUrl: 'https://my.kzdsolutions.co.za',

    // FOSSBilling product IDs. Domains is product 1 (seeded by FOSSBilling
    // itself as "Domains registration and transfer"). Hosting plan IDs are
    // filled in once the products exist in the FOSSBilling catalog.
    products: {
        domain: 1,
        hostingStarter: 2,
        hostingBasic: 3,
        hostingStandard: 4,
        hostingBusiness: 5,
        businessEmail: 6,
        premiumBusinessEmail: 7,
    },

    // Real, live pricing — kept in sync with FOSSBilling's tld table.
    // Source of truth for the actual transaction is always FOSSBilling;
    // this is only used to render pricing tables/cards on the website.
    tlds: [
        { ext: '.co.za', register: 99, transfer: 49, renew: 150, category: 'south-african', popular: true },
        { ext: '.com', register: 349, transfer: 349, renew: 389, category: 'global', popular: true },
        { ext: '.net', register: 299, transfer: 299, renew: 299, category: 'global', popular: true },
        { ext: '.org', register: 249, transfer: 249, renew: 249, category: 'global' },
        { ext: '.africa', register: 199, transfer: 349, renew: 349, category: 'african', popular: true },
        { ext: '.info', register: 269, transfer: 269, renew: 269, category: 'global' },
        { ext: '.net.za', register: 99, transfer: 49, renew: 99, category: 'south-african' },
        { ext: '.org.za', register: 120, transfer: 49, renew: 120, category: 'south-african' },
        { ext: '.web.za', register: 120, transfer: 49, renew: 120, category: 'south-african' },
        { ext: '.capetown', register: 199, transfer: 249, renew: 249, category: 'south-african' },
        { ext: '.durban', register: 199, transfer: 249, renew: 249, category: 'south-african' },
        { ext: '.joburg', register: 199, transfer: 249, renew: 249, category: 'south-african' },
        { ext: '.online', register: 399, transfer: 399, renew: 399, category: 'business' },
        { ext: '.mobi', register: 289, transfer: 289, renew: 289, category: 'business' },
        { ext: '.biz', register: 289, transfer: 289, renew: 289, category: 'business' },
    ],

    /**
     * Split "example.co.za" into { sld: 'example', tld: '.co.za' } using the
     * known TLD list (so multi-part TLDs like .co.za are handled correctly,
     * not just split on the last dot).
     */
    splitDomain(input) {
        const value = (input || '').trim().toLowerCase();
        const known = [...this.tlds].sort((a, b) => b.ext.length - a.ext.length);
        for (const t of known) {
            if (value.endsWith(t.ext)) {
                return { sld: value.slice(0, -t.ext.length), tld: t.ext };
            }
        }
        // Fallback: split on the first dot.
        const dot = value.indexOf('.');
        if (dot === -1) {
            return { sld: value, tld: '' };
        }
        return { sld: value.slice(0, dot), tld: value.slice(dot) };
    },

    /** Whether `tld` (e.g. ".xyz") is one KZD Solutions currently sells. */
    isSupportedTld(tld) {
        return this.tlds.some(t => t.ext === (tld || '').toLowerCase());
    },

    /**
     * Build the FOSSBilling order URL for a domain, with the name/TLD
     * pre-filled. FOSSBilling's own order form already reads ?tld= and
     * ?name= from the URL (see mod_servicedomain_order_form.html.twig) --
     * this is not a custom parameter we invented.
     */
    domainOrderUrl(sld, tld) {
        const params = new URLSearchParams({ product: this.products.domain });
        if (tld) params.set('tld', tld);
        if (sld) params.set('name', sld);
        return `${this.portalUrl}/order?${params.toString()}`;
    },

    /** Navigate to the domain order/registration flow. */
    goToDomainOrder(domainInput) {
        const { sld, tld } = this.splitDomain(domainInput);
        window.location.href = this.domainOrderUrl(sld, tld);
    },

    /** Navigate to the domain transfer flow (same form, transfer tab). */
    goToDomainTransfer(domainInput, eppCode) {
        const { sld, tld } = this.splitDomain(domainInput);
        const url = new URL(this.domainOrderUrl(sld, tld));
        url.searchParams.set('action', 'transfer');
        if (eppCode) {
            url.searchParams.set('epp', eppCode);
        }
        window.location.href = url.toString();
    },

    /** Navigate to a hosting plan's order flow. productKey e.g. 'hostingStarter'. */
    goToHostingOrder(productKey) {
        const id = this.products[productKey];
        if (!id) {
            console.warn(`KZD.goToHostingOrder: no product ID configured for "${productKey}" yet.`);
            window.location.href = `${this.portalUrl}/order`;
            return;
        }
        window.location.href = `${this.portalUrl}/order?product=${id}`;
    },

    /** Format a number as South African Rand, e.g. 349 -> "R349". */
    formatPrice(amount) {
        return `R${amount}`;
    },
};
