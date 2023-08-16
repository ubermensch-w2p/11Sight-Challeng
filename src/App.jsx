import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Search from './Search'
import History from './History'
import PageNotFound from './PageNotFound'
import { HistoryProvider } from './HistoryProvider'

function App() {
  return (
    <HistoryProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to='search'/>} />
          <Route path='search' element={<Search />} />
          <Route path='history' element={<History />} />
          <Route path='*' element={<PageNotFound />} />
        </Route>
      </Routes>
    </HistoryProvider>
  );
}

export default App
