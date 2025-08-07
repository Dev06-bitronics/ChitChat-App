export { MESSAGES } from './messages';
export { UI } from './ui';
export { VALIDATION } from './validation';
export { API } from './api';

export * from './regex';

// Import for default export
import { MESSAGES } from './messages';
import { UI } from './ui';
import { VALIDATION } from './validation';
import { API } from './api';

// Default export for convenience
export default {
  MESSAGES,
  UI,
  VALIDATION,
  API,
};
