import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Beranda from './pages/home/Beranda'
import ProfileBimbel from './pages/home/ProfileBimbel'
import Tutor from './pages/home/Tutor'
import Berita from './pages/home/Berita'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Beranda />} />
          <Route path="/profile" element={<ProfileBimbel />} />
          <Route path="/tutor" element={<Tutor />} />
          <Route path="/berita" element={<Berita />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
