/**
 * Content collections registry.
 * Each area of the site declares its collections in src/content/collections/<area>.ts;
 * the editable content itself lives next to it in src/content/<collection>/.
 */
import { core } from './content/collections/core';
import { home } from './content/collections/home';
import { services } from './content/collections/services';
import { portfolio } from './content/collections/portfolio';
import { support } from './content/collections/support';

export const collections = {
  ...core,
  ...home,
  ...services,
  ...portfolio,
  ...support,
};
