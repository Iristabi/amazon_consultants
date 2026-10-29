import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
export default defineConfig({site:'https://amznconsultants.com',integrations:[react()],output:'static'});
