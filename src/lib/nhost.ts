import { createClient } from '@nhost/nhost-js';

const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN || 'crshkkpgigbvcsbhitqx';
const region = import.meta.env.VITE_NHOST_REGION || 'sa-east-1';

export const nhost = createClient({
  subdomain,
  region
});
