/**
 * Progress keys that are not module ids.
 *
 * Deliberately a plain module — no `fs`, no `'use client'` — so both the server
 * routes and the browser components can import it without dragging a content
 * loader into the client bundle or a client reference into a server component.
 */

/**
 * Appendices are stored as a pseudo-module in `localStorage` so their pages can
 * be marked read like any other page.
 *
 * It is *not* a module id, and nothing that walks `content/modules` will ever
 * see it: `moduleCompletion` is only ever called with the real per-module
 * totals, and the metro map builds its stations from `getAllModules()`. That is
 * what keeps appendix reading out of module percentages and off the map — the
 * appendices are reference material a learner dips into, not a station on the
 * journey.
 */
export const APPENDIX_PROGRESS_KEY = 'appendices';
