# AMZN Consultants

Astro + React static redesign. Original root HTML files and css/ remain as the source archive; Astro builds only src/ and public/.

## Local development

Run `npm install`, then `npm run dev`. Production build: `npm run build`. Preview: `npm run preview`.

## Cloudflare Pages

Build command: `npm run build`. Output directory: `dist`. No server adapter or paid hosting plan required for static pages. public/_redirects maps the former .html addresses to clean URLs. Confirm all live website URLs before switching the domain.

## Before launch

- Connect the contact form to an approved email/form provider. The current preview only generates a copyable enquiry; it sends and stores nothing.
- Confirm business details, current services, claims and terms with the owner.
- Review archived articles for outdated Amazon advice. They are labelled as historical content.
- Confirm privacy information for the chosen form provider and preserve existing email DNS records during migration.
- No site has been deployed by this project setup.
