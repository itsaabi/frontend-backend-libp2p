import { defineConfig } from 'vite';

export default defineConfig({
  
  define: {
    'process.env': {}, // Fix "process is not defined" error in browser
  },

  root: '.', // root directory
  publicDir: 'public', // where rider.html and driver.html are
  
  build: {
    outDir: 'dist',
  },

  server: {
    port: 5173,
  }
});