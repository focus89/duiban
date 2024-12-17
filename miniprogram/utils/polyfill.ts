// Import core-js polyfills
import 'core-js/features/array';
import 'core-js/features/object';
import 'core-js/features/promise';
import 'core-js/features/symbol';
import 'core-js/features/set';
import 'core-js/features/map';
import 'regenerator-runtime/runtime';

// Ensure Int8Array and other TypedArrays are available
if (typeof Int8Array === 'undefined') {
  (global as any).Int8Array = Array;
  (global as any).Uint8Array = Array;
  (global as any).Uint8ClampedArray = Array;
  (global as any).Int16Array = Array;
  (global as any).Uint16Array = Array;
  (global as any).Int32Array = Array;
  (global as any).Uint32Array = Array;
  (global as any).Float32Array = Array;
  (global as any).Float64Array = Array;
}

// Ensure global is defined
if (typeof global === 'undefined') {
  (window as any).global = window;
}

// Ensure process.env is defined
if (typeof process === 'undefined') {
  (global as any).process = { env: {} };
} 