import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'

// this is the normal react entry point: grab the root element and mount the whole app.
ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
