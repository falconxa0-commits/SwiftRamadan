import { NextResponse } from 'next/server';

const products = [
  {
    id: 1,
    name: "The Ultimate Ramadan Box",
    description: "5kg Premium Rice, Premium Cooking Oil, Premium Dates, Fresh Fruit Box, Spices Collection",
    originalPrice: 45000,
    salePrice: 38500,
    category: "bundles",
    rating: 4.9,
    reviews: 234,
    deliveryTime: "25-35 min",
    inStock: true,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDG-woRAd802fJcw48RxkkxuELsoRV6Ph4CObXRt0x1-QWb-UnfoVwzHihiMZPFYGCrxWCMiZir7caTYigHpdY2vF_dSd-FSvApxK1ZWGJZEzJAWeJhHxA6pvwMhQ8ghuu7SF0R1zqjEsAtN3oTykc6Nnu_YDEaKwN0C-wA7K0dvX68F3xoZQW7csOuq4uLe6he2FVb1qzUcsuOwy9Lvy9MoxYLLLyVqu6RMBbf6przYvvdnhH-MUabZeZBs8GqU3GjlHWIQox3dMm_",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuApJL7B-fREejbKAcsyarBHVP90L7SiEtcx74UcnDjHQHqDHgsh6zbrOgeigmuWbj0v8KqbGT0_uDvidu9eD8UepNgL9ml5MjRKJ_5g5eZK9oA9DG0gWukfA8-nFYmUfxOipzJTxz7QJKHjQb7AgZLLePNsLO5Fddpdc2cltWurWnt_T2g7oMHK6m0Qj2OWOweV1YVC9qznb6v4-OEeH0i5WxwLxnfKh4dRWHaHvyvwwIwM0oTct5iPbDrA1mjs-cl6scP06lXs1yOW",
    ],
  },
  {
    id: 2,
    name: "Spicy Gizdodo",
    description: "Savor the richness of gizzard and dodo with special spices. A Nigerian classic prepared with love.",
    price: 4200,
    category: "meals",
    rating: 4.8,
    reviews: 156,
    deliveryTime: "15-20 min",
    inStock: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDChx0mA0AKkpX0y4_D3ZvRedVOC8Q4R9DfC1JFiHl-QaE9c0LVkF9fciAcv4ZI0hHdM1tv7OwOM7U4lSn0beqDz3xsF-1PbAl4BSW5XiaTpQ1uiw0tty1iT_KRCmf5PxynaIBCrxogrPGrg3rjx6XfquVJp5usgebTIrX8jKco6PFU8tdaqBpUZSvWqVTCXoFb91WHhb-vZ_TJyIW3hlqyMAM8nr4_WYrcSaZDJ1GmI50H7emLukMjfHQ2tpIts2NrGT1DcUacybcC",
  },
  {
    id: 3,
    name: "Smoky Party Jollof",
    description: "Double portion with our signature fried chicken. The party jollof everyone talks about!",
    price: 5500,
    category: "meals",
    rating: 4.9,
    reviews: 289,
    deliveryTime: "25-30 min",
    inStock: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbadRO9KKVMJDfKM7i--DcGxX21brakAeRIViaUHdEKsUmaGHfisguWgn0fSskLZ2kelAhPoXINcpij_oG1Sqm2FX0ydDUapFCx9oLGvoLuv5DB1WB1uRHhQ7K8_XSF5Cm6Xz9EET2uQJyn4y5Ne-NMY5BfXEJc6Feg_1N6l-6fRu61Og6WhS5Akv11pB-zAai1xGCH0SfJNTBHZWxKev4360u2jslAZXAZv-E0VHGvEx3FK653NkTqacNrJjdu9ZeuKv0GW5HeF7H",
  },
  {
    id: 4,
    name: "Dates & Fruit Box",
    description: "Premium Medjool dates paired with seasonal fresh fruits. Perfect for Iftar.",
    price: 8500,
    salePrice: 5900,
    category: "bundles",
    rating: 4.7,
    reviews: 98,
    deliveryTime: "20-25 min",
    inStock: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuApJL7B-fREejbKAcsyarBHVP90L7SiEtcx74UcnDjHQHqDHgsh6zbrOgeigmuWbj0v8KqbGT0_uDvidu9eD8UepNgL9ml5MjRKJ_5g5eZK9oA9DG0gWukfA8-nFYmUfxOipzJTxz7QJKHjQb7AgZLLePNsLO5Fddpdc2cltWurWnt_T2g7oMHK6m0Qj2OWOweV1YVC9qznb6v4-OEeH0i5WxwLxnfKh4dRWHaHvyvwwIwM0oTct5iPbDrA1mjs-cl6scP06lXs1yOW",
  },
  {
    id: 5,
    name: "Suya Platter",
    description: "Spicy grilled beef with fresh onions and tomatoes. A Lagos street food classic.",
    price: 3800,
    category: "meals",
    rating: 4.7,
    reviews: 203,
    deliveryTime: "20-25 min",
    inStock: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmArJK-MpkfyRLnF_ibqAF8amfOitmiqz2cL4YtLj_KJDuKjoQvHjVcwVeMW8aF1w3zZc0II6Zw_W0kH02F53-DX10-i6uCFR7jli0WzbxHGGzjr_dQ1CM0pmYEVDRvd6yt2CEpLVEaf6QJcvfa9ZphbYhoTuyybLhZtXESxoSIRP5gMTil0c4RwAiwb16MV1DcvwSTVW0LEUUIBlvLij2XzHCVyQ0XJZQ6HJbl-3JZF8YQnvumXy_AxfXe0AXoZsMUWvKF4wGk2Sl",
  },
];

export async function GET() {
  return NextResponse.json({ products });
}
