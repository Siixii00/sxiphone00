const FARM_DATA = {
    CROPS: {
        turnip: {
            name: 'Turnip',
            nameZh: '蕪菁',
            growDays: 3,
            sellPrice: 60,
            seedPrice: 20,
            stages: [
                { color: '#4a6a2a', height: 2 },
                { color: '#5a8a3a', height: 4 },
                { color: '#f4e8c1', height: 6 }
            ],
            unlockLevel: 1
        },
        tomato: {
            name: 'Tomato',
            nameZh: '番茄',
            growDays: 5,
            sellPrice: 120,
            seedPrice: 50,
            stages: [
                { color: '#4a6a2a', height: 2 },
                { color: '#5a8a3a', height: 5 },
                { color: '#c44a4a', height: 8 }
            ],
            unlockLevel: 4
        },
        pumpkin: {
            name: 'Pumpkin',
            nameZh: '南瓜',
            growDays: 8,
            sellPrice: 250,
            seedPrice: 100,
            stages: [
                { color: '#4a6a2a', height: 3 },
                { color: '#5a8a3a', height: 6 },
                { color: '#e8a030', height: 10 }
            ],
            unlockLevel: 7
        },
        corn: {
            name: 'Corn',
            nameZh: '玉米',
            growDays: 6,
            sellPrice: 150,
            seedPrice: 60,
            stages: [
                { color: '#4a6a2a', height: 3 },
                { color: '#5a8a3a', height: 7 },
                { color: '#f4e830', height: 10 }
            ],
            unlockLevel: 4
        },
        strawberry: {
            name: 'Strawberry',
            nameZh: '草莓',
            growDays: 7,
            sellPrice: 200,
            seedPrice: 80,
            stages: [
                { color: '#4a6a2a', height: 2 },
                { color: '#5a8a3a', height: 4 },
                { color: '#e84060', height: 6 }
            ],
            unlockLevel: 7
        },
        sunflower: {
            name: 'Sunflower',
            nameZh: '向日葵',
            growDays: 4,
            sellPrice: 80,
            seedPrice: 30,
            stages: [
                { color: '#4a6a2a', height: 3 },
                { color: '#5a8a3a', height: 6 },
                { color: '#ffd700', height: 10 }
            ],
            unlockLevel: 9
        },
        tulip: {
            name: 'Tulip',
            nameZh: '鬱金香',
            growDays: 5,
            sellPrice: 100,
            seedPrice: 40,
            stages: [
                { color: '#4a6a2a', height: 2 },
                { color: '#5a8a3a', height: 5 },
                { color: '#e860a0', height: 8 }
            ],
            unlockLevel: 9
        }
    },
    
    ANIMALS: {
        chicken: {
            name: 'Chicken',
            nameZh: '雞',
            price: 200,
            product: 'Egg',
            productNameZh: '蛋',
            productPrice: 50,
            productInterval: 1,
            feedCost: 10,
            unlockLevel: 2
        },
        cow: {
            name: 'Cow',
            nameZh: '牛',
            price: 500,
            product: 'Milk',
            productNameZh: '牛奶',
            productPrice: 100,
            productInterval: 1,
            feedCost: 20,
            unlockLevel: 5
        },
        sheep: {
            name: 'Sheep',
            nameZh: '羊',
            price: 400,
            product: 'Wool',
            productNameZh: '羊毛',
            productPrice: 150,
            productInterval: 3,
            feedCost: 15,
            unlockLevel: 8
        }
    },
    
    SHOP_ITEMS: {
        seeds: ['turnip', 'tomato', 'pumpkin', 'corn', 'strawberry', 'sunflower', 'tulip'],
        animals: ['chicken', 'cow', 'sheep'],
        upgrades: [
            { id: 'sprinkler', name: 'Sprinkler', nameZh: '灑水器', price: 1000, unlockLevel: 6 },
            { id: 'barn', name: 'Barn Expansion', nameZh: '穀倉擴建', price: 2000, unlockLevel: 3 }
        ]
    },
    
    LEVEL_THRESHOLDS: [0, 500, 1500, 3000, 5000, 8000, 12000, 18000, 25000, 35000],
    
    WEATHER_TYPES: {
        sunny: { name: 'Sunny', nameZh: '晴天', icon: 'sun' },
        cloudy: { name: 'Cloudy', nameZh: '陰天', icon: 'cloud' },
        rainy: { name: 'Rainy', nameZh: '雨天', icon: 'cloud-rain' },
        stormy: { name: 'Stormy', nameZh: '暴風雨', icon: 'cloud-lightning' }
    },
    
    BUILDINGS: {
        farmhouse: { x: 1, y: 1, w: 4, h: 3, color: '#c44a4a' },
        coop: { x: 15, y: 1, w: 3, h: 2, color: '#8b4513', unlockLevel: 2 },
        barn: { x: 15, y: 10, w: 4, h: 3, color: '#a0522d', unlockLevel: 5 },
        shop: { x: 1, y: 11, w: 3, h: 2, color: '#4a90c2' }
    },
    
    MAP_WIDTH: 20,
    MAP_HEIGHT: 15,
    TILE_SIZE: 16
};