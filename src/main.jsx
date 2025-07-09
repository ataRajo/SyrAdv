import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import store from './RtkQuery/Store/store.jsx'
import { Provider } from 'react-redux'
import { ThemeProvider } from '@/Components/theme-provider.jsx'
import { AuthProvider } from './Context/AuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store} >
      <AuthProvider>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />

      </ThemeProvider>
      </AuthProvider>
    
    </Provider>
  </StrictMode>,
)
