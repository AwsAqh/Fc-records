/**
 * Resolve a player's profile image path from the public/players folder.
 *
 * Uses import.meta.env.BASE_URL so the path is correct both in local dev
 * (-> /players/...) and when deployed under a sub-path on GitHub Pages
 * (-> /FC-record-web/players/...). Vite populates BASE_URL from the `base`
 * option in vite.config.ts.
 */
export const getPlayerImage = (name: string): string =>
  `${import.meta.env.BASE_URL}players/${name.trim().replace(/\s+/g, '')}.png`;