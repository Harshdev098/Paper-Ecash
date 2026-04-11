import { Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Main from './pages/Main'
import { useMemo } from 'react'
import { isInitialized, initialize } from '@fedimint/core-web';

function App() {
    useMemo(async()=>{
        if(!isInitialized){
            await initialize()
            await indexedDB.deleteDatabase("PaperEcash")
            console.log("Fedimint SDK initialized")
        }
    },[])
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
