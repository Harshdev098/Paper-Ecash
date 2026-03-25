import type { DesignResponse } from "@/types/init.type";

const data: DesignResponse = {
    designs: [
        {
            id: 1,
            DesignName: "Vintage Ecash",
            path: "Vintage.png",
            designer: "Harshdev098",
            lnurl: "denimkangroo19@primal.net",
            label: ["Community", "Regular"],
            qr: {
                x: 50,
                y: 40,
                width: 140,
                height: 140
            },
            denomination: {
                x: 220,
                y: 80,
                fontSize: 28,
            }
        },
        {
            id: 2,
            DesignName: "Futuristic Ecash",
            path: "Futuristic.png",
            designer: "Harshdev098",
            lnurl: "denimkangroo19@primal.net",
            label: ["Cypherpunk", "Event"],
            qr: {
                x: 50,
                y: 40,
                width: 140,
                height: 140
            },
            denomination: {
                x: 220,
                y: 80,
                fontSize: 28,
            }
        },
        {
            id: 3,
            DesignName: "Golden Era",
            path: "GoldenEra.png",
            designer: "Harshdev098",
            lnurl: "denimkangroo19@primal.net",
            label: ["Gifts", "Regular"],
            qr: {
                x: 50,
                y: 40,
                width: 140,
                height: 140
            },
            denomination: {
                x: 220,
                y: 80,
                fontSize: 28,
            }
        },
        {
            id: 4,
            DesignName: 'Prestige',
            path: "Prestige.png",
            designer: "Harshdev098",
            lnurl: "denimkangroo19@primal.net",
            label: ["Community", "Event"],
            qr: {
                x: 50,
                y: 40,
                width: 140,
                height: 140
            },
            denomination: {
                x: 220,
                y: 80,
                fontSize: 28,
            }
        },
        {
            id: 5,
            DesignName: 'Glith Ledger',
            path: "GlithLedger.png",
            designer: "Harshdev098",
            lnurl: "denimkangroo19@primal.net",
            label: ["Gifts", "Event", "Regular"],
            qr: {
                x: 50,
                y: 40,
                width: 140,
                height: 140
            },
            denomination: {
                x: 220,
                y: 80,
                fontSize: 28,
            }
        },
    ]
}

export default data;