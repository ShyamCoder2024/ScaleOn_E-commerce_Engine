import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5001',
                changeOrigin: true
            }
        },
        // Fix 404 on page refresh - redirect all requests to index.html for SPA routing
        historyApiFallback: true
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        // Target modern browsers for smaller bundle
        target: 'es2020',
        // Minification options
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        // Chunk optimization
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                // Smart chunking strategy
                manualChunks: (id) => {
                    // React core - rarely changes
                    if (id.includes('node_modules/react')) {
                        return 'react-vendor';
                    }
                    // Router - rarely changes
                    if (id.includes('react-router')) {
                        return 'router';
                    }
                    // UI icons - large but cacheable
                    if (id.includes('lucide-react')) {
                        return 'icons';
                    }
                    // HTTP client
                    if (id.includes('axios')) {
                        return 'http';
                    }
                    // PDF generation - only needed for reports
                    if (id.includes('jspdf')) {
                        return 'pdf';
                    }
                    // Toast notifications
                    if (id.includes('react-hot-toast')) {
                        return 'toast';
                    }
                },
                // Asset naming with content hash for caching
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name.split('.');
                    const ext = info[info.length - 1];
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext)) {
                        return `assets/images/[name]-[hash][extname]`;
                    }
                    if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
                        return `assets/fonts/[name]-[hash][extname]`;
                    }
                    return `assets/[name]-[hash][extname]`;
                },
                chunkFileNames: 'js/[name]-[hash].js',
                entryFileNames: 'js/[name]-[hash].js'
            }
        },
        // CSS optimization
        cssCodeSplit: true,
        // Asset inlining threshold (4kb)
        assetsInlineLimit: 4096
    },
    // Optimize for development - pre-bundle these heavy deps
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'axios',
            'lucide-react',
            'react-hot-toast'
        ],
        // Exclude heavy admin-only deps from initial bundle
        exclude: ['jspdf', 'jspdf-autotable']
    },
    // Performance optimizations
    esbuild: {
        // Remove console.log in production
        drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    }
})
