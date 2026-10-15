import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { activeDemoProfile } from './config/demoProfile'

document.title = activeDemoProfile.title

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
