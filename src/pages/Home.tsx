import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import CurveLine from '../assets/Curve Line.svg'
import Gift from '../assets/Gift.svg'
import Bitcoiners from '../assets/Bitcoiners.png'
import Fedimint from '../assets/Fedimint.png'
import { useNavigate } from 'react-router-dom'
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from 'react'
import Preview from '../assets/Preview.png'
import SelectFederation from '../assets/SelectFederation.png'
import FundNotes from '../assets/FundNotes.png'
import Footer from '@/components/Footer'


const steps = [
  {
    number: "01",
    title: "Select Template",
    description:
      "Browse community-designed physical note templates or upload your own custom design.",
    image: `${Preview}`,
  },
  {
    number: "02",
    title: "Choose Federation",
    description:
      "Select the Fedimint federation you trust to issue your ecash. Your value remains private and secure.",
    image: `${SelectFederation}`,
  },
  {
    number: "03",
    title: "Pick Denominations",
    description:
      "Choose exact denominations and quantity of paper ecash notes to generate.",
    image: `${FundNotes}`,
  },
  {
    number: "04",
    title: "Fund via Fedimint or Lightning",
    description:
      "Fund your issuance session using Fedimint’s out-of-band spend or Lightning payment.",
    image: `${FundNotes}`,
  },
  {
    number: "05",
    title: "Download Printable PDF",
    description:
      "Receive a high-resolution, print-safe PDF containing beautifully designed paper ecash notes.",
    image: `${Preview}`,
  },
];


export default function Home() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    stepRefs.current.forEach((ref, index) => {
      if (!ref) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveStep(index)
          }
        },
        { threshold: 0.6 }
      )

      observer.observe(ref)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <>
      <section className='bg-[#0B0B0D] relative min-h-screen overflow-hidden'>
        <div className="absolute top-0 left-0 w-full pointer-events-none">
          <img
            src={CurveLine}
            alt="background shape"
          />
        </div>

        <Navbar />

        <section className='text-center text-white min-h-[46vh] w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%] mx-auto flex items-center flex-col justify-center z-10'>
          <h2 className='font-bold text-4xl'>A Web Based Physical Ecash Issuance system</h2>
          <p className='my-2 text-gray-400'>Lorem ipsum dolor sit amet consectetur adipisicing elit. In illo illum eaque autem necessitatibus deserunt impedit doloremque beatae.</p>
          <Button
            onClick={() => navigate('/explore')}
            className="w-full sm:w-auto px-8 sm:px-6 py-6 sm:py-7 md:py-8 text-base sm:text-lg md:text-xl bg-gradient-to-r from-[#7592BB] via-[#83A1CD] to-[#87A6D3] text-[#162446] font-medium my-4 transition-all duration-300 ease-in-out hover:scale-105"
          >
            Create your Physical ecash
            <i className="fa-solid fa-arrow-right ml-2 font-bold"></i>
          </Button>
        </section>
        <div className='flex justify-around items-center flex-wrap'>
          <div className='flex flex-col items-center justify-center my-2'>
            <h4 className='text-white text-lg sm:text-xl md:text-2xl font-bold'>Powered By</h4>
            <img src={Fedimint} alt="" className="w-[80%] sm:w-[80%] md:w-[260px]" />
          </div>
          <div className='flex flex-col items-center justify-center my-2'>
            <h4 className='text-white text-lg sm:text-xl md:text-2xl font-bold'>Used By</h4>
            <img src={Bitcoiners} alt="" className="w-[60%] sm:w-[50%] md:w-[260px]" />
          </div>
        </div>
        <div className='hidden sm:block absolute bottom-7 left-1/2 -translate-x-1/2 z-10'>
          <img src={Gift} alt="" className="w-[95%] sm:w-[80%] max-w-[600px] sm:max-w-[500px]" />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
      </section>

      <section className='h-3/6 w-full bg-[#0B0B0D] py-32 overflow-hidden'>
        <h2 className='text-center text-4xl text-white my-20 font-bold'>Why Paper Ecash</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:flex lg:justify-center gap-6 lg:gap-12">
          {/* Card 1 */}
          <div className="group w-full lg:w-72 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/20">
            <h3 className="text-lg font-semibold text-center mb-2 text-white">
              🧾 Offline payments
            </h3>
            <p className="text-sm text-gray-400 text-center">
              Send and receive Bitcoin even when you're completely offline.
            </p>
          </div>
          {/* Card 2 */}
          <div className="group w-full lg:w-72 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/20">
            <h3 className="text-lg font-semibold text-center mb-2 text-white">
              🎁 Gift Bitcoin like cash
            </h3>
            <p className="text-sm text-gray-400 text-center">
              Create simple bearer-style Bitcoin gifts anyone can redeem.
            </p>
          </div>
          {/* Card 3 */}
          <div className="group 
                  w-full lg:w-72
                  bg-white/5 backdrop-blur-md border border-white/10 
                  rounded-2xl p-6
                  transition-all duration-300 
                  hover:-translate-y-2 hover:shadow-xl hover:shadow-black/20">
            <h3 className="text-lg font-semibold text-center mb-2 text-white">
              🔐 Private bearer-style value transfer
            </h3>
            <p className="text-sm text-gray-400 text-center">
              Transfer value privately without requiring accounts or identity.
            </p>
          </div>
        </div>
      </section>

      <section className="relative w-full bg-[#0B0B0D] text-white overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="max-w-[1100px] mx-auto px-6">
          {/* Header */}
          <div className="text-center py-32">
            <h2 className="text-4xl md:text-5xl font-semibold">
              How It Works
            </h2>
          </div>
          <div className="relative flex">
            {/* LEFT SIDE - Desktop Progress Rail */}
            <div className="hidden md:flex relative w-1/3">
              <div className="sticky top-24 flex justify-center">
                <div className="relative flex flex-col items-center h-full py-24">

                  {/* Background line */}
                  <div className="absolute top-0 bottom-0 w-[2px] bg-white/10" />

                  {/* Animated progress line */}
                  <motion.div
                    className="absolute top-0 w-[2px] bg-[#4C6FFF]"
                    animate={{
                      height: `${(activeStep / (steps.length - 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.4 }}
                  />

                  {/* Step circles */}
                  <div className="relative flex flex-col justify-between h-full z-10">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-12 h-12 rounded-full border-2 bg-[#0B0B0D] transition-all duration-300
                        ${activeStep === index
                                      ? "border-[#4C6FFF] shadow-[0_0_20px_rgba(76,111,255,0.6)]"
                                      : "border-white/20"
                                    }
                      `}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* RIGHT SIDE - Steps */}
            <div className="w-full md:w-2/3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  ref={(el) => {
                    if (el) stepRefs.current[index] = el
                  }}
                  className="min-h-screen flex items-center"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={
                      activeStep === index
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0.3, y: 20 }
                    }
                    transition={{ duration: 0.6 }}
                    className="w-full"
                  >
                    <div className="text-sm text-[#4C6FFF] tracking-widest mb-4">
                      STEP {step.number}
                    </div>

                    <h3 className="text-3xl md:text-4xl font-semibold mb-6">
                      {step.title}
                    </h3>

                    <p className="text-gray-400 text-lg max-w-xl leading-relaxed">
                      {step.description}
                    </p>

                    {/* Image */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={
                        activeStep === index
                          ? { opacity: 1, scale: 1 }
                          : { opacity: 0.4, scale: 0.98 }
                      }
                      transition={{ duration: 0.6 }}
                      className="relative mt-14 w-full max-w-xl"
                    >
                      {/* glow */}
                      <div className="absolute inset-0 bg-[#4C6FFF]/10 blur-3xl rounded-2xl pointer-events-none" />

                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="relative rounded-2xl border border-gray-800 bg-[#111114] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                      >
                        <img
                          src={step.image}
                          alt={step.title}
                          className="w-full h-auto object-cover"
                        />
                      </motion.div>
                    </motion.div>

                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
