export const DEMO_PASSWORD = "Password1!";

export interface CustomerFixture {
    email: string;
    firstName: string;
    lastName: string;
}

export const SEED_DISCOUNT_VALID_FROM = new Date("2025-01-01T00:00:00.000Z");
export const SEED_DISCOUNT_VALID_UNTIL = new Date("2028-12-31T23:59:59.000Z");

export interface DiscountFixture {
    code: string;
    description: string;
    discountType?: "delivery" | "items";
    isPercentage: boolean;
    maxDiscountAmount?: string;
    maxUses?: number;
    maxUsesPerUser?: number;
    minSubtotal?: string;
    name: string;
    value: string;
}

export interface ProductAttributeFixture {
    name: string;
    values: string[];
}

export interface ProductTemplateFixture {
    attribute: ProductAttributeFixture;
    basePrice: string;
    categoryName: string;
    description: string;
    name: string;
}

export interface ShopAddressFixture {
    addressLine: string;
    city: string;
    country: string;
    district: string;
    latitude?: string;
    longitude?: string;
    name: string;
    state: string;
}

export interface ShopFixture {
    description: string;
    name: string;
    primaryAddress: ShopAddressFixture;
    slug: string;
}

export interface ShopOwnerFixture {
    email: string;
    firstName: string;
    lastName: string;
    shopSlug: string;
}

export interface ShopStaffFixture {
    email: string;
    firstName: string;
    lastName: string;
    shopSlug: string;
}

export interface WarehouseFixture {
    address: ShopAddressFixture;
    code: string;
    isDefault: boolean;
    name: string;
}

export const ADMIN_FIXTURE = {
    email: "admin@example.com",
    firstName: "System",
    lastName: "Admin",
} as const;

export const MODERATOR_FIXTURE = {
    email: "moderator@example.com",
    firstName: "Platform",
    lastName: "Moderator",
} as const;

export const CUSTOMER_FIXTURES: CustomerFixture[] = [
    { email: "user1@example.com", firstName: "Linh", lastName: "Nguyen" },
    { email: "user2@example.com", firstName: "Minh", lastName: "Tran" },
    { email: "user3@example.com", firstName: "An", lastName: "Le" },
    { email: "user4@example.com", firstName: "Bao", lastName: "Pham" },
    { email: "user5@example.com", firstName: "Chi", lastName: "Hoang" },
    { email: "user6@example.com", firstName: "Duy", lastName: "Vu" },
    { email: "user7@example.com", firstName: "Hanh", lastName: "Do" },
    { email: "user8@example.com", firstName: "Khang", lastName: "Bui" },
    { email: "user9@example.com", firstName: "Mai", lastName: "Dang" },
    { email: "user10@example.com", firstName: "Phuc", lastName: "Ngo" },
];

export const SHOP_FIXTURES: ShopFixture[] = [
    {
        description: "Consumer electronics, audio gear, and gadgets.",
        name: "Aurora Electronics",
        primaryAddress: {
            addressLine: "12 Le Loi",
            city: "Ho Chi Minh",
            country: "Vietnam",
            district: "District 1",
            latitude: "10.7769000",
            longitude: "106.7009000",
            name: "Aurora HQ",
            state: "Ho Chi Minh",
        },
        slug: "aurora-electronics",
    },
    {
        description: "Streetwear and everyday fashion for young adults.",
        name: "Mekong Threads",
        primaryAddress: {
            addressLine: "88 Nguyen Trai",
            city: "Ho Chi Minh",
            country: "Vietnam",
            district: "District 5",
            latitude: "10.7626000",
            longitude: "106.6602000",
            name: "Mekong Threads HQ",
            state: "Ho Chi Minh",
        },
        slug: "mekong-threads",
    },
    {
        description: "Premium cookware, small appliances, and home goods.",
        name: "Hanoi Hearth",
        primaryAddress: {
            addressLine: "21 Trang Tien",
            city: "Hanoi",
            country: "Vietnam",
            district: "Hoan Kiem",
            latitude: "21.0245000",
            longitude: "105.8412000",
            name: "Hanoi Hearth HQ",
            state: "Hanoi",
        },
        slug: "hanoi-hearth",
    },
    {
        description: "Skincare, makeup, and personal care essentials.",
        name: "Lotus Beauty",
        primaryAddress: {
            addressLine: "55 Hai Ba Trung",
            city: "Da Nang",
            country: "Vietnam",
            district: "Hai Chau",
            latitude: "16.0680000",
            longitude: "108.2208000",
            name: "Lotus Beauty HQ",
            state: "Da Nang",
        },
        slug: "lotus-beauty",
    },
    {
        description: "Outdoor gear, cycling, and camping supplies.",
        name: "Annam Outdoors",
        primaryAddress: {
            addressLine: "9 Ly Thuong Kiet",
            city: "Hue",
            country: "Vietnam",
            district: "Phu Hoi",
            latitude: "16.4637000",
            longitude: "107.5909000",
            name: "Annam Outdoors HQ",
            state: "Thua Thien Hue",
        },
        slug: "annam-outdoors",
    },
];

export const SHOP_OWNER_FIXTURES: ShopOwnerFixture[] = [
    {
        email: "owner.aurora@example.com",
        firstName: "Quang",
        lastName: "Truong",
        shopSlug: "aurora-electronics",
    },
    {
        email: "owner.mekong@example.com",
        firstName: "Thao",
        lastName: "Ly",
        shopSlug: "mekong-threads",
    },
    {
        email: "owner.hanoi@example.com",
        firstName: "Hoa",
        lastName: "Nguyen",
        shopSlug: "hanoi-hearth",
    },
    {
        email: "owner.lotus@example.com",
        firstName: "Yen",
        lastName: "Phan",
        shopSlug: "lotus-beauty",
    },
    {
        email: "owner.annam@example.com",
        firstName: "Tien",
        lastName: "Vo",
        shopSlug: "annam-outdoors",
    },
];

export const SHOP_MODERATOR_FIXTURES: ShopStaffFixture[] = [
    {
        email: "mod.aurora@example.com",
        firstName: "Cuong",
        lastName: "Phan",
        shopSlug: "aurora-electronics",
    },
    {
        email: "mod.mekong@example.com",
        firstName: "Diep",
        lastName: "Nguyen",
        shopSlug: "mekong-threads",
    },
    {
        email: "mod.hanoi@example.com",
        firstName: "Ha",
        lastName: "Le",
        shopSlug: "hanoi-hearth",
    },
    {
        email: "mod.lotus@example.com",
        firstName: "Lan",
        lastName: "Tran",
        shopSlug: "lotus-beauty",
    },
    {
        email: "mod.annam@example.com",
        firstName: "Long",
        lastName: "Ho",
        shopSlug: "annam-outdoors",
    },
];

export const SHOP_STAFF_FIXTURES: ShopStaffFixture[] = [
    {
        email: "staff.aurora1@example.com",
        firstName: "Bach",
        lastName: "Ho",
        shopSlug: "aurora-electronics",
    },
    {
        email: "staff.aurora2@example.com",
        firstName: "Dat",
        lastName: "Trinh",
        shopSlug: "aurora-electronics",
    },
    {
        email: "staff.mekong1@example.com",
        firstName: "Gia",
        lastName: "Mai",
        shopSlug: "mekong-threads",
    },
    {
        email: "staff.mekong2@example.com",
        firstName: "Huy",
        lastName: "Dinh",
        shopSlug: "mekong-threads",
    },
    {
        email: "staff.hanoi1@example.com",
        firstName: "Kim",
        lastName: "Vuong",
        shopSlug: "hanoi-hearth",
    },
    {
        email: "staff.hanoi2@example.com",
        firstName: "Lam",
        lastName: "Doan",
        shopSlug: "hanoi-hearth",
    },
    {
        email: "staff.lotus1@example.com",
        firstName: "Nhi",
        lastName: "Truong",
        shopSlug: "lotus-beauty",
    },
    {
        email: "staff.lotus2@example.com",
        firstName: "Quynh",
        lastName: "Le",
        shopSlug: "lotus-beauty",
    },
    {
        email: "staff.annam1@example.com",
        firstName: "Son",
        lastName: "Tran",
        shopSlug: "annam-outdoors",
    },
    {
        email: "staff.annam2@example.com",
        firstName: "Uyen",
        lastName: "Bui",
        shopSlug: "annam-outdoors",
    },
];

export const WAREHOUSE_FIXTURES: Record<string, WarehouseFixture[]> = {
    "annam-outdoors": [
        {
            address: {
                addressLine: "33 Le Loi",
                city: "Hue",
                country: "Vietnam",
                district: "Phu Hoi",
                name: "Annam WH Hue",
                state: "Thua Thien Hue",
            },
            code: "ANN-WH-HUE",
            isDefault: true,
            name: "Hue Central Warehouse",
        },
        {
            address: {
                addressLine: "9 Le Duan",
                city: "Da Nang",
                country: "Vietnam",
                district: "Hai Chau",
                name: "Annam WH Da Nang",
                state: "Da Nang",
            },
            code: "ANN-WH-DNG",
            isDefault: false,
            name: "Da Nang Outpost",
        },
    ],
    "aurora-electronics": [
        {
            address: {
                addressLine: "120 Cach Mang Thang 8",
                city: "Ho Chi Minh",
                country: "Vietnam",
                district: "District 3",
                name: "Aurora WH South",
                state: "Ho Chi Minh",
            },
            code: "AUR-WH-SGN",
            isDefault: true,
            name: "Saigon Central Warehouse",
        },
        {
            address: {
                addressLine: "45 Truong Chinh",
                city: "Hanoi",
                country: "Vietnam",
                district: "Dong Da",
                name: "Aurora WH North",
                state: "Hanoi",
            },
            code: "AUR-WH-HAN",
            isDefault: false,
            name: "Hanoi North Warehouse",
        },
    ],
    "hanoi-hearth": [
        {
            address: {
                addressLine: "200 Giai Phong",
                city: "Hanoi",
                country: "Vietnam",
                district: "Hoang Mai",
                name: "Hearth WH Main",
                state: "Hanoi",
            },
            code: "HAN-WH-MAIN",
            isDefault: true,
            name: "Hanoi Main Warehouse",
        },
        {
            address: {
                addressLine: "12 Pham Hung",
                city: "Hanoi",
                country: "Vietnam",
                district: "Nam Tu Liem",
                name: "Hearth WH West",
                state: "Hanoi",
            },
            code: "HAN-WH-WEST",
            isDefault: false,
            name: "Hanoi West Annex",
        },
    ],
    "lotus-beauty": [
        {
            address: {
                addressLine: "77 Bach Dang",
                city: "Da Nang",
                country: "Vietnam",
                district: "Hai Chau",
                name: "Lotus WH Da Nang",
                state: "Da Nang",
            },
            code: "LOT-WH-DNG",
            isDefault: true,
            name: "Da Nang Distribution Center",
        },
        {
            address: {
                addressLine: "210 Nguyen Hue",
                city: "Ho Chi Minh",
                country: "Vietnam",
                district: "District 1",
                name: "Lotus WH Saigon",
                state: "Ho Chi Minh",
            },
            code: "LOT-WH-SGN",
            isDefault: false,
            name: "Saigon Hub",
        },
    ],
    "mekong-threads": [
        {
            address: {
                addressLine: "300 Vo Van Tan",
                city: "Ho Chi Minh",
                country: "Vietnam",
                district: "District 3",
                name: "Mekong WH Main",
                state: "Ho Chi Minh",
            },
            code: "MEK-WH-MAIN",
            isDefault: true,
            name: "Saigon Main Warehouse",
        },
        {
            address: {
                addressLine: "5 Bui Thi Xuan",
                city: "Can Tho",
                country: "Vietnam",
                district: "Ninh Kieu",
                name: "Mekong WH Can Tho",
                state: "Can Tho",
            },
            code: "MEK-WH-CT",
            isDefault: false,
            name: "Mekong Delta Outpost",
        },
    ],
};

const COLOR_VARIANTS = ["Black", "White", "Blue"];
const SIZE_VARIANTS = ["S", "M", "L"];
const FLAVOR_VARIANTS = ["Original", "Mint", "Rose"];

export const SHOP_PRODUCT_TEMPLATES: Record<string, ProductTemplateFixture[]> =
    {
        "annam-outdoors": [
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "1290000.00",
                categoryName: "Cycling",
                description:
                    "Lightweight commuter bike helmet with MIPS liner.",
                name: "Skyline Bike Helmet",
            },
            {
                attribute: { name: "Size", values: SIZE_VARIANTS },
                basePrice: "2890000.00",
                categoryName: "Camping",
                description:
                    "Three-season 2-person dome tent, taped seams, 3000mm waterproof.",
                name: "Trailhead Dome Tent",
            },
            {
                attribute: { name: "Size", values: ["Cold", "Mild", "Warm"] },
                basePrice: "1490000.00",
                categoryName: "Camping",
                description: "Synthetic-fill sleeping bag rated to -5°C.",
                name: "Alpine Sleeping Bag",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "890000.00",
                categoryName: "Cycling",
                description: "USB-C rechargeable 1000-lumen bike headlight.",
                name: "Beacon Bike Light",
            },
            {
                attribute: { name: "Size", values: SIZE_VARIANTS },
                basePrice: "590000.00",
                categoryName: "Yoga",
                description: "6mm TPE non-slip yoga mat with carry strap.",
                name: "Lotus Yoga Mat",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "1990000.00",
                categoryName: "Fishing",
                description: "Carbon-blend 7ft spinning rod, medium action.",
                name: "Riverstone Spinning Rod",
            },
            {
                attribute: { name: "Size", values: SIZE_VARIANTS },
                basePrice: "790000.00",
                categoryName: "Team Sports",
                description:
                    "Size 5 match soccer ball with thermally bonded panels.",
                name: "Matchday Soccer Ball",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "1190000.00",
                categoryName: "Outdoor Toys",
                description:
                    "Foldable flying disc set with carry pouch, pack of 3.",
                name: "Sky Toss Disc Set",
            },
        ],
        "aurora-electronics": [
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "1999000.00",
                categoryName: "Headphones",
                description:
                    "Bluetooth 5.3 earbuds with active noise cancelling.",
                name: "Wireless Earbuds Pro",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "3490000.00",
                categoryName: "Headphones",
                description:
                    "Over-ear ANC headphones with 40h battery and USB-C fast charge.",
                name: "Studio Wireless Headphones",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "5990000.00",
                categoryName: "Smartphones",
                description:
                    "6.7-inch AMOLED, 5G, 256GB storage, dual SIM unlocked phone.",
                name: "Nova X1 Smartphone",
            },
            {
                attribute: { name: "Size", values: ["13''", "14''", "15''"] },
                basePrice: "21990000.00",
                categoryName: "Ultrabooks",
                description:
                    "Fanless aluminum ultrabook with 16GB RAM and 512GB SSD.",
                name: "Aero Slim Ultrabook",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "2890000.00",
                categoryName: "Smart Watches",
                description:
                    "Health-tracking smartwatch with GPS and SpO2 sensor.",
                name: "Pulse Smartwatch",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "12990000.00",
                categoryName: "Cameras",
                description: "24MP APS-C mirrorless camera body with kit lens.",
                name: "Vista Mirrorless Camera",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "8990000.00",
                categoryName: "Tablets",
                description:
                    "11-inch LCD tablet with stylus support and 128GB storage.",
                name: "Nova Tab 11",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "15990000.00",
                categoryName: "Gaming Laptops",
                description:
                    "RTX-equipped gaming laptop with 16GB RAM and 1TB SSD.",
                name: "Pulse Gaming Laptop",
            },
        ],
        "hanoi-hearth": [
            {
                attribute: { name: "Size", values: ["20cm", "24cm", "28cm"] },
                basePrice: "890000.00",
                categoryName: "Cookware",
                description:
                    "5-ply stainless steel non-stick frying pan, induction ready.",
                name: "ProChef Frying Pan",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "2990000.00",
                categoryName: "Appliances",
                description:
                    "Programmable 1.8L rice cooker with fuzzy logic and steam tray.",
                name: "Saigon Rice Cooker",
            },
            {
                attribute: {
                    name: "Size",
                    values: ["Single", "Queen", "King"],
                },
                basePrice: "1690000.00",
                categoryName: "Bedding",
                description:
                    "400-thread-count combed cotton sheet set, oeko-tex certified.",
                name: "Cloud Cotton Sheet Set",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "3290000.00",
                categoryName: "Lighting",
                description:
                    "Dimmable LED floor lamp with adjustable color temperature.",
                name: "Helios Floor Lamp",
            },
            {
                attribute: { name: "Size", values: ["S", "M", "L"] },
                basePrice: "1290000.00",
                categoryName: "Storage",
                description: "Stackable bamboo storage bin with linen liner.",
                name: "Bamboo Storage Bin",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "5990000.00",
                categoryName: "Furniture",
                description: "Solid oak side table with smooth-glide drawer.",
                name: "Oakline Side Table",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "2490000.00",
                categoryName: "BBQ & Grills",
                description:
                    "Compact charcoal patio grill with foldable legs and cover.",
                name: "Patio Compact Grill",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "1890000.00",
                categoryName: "Desks",
                description:
                    "Height-adjustable sit-stand desk with cable-management tray.",
                name: "Ergo Sit-Stand Desk",
            },
        ],
        "lotus-beauty": [
            {
                attribute: { name: "Size", values: ["30ml", "50ml", "100ml"] },
                basePrice: "590000.00",
                categoryName: "Skincare",
                description: "Hydrating hyaluronic acid serum for daily use.",
                name: "Glow Hydrating Serum",
            },
            {
                attribute: { name: "Color", values: FLAVOR_VARIANTS },
                basePrice: "390000.00",
                categoryName: "Makeup",
                description: "Long-wearing satin lipstick, vegan formula.",
                name: "Silk Satin Lipstick",
            },
            {
                attribute: { name: "Size", values: ["250ml", "500ml"] },
                basePrice: "320000.00",
                categoryName: "Haircare",
                description:
                    "Sulfate-free moisturizing shampoo with argan oil.",
                name: "Argan Moisture Shampoo",
            },
            {
                attribute: { name: "Color", values: FLAVOR_VARIANTS },
                basePrice: "1290000.00",
                categoryName: "Fragrance",
                description: "Eau de parfum, 50ml, floral-musk family.",
                name: "Lotus Bloom EDP",
            },
            {
                attribute: { name: "Size", values: ["200ml", "400ml"] },
                basePrice: "240000.00",
                categoryName: "Bath & Body",
                description:
                    "Gentle body wash with rice extract and shea butter.",
                name: "Rice Petal Body Wash",
            },
            {
                attribute: { name: "Size", values: ["30ml", "50ml"] },
                basePrice: "690000.00",
                categoryName: "Skincare",
                description: "Brightening vitamin C cream for nightly use.",
                name: "Citrus Night Cream",
            },
            {
                attribute: { name: "Size", values: ["60 caps", "120 caps"] },
                basePrice: "420000.00",
                categoryName: "Vitamins",
                description:
                    "Daily multivitamin with zinc, biotin, and vitamin D3.",
                name: "Daily Glow Multivitamin",
            },
            {
                attribute: { name: "Size", values: ["100ml", "200ml"] },
                basePrice: "280000.00",
                categoryName: "Personal Hygiene",
                description: "Alcohol-free mouthwash with mint and fluoride.",
                name: "Fresh Mint Mouthwash",
            },
        ],
        "mekong-threads": [
            {
                attribute: { name: "Size", values: SIZE_VARIANTS },
                basePrice: "390000.00",
                categoryName: "Shirts",
                description: "Soft-touch organic cotton crew tee, unisex fit.",
                name: "Everyday Cotton Tee",
            },
            {
                attribute: { name: "Size", values: ["28", "30", "32", "34"] },
                basePrice: "890000.00",
                categoryName: "Pants",
                description: "Slim-tapered chino with stretch waistband.",
                name: "Mekong Stretch Chino",
            },
            {
                attribute: { name: "Size", values: SIZE_VARIANTS },
                basePrice: "1290000.00",
                categoryName: "Dresses",
                description: "Linen-blend midi dress with belted waist.",
                name: "Sunrise Linen Midi Dress",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "990000.00",
                categoryName: "Bags",
                description:
                    "Recycled-canvas crossbody bag with adjustable strap.",
                name: "Trailcanvas Crossbody",
            },
            {
                attribute: {
                    name: "Size",
                    values: ["38", "39", "40", "41", "42"],
                },
                basePrice: "1490000.00",
                categoryName: "Shoes",
                description: "Lightweight knit-upper sneakers with foam sole.",
                name: "Cloudrun Knit Sneakers",
            },
            {
                attribute: { name: "Color", values: COLOR_VARIANTS },
                basePrice: "290000.00",
                categoryName: "Accessories",
                description: "Bamboo-blend bucket hat, UPF 50+.",
                name: "Bamboo Bucket Hat",
            },
            {
                attribute: { name: "Size", values: SIZE_VARIANTS },
                basePrice: "450000.00",
                categoryName: "Tops",
                description: "Ribbed knit crop top with scoop neckline.",
                name: "Ribbed Knit Crop Top",
            },
            {
                attribute: { name: "Size", values: ["S", "M", "L", "XL"] },
                basePrice: "1190000.00",
                categoryName: "Shirts",
                description:
                    "Tailored oxford button-down shirt with wrinkle-resistant finish.",
                name: "Oxford Button-Down Shirt",
            },
        ],
    };

export const PRODUCT_VARIANTS_PER_TEMPLATE = 3;

export const GLOBAL_DISCOUNT_FIXTURES: DiscountFixture[] = [
    {
        code: "GLOBAL10",
        description: "10% off item subtotals platform-wide.",
        isPercentage: true,
        maxDiscountAmount: "500000.00",
        maxUsesPerUser: 5,
        minSubtotal: "200000.00",
        name: "Global 10% Off",
        value: "10",
    },
    {
        code: "GLOBAL-100K",
        description: "Flat 100,000 VND off when order subtotal >= 1M.",
        isPercentage: false,
        maxUses: 10000,
        minSubtotal: "1000000.00",
        name: "Global 100K Off",
        value: "100000.00",
    },
    {
        code: "FREESHIP-GLOBAL",
        description: "Free standard delivery on qualifying orders.",
        discountType: "delivery",
        isPercentage: true,
        minSubtotal: "300000.00",
        name: "Global Free Shipping",
        value: "100",
    },
    {
        code: "WELCOME-5",
        description: "5% welcome discount for new shoppers.",
        isPercentage: true,
        maxDiscountAmount: "200000.00",
        maxUsesPerUser: 1,
        name: "Welcome 5%",
        value: "5",
    },
    {
        code: "GLOBAL15",
        description: "15% off item subtotals platform-wide.",
        isPercentage: true,
        maxDiscountAmount: "750000.00",
        maxUsesPerUser: 3,
        minSubtotal: "500000.00",
        name: "Global 15% Off",
        value: "15",
    },
    {
        code: "GLOBAL-250K",
        description: "Flat 250,000 VND off when order subtotal >= 2M.",
        isPercentage: false,
        maxUses: 5000,
        minSubtotal: "2000000.00",
        name: "Global 250K Off",
        value: "250000.00",
    },
    {
        code: "FREESHIP-50",
        description: "50% off standard delivery fees.",
        discountType: "delivery",
        isPercentage: true,
        minSubtotal: "150000.00",
        name: "Global Half-Price Shipping",
        value: "50",
    },
    {
        code: "STUDENT-8",
        description: "8% student discount on qualifying orders.",
        isPercentage: true,
        maxDiscountAmount: "300000.00",
        maxUsesPerUser: 10,
        minSubtotal: "100000.00",
        name: "Student 8%",
        value: "8",
    },
    {
        code: "BUNDLE20",
        description: "20% off when cart subtotal >= 1.5M.",
        isPercentage: true,
        maxDiscountAmount: "1000000.00",
        minSubtotal: "1500000.00",
        name: "Bundle 20%",
        value: "20",
    },
    {
        code: "SAVE15K",
        description: "Flat 15,000 VND off any order.",
        isPercentage: false,
        maxUsesPerUser: 20,
        minSubtotal: "50000.00",
        name: "Save 15K",
        value: "15000.00",
    },
    {
        code: "MEGA25",
        description: "25% off high-value orders, capped at 1.5M.",
        isPercentage: true,
        maxDiscountAmount: "1500000.00",
        maxUses: 2000,
        minSubtotal: "3000000.00",
        name: "Mega 25%",
        value: "25",
    },
    {
        code: "VIP-FREESHIP",
        description: "Free express delivery on VIP orders >= 5M.",
        discountType: "delivery",
        isPercentage: true,
        minSubtotal: "5000000.00",
        name: "VIP Free Shipping",
        value: "100",
    },
    {
        code: "FLASH-12",
        description: "Limited flash sale — 12% off, max 500 redemptions.",
        isPercentage: true,
        maxDiscountAmount: "400000.00",
        maxUses: 500,
        minSubtotal: "300000.00",
        name: "Flash 12%",
        value: "12",
    },
];

export const SHOP_DISCOUNT_FIXTURES: Record<string, DiscountFixture[]> = {
    "annam-outdoors": [
        {
            code: "ANNAM-OUTDOOR15",
            description: "15% off outdoor essentials.",
            isPercentage: true,
            minSubtotal: "500000.00",
            name: "Outdoor Adventure 15%",
            value: "15",
        },
        {
            code: "ANNAM-50K",
            description: "Flat 50,000 VND off any order.",
            isPercentage: false,
            name: "Annam Welcome 50K",
            value: "50000.00",
        },
    ],
    "aurora-electronics": [
        {
            code: "AURORA10",
            description: "10% off site-wide.",
            isPercentage: true,
            minSubtotal: "1000000.00",
            name: "Aurora 10%",
            value: "10",
        },
        {
            code: "AURORA-100K",
            description: "Flat 100,000 VND off when subtotal >= 1M.",
            isPercentage: false,
            minSubtotal: "1000000.00",
            name: "Aurora 100K",
            value: "100000.00",
        },
    ],
    "hanoi-hearth": [
        {
            code: "HEARTH12",
            description: "12% off home & kitchen items.",
            isPercentage: true,
            name: "Hearth 12%",
            value: "12",
        },
        {
            code: "HEARTH-75K",
            description: "Flat 75,000 VND off any cookware purchase.",
            isPercentage: false,
            minSubtotal: "300000.00",
            name: "Hearth 75K",
            value: "75000.00",
        },
    ],
    "lotus-beauty": [
        {
            code: "LOTUS20",
            description: "20% off your first beauty order.",
            isPercentage: true,
            minSubtotal: "400000.00",
            name: "Lotus Welcome 20%",
            value: "20",
        },
        {
            code: "LOTUS-40K",
            description: "Flat 40,000 VND off beauty essentials.",
            isPercentage: false,
            name: "Lotus 40K",
            value: "40000.00",
        },
    ],
    "mekong-threads": [
        {
            code: "MEKONG15",
            description: "15% off all apparel.",
            isPercentage: true,
            minSubtotal: "500000.00",
            name: "Mekong 15%",
            value: "15",
        },
        {
            code: "MEKONG-60K",
            description: "Flat 60,000 VND off apparel.",
            isPercentage: false,
            name: "Mekong 60K",
            value: "60000.00",
        },
    ],
};

export const CUSTOMER_ADDRESS_TEMPLATES: ShopAddressFixture[] = [
    {
        addressLine: "12 Tran Hung Dao",
        city: "Ho Chi Minh",
        country: "Vietnam",
        district: "District 1",
        name: "Home",
        state: "Ho Chi Minh",
    },
    {
        addressLine: "45 Ly Thai To",
        city: "Hanoi",
        country: "Vietnam",
        district: "Hoan Kiem",
        name: "Home",
        state: "Hanoi",
    },
    {
        addressLine: "78 Le Duan",
        city: "Da Nang",
        country: "Vietnam",
        district: "Hai Chau",
        name: "Home",
        state: "Da Nang",
    },
];

export const INVENTORY_BASE_QUANTITY = 100;
