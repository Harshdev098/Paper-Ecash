import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './redux/store.tsx'
import { ThemeProvider } from './context/themeProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter basename="/Paper-Ecash">
      <ThemeProvider attribute="class" defaultTheme="light">
        <App />
      </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
