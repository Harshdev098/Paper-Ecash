import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="w-full bg-[#0B0B0D] border-t border-white/10 py-6">
            <div className="max-w-[1100px] mx-auto px-6 text-center text-sm text-gray-400">
                Paper Ecash — Private, printable Bitcoin value.
            </div>
            <div className='text-white text-base my-2 text-center'>
                <Link to={""} className='mx-2' >Fedimint</Link>
                <Link to={""} className='mx-2' >Fedimint SDK</Link>
            </div>
            <div className='text-white text-lg my-2 text-center mb-4'>
                <Link to={""} ><i className="fa-brands fa-github mx-2"></i></Link>
                <Link to={""} ><i className="fa-brands fa-x-twitter mx-2"></i></Link>
            </div>
        </footer>
    )
}
