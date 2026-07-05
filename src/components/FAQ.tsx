import { useState } from 'react'

const faqs = [
    {
        q: "Is this custodial? Who controls the funds?",
        a: "PaperEcash never holds your funds. The ecash notes are generated directly from your Fedimint wallet. Whoever physically holds a printed note — or scans its QR code — can redeem the value. Treat printed notes like cash.",
    },
    {
        q: "What happens if I lose a printed note, or it gets damaged?",
        a: "If you still have the session open, you can use Reclaim Ecash Notes within the 24-hour reclaim window to recover the underlying ecash tokens. After that window closes, only the physical note itself can redeem the funds — so store unspent notes as carefully as cash.",
    },
    {
        q: "How do I know if a note has already been redeemed?",
        a: "Open Reclaim Ecash Notes and tap Check Status. This checks each note's ecash nonces against the federation in real time and shows exactly how many of your notes are spent versus unspent, with a timestamp of when it was last checked.",
    },
    {
        q: "Which wallets can redeem these notes?",
        a: "Any Fedimint-compatible wallet can scan and redeem a note's QR code. The back of every printed note also includes a QR pointing to fedimint.org/wallets for recipients who don't have one yet.",
    },
    {
        q: "How do I fund my notes?",
        a: "After choosing a federation and denominations, you'll get a Lightning invoice with a QR code and a 5-minute payment window. Pay it from any Lightning wallet, or tap Open in Wallet to launch yours directly.",
    },
    {
        q: "What's the tamper-evident region for?",
        a: "It's an optional dashed border printed around the QR code that marks where a scratch-off or tamper-evident covering can be applied. This prevents unauthorized scanning until the recipient reveals the QR code and provides visible evidence if the note has been accessed or tampered with.",
    },
    {
        q: "Can I tip the designer of a note template?",
        a: "Yes. Tap Support Designer on the download screen to send a Lightning tip directly to the template creator via LNURL, if they've enabled it.",
    },
    {
        q: "What print quality should I choose?",
        a: "300 DPI is best for final printing. 150 DPI is a good balance for quick prints, and 72 DPI is only meant for on-screen previews before you commit to paper.",
    },
]

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section className="relative w-full bg-[#0B0B0D] text-white py-24 px-6 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-600/5 blur-[160px] rounded-full pointer-events-none" />

            <div className="relative max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-semibold">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-gray-400 mt-4">
                        Everything you need to know before printing your first note.
                    </p>
                </div>

                <div className="flex flex-col divide-y divide-white/10 border-y border-white/10">
                    {faqs.map((item, index) => {
                        const isOpen = openIndex === index
                        return (
                            <div key={index} className="py-2">
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : index)}
                                    className="w-full flex items-center justify-between gap-4 py-4 text-left group"
                                    aria-expanded={isOpen}
                                >
                                    <span className="text-base md:text-lg font-medium text-white group-hover:text-[#4C6FFF] transition-colors">
                                        {item.q}
                                    </span>
                                    <i
                                        className={`fa-solid fa-chevron-down text-sm text-gray-500 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#4C6FFF]" : ""
                                            }`}
                                    />
                                </button>

                                <div
                                    className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                        }`}
                                >
                                    <div className="overflow-hidden">
                                        <p className="text-gray-400 text-sm md:text-base leading-relaxed pb-5 pr-8">
                                            {item.a}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
