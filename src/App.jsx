import React from 'react'
import './App.css'
import HordeMonitor from './HordeMonitor'
import { ThemeProvider } from "./components/ui/theme-provider"

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <div className="min-h-screen bg-background">
        <HordeMonitor />
      </div>
    </ThemeProvider>
  )
}

export default App
