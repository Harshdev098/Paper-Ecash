import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import PaperMintLogo from '../assets/PaperMintLogo.png'
import { Button } from './ui/button'

export default function Navbar() {
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <nav className='w-full px-6 md:px-10 py-6'>
            <div className='flex justify-between items-center'>

                {/* Logo */}
                <img src={PaperMintLogo} alt="PaperMint Logo" width="140px" />

                {/* Desktop Menu */}
                <ul className='hidden md:flex items-center font-medium text-[18px]'>
                    <li>
                        <Link to="/" className='px-3 py-2 mx-3 text-white hover:border-b-2 border-[#7592BB]'>
                            <i className="fa-solid fa-house px-4"></i> Home
                        </Link>
                    </li>
                    <li>
                        <Link to="/about" className='px-3 py-2 mx-3 text-white hover:border-b-2 border-[#7592BB]'>
                            <i className="fa-solid fa-question px-4"></i> Why PaperEcash
                        </Link>
                    </li>
                    <li>
                        <Link to="/services" className='px-3 py-2 mx-3 text-white hover:border-b-2 border-[#7592BB]'>
                            <i className="fa-solid fa-briefcase px-4"></i> How it Works
                        </Link>
                    </li>
                    <li>
                        <Button
                            onClick={() => navigate('/explore')}
                            className='bg-gradient-to-r from-[#7592BB] via-[#83A1CD] to-[#87A6D3] text-[#162446]'
                        >
                            Get Started <i className="fa-solid fa-arrow-right font-bold"></i>
                        </Button>
                    </li>
                </ul>

                {/* Hamburger Button */}
                <button
                    className='md:hidden text-white'
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {isOpen ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className='md:hidden mt-4 flex flex-col items-center bg-[#1e293b] rounded-lg py-4 space-y-4 text-white'>
                    <Link to="/" onClick={() => setIsOpen(false)}>Home</Link>
                    <Link to="/about" onClick={() => setIsOpen(false)}>About Us</Link>
                    <Link to="/services" onClick={() => setIsOpen(false)}>Services</Link>
                    <Button
                        onClick={() => {
                            navigate('/explore')
                            setIsOpen(false)
                        }}
                        className='bg-gradient-to-r from-[#7592BB] via-[#83A1CD] to-[#87A6D3] text-[#162446]'
                    >
                        Get Started
                    </Button>
                </div>
            )}
        </nav>
    )
}
