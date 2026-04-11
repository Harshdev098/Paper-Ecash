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
                x: 166,
                y: 199,
                width: 479,
                height: 475
            },
            denomination: {
                x: 790,
                y: 393,
                fontSize: 78,
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
                x: 159,
                y: 245,
                width: 445,
                height: 441
            },
            denomination: {
                x: 1221,
                y: 726,
                fontSize: 72,
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
                x: 224,
                y: 256,
                width: 389,
                height: 385
            },
            denomination: {
                x: 128,
                y: 755,
                fontSize: 58,
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
                x: 1257,
                y: 299,
                width: 306,
                height: 303
            },
            denomination: {
                x: 661,
                y: 636,
                fontSize: 72,
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
                x: 184,
                y: 213,
                width: 389,
                height: 385
            },
            denomination: {
                x: 649,
                y: 393,
                fontSize: 72,
            }
        },
    ]
}

export const FIGMA_DESIGN_WIDTH = 1748;
export const FIGMA_DESIGN_HEIGHT = 874;

export default data;