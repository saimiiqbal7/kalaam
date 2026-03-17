import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Homepage from './screens/Homepage'
import Library from './screens/Library'
import Reader from './screens/Reader'
import Words from './screens/Words'
import RegisterScreen from './components/RegisterScreen'
import { isRegistered, updateLastSeen } from './lib/userService'

export default function App() {

 
  useEffect(() => {
    window.resetKalaam = () => {
      localStorage.removeItem('kalaam_user_id')
      localStorage.removeItem('kalaam_user_name')
      localStorage.removeItem('kalaam_onboarding_done')
      window.location.reload()
    }
    return () => {
      if (window.resetKalaam) delete window.resetKalaam
    }
  }, [])

  useEffect(() => {
    const run = async () => {
      try {
        await updateLastSeen()
      } catch {
        // silent fail
      }
    }
    run()
  }, [])

  if (!registered) {
    return <RegisterScreen onComplete={() => setRegistered(true)} />
  }

  return (

    
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/library" element={<Library />} />
      <Route path="/words" element={<Words />} />
      <Route path="/read/:bookId" element={<Reader />} />
    </Routes>
  )
}
