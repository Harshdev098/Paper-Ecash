import { Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Main from './pages/Main'

function App() {

    return (
        <>
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/explore' element={<Main />} />
            </Routes>
        </>
    )
}

export default App
