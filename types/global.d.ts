// types/global.d.ts

// 1) Mark this file as a module
export {};

// 2) Extend the global namespace with your custom definitions
declare global {
  interface Window {
    google?: typeof google;
  }
}
