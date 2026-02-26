// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill structuredClone for Jest environment
if (typeof structuredClone === 'undefined') {
  (global as any).structuredClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
}

// Mock IndexedDB for storage tests
import 'fake-indexeddb/auto';
