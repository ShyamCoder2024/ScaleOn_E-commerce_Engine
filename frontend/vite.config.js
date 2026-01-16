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
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    ui: ['lucide-react']
                }
            }
        }
    },
    // Optimize for development
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'axios']
    }
})
