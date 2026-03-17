import { Routes, Route } from 'react-router-dom'
import Homepage from './screens/Homepage'
import Library from './screens/Library'
import Reader from './screens/Reader'
import Words from './screens/Words'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/library" element={<Library />} />
      <Route path="/words" element={<Words />} />
      <Route path="/read/:bookId" element={<Reader />} />
    </Routes>
  )
}
