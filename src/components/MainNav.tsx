import { useState } from 'react'
import PaperMintLogo from '../assets/PaperMintLogoBlack.png'
import { Button } from './ui/button'

export default function MainNav() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <nav className='w-full px-6 md:px-10 py-3 bg-[#FAFAFA] shadow-md'>
            <div className='flex justify-between items-center'>

                {/* Logo */}
                <img src={PaperMintLogo} alt="PaperMint Logo" width="140px" />

                {/* Desktop Menu */}
                <ul className='hidden md:flex items-center font-medium text-[18px]'>
                    <li>
                        <input
                            className="mx-3 py-2 bg-[#D9D9D9] text-[#394354] placeholder:text-[#394354] px-3 text-sm rounded-lg w-72"
                            type="text"
                            placeholder="Search Designs"
                        />
                    </li>
                    <li>
                        <Button className='bg-[#319BD9] hover:bg-[#5399fb] text-white pl-3 pr-4 text-base'>
                            <i className="fa-solid fa-plus mr-2"></i>
                            Add Design
                        </Button>
                    </li>
                </ul>

                {/* Hamburger Button */}
                <button
                    className='md:hidden text-[#394354]'
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
                <div className='md:hidden mt-4 flex flex-col items-center bg-white rounded-lg py-4 space-y-4 shadow-md'>
                    <input
                        className="py-2 bg-[#D9D9D9] text-[#394354] placeholder:text-[#394354] px-3 text-sm rounded-lg w-11/12"
                        type="text"
                        placeholder="Search Designs"
                    />
                    <Button
                        className='bg-[#319BD9] hover:bg-[#5399fb] text-white px-6 text-base'
                        onClick={() => setIsOpen(false)}
                    >
                        <i className="fa-solid fa-plus mr-2"></i>
                        Add Design
                    </Button>
                </div>
            )}
        </nav>
    )
}