/** Public origin for auth emails and redirects. */
export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://sonant.ac').replace(/\/$/, '');
}
