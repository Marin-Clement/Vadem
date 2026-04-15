/** @type {import('tailwindcss').Config} */
// Tailwind v4: theme tokens are in src/styles/globals.css (@theme).
// This file only overrides content scanning if auto-detection misses anything.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
};
