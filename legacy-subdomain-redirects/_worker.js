/**
 * Permanent redirect from a retired per-language evemiss.com subdomain
 * to the new single-URL multi-language site. Content-preserving: path +
 * query carry through, only the host changes. No lang cookie is set for
 * languages the new site doesn't support yet (2026-07-19: en + zh only) —
 * the new site's own worker falls back to IP-country / Accept-Language
 * negotiation, which is a safe, correct default for unsupported languages.
 */
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, 'https://evemiss.com');
    return Response.redirect(target.toString(), 301);
  },
};
