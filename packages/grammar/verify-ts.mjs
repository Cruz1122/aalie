// Simple verification script to test TypeScript parser import
import { LanguageLexer } from './src/ts/LanguageLexer.js';

// Verify the class was imported
if (LanguageLexer) {
  console.log('TS parser OK - LanguageLexer imported successfully');
} else {
  throw new Error('Failed to import LanguageLexer');
}