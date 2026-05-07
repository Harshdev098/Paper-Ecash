import type {DesignResponse} from '../../src/types/init.type'

const data: DesignResponse = {
    designs: [
        {
            id: 1,
            DesignName: "Vintage Ecash",
            frontPath: "Vintage/front.png",
            backPath:"Vintage/back",
            designer: "Harshdev098",
            lnurl: "denimkangroo19@primal.net",
            label: ["Community", "Regular"],
            qr: {
                x: 137,
                y: 132,
                width: 594,
                height: 589
            },
            denomination: {
                x: 768,
                y: 392,
                fontSize: 78,
            }
        },
        {
            id: 2,
            DesignName: "Futuristic Ecash",
            frontPath: "Futuristic/front.png",
            backPath:"Futuristic/back.png",
            designer: "Harshdev098",
            lnurl: "denimkangroo19@primal.net",
            label: ["Cypherpunk", "Event"],
            qr: {
                x: 110,
                y: 214,
                width: 557,
                height: 552
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
            frontPath: "GoldenEra/front.png",
            backPath:"GoldenEra/back.png",
            designer: "Harshdev098",
            lnurl: "denimkangroo19@primal.net",
            label: ["Gifts", "Regular"],
            qr: {
                x: 178,
                y: 199,
                width: 507,
                height: 502
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
            frontPath: "Prestige/front.png",
            backPath:"Prestige/back.png",
            designer: "Harshdev098",
            lnurl: "denimkangroo19@primal.net",
            label: ["Community", "Event"],
            qr: {
                x: 1210,
                y: 274,
                width: 366,
                height: 363
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
            frontPath: "GlithLedger/front.png",
            backPath:"GlithLedger/back.png",
            designer: "Harshdev098",
            lnurl: "denimkangroo19@primal.net",
            label: ["Gifts", "Event", "Regular"],
            qr: {
                x: 125,
                y: 165,
                width: 480,
                height: 476
            },
            denomination: {
                x: 649,
                y: 393,
                fontSize: 72,
            }
        },
    ]
}

export default data;