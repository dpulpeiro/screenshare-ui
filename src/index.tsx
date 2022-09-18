import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Share from './Share'

import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import View from './View'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Share />} />
        <Route path='/view/:uuid' element={<View />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
