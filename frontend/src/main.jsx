import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { ConfigProvider } from './context/ConfigContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ConfigProvider>
                <AuthProvider>
                    <CartProvider>
                        <WishlistProvider>
                            <App />
                        </WishlistProvider>
                    </CartProvider>
                </AuthProvider>
            </ConfigProvider>
        </BrowserRouter>
    </React.StrictMode>,
)

