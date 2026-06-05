import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { MenuItem } from '@/models/MenuItem';
import { Table } from '@/models/Table';
import { User } from '@/models/User';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  // Must be admin OR provide the SEED_SECRET_KEY query param
  const session  = await auth();
  const { searchParams } = new URL(req.url);
  const seedKey  = searchParams.get('key');
  const isAdmin  = (session?.user as any)?.role === 'admin';
  const validKey = seedKey && seedKey === process.env.SEED_SECRET_KEY;

  if (!isAdmin && !validKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    if (!await User.findOne({ email: 'admin@mumskitchen.com.au' })) {
      await User.create({ name: 'Admin', email: 'admin@mumskitchen.com.au', password: await bcrypt.hash('Admin@1234', 12), role: 'admin' });
    }
    await Table.deleteMany({});
    for (let i = 1; i <= 12; i++) {
      await Table.create({ tableNumber: i, capacity: i <= 4 ? 2 : i <= 9 ? 4 : 6, floor: i <= 6 ? 'Ground' : i <= 10 ? 'Upper' : 'Outdoor' });
    }
    await MenuItem.deleteMany({});
    const IMG = {
      chips:'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600',rolls:'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',dumpling:'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600',kimchi_pancake:'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600',tteok:'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600',bibimbap:'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=600',bulgogi:'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600',chicken:'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600',boneless:'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600',drumstick:'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=600',soup:'https://images.unsplash.com/photo-1547592180-85f173990554?w=600',rice_bowl:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',japchae:'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600',kimchi_fr:'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',kimchi:'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=600',rice:'https://images.unsplash.com/photo-1536304993881-ff86e0c9ef80?w=600',
    };
    const items = [
      { name:'Chips', description:'Crispy golden chips.', price:8, category:'snack', tags:['vegetarian'], images:[IMG.chips], primaryImage:IMG.chips, isFeatured:false, sortOrder:1 },
      { name:'Spring Rolls (3 pcs)', description:'Crispy spring rolls with seasoned vegetables.', price:10, category:'snack', tags:['vegetarian'], images:[IMG.rolls], primaryImage:IMG.rolls, isFeatured:false, sortOrder:2 },
      { name:'Spring Rolls (6 pcs)', description:'Crispy spring rolls with seasoned vegetables.', price:15, category:'snack', tags:['vegetarian'], images:[IMG.rolls], primaryImage:IMG.rolls, isFeatured:false, sortOrder:3 },
      { name:'Vegetable Dumplings (6 pcs)', description:'Vegetable dumplings with savoury vegetables.', price:12, category:'snack', tags:['vegetarian'], images:[IMG.dumpling], primaryImage:IMG.dumpling, isFeatured:true, sortOrder:4 },
      { name:'Vegetable Dumplings Large', description:'Large portion of vegetable dumplings.', price:18, category:'snack', tags:['vegetarian'], images:[IMG.dumpling], primaryImage:IMG.dumpling, isFeatured:false, sortOrder:5 },
      { name:'Kimchi Pancake 김치전', description:'Crispy Korean pancake with aged kimchi and spring onion.', price:25, category:'snack', tags:['spicy'], images:[IMG.kimchi_pancake], primaryImage:IMG.kimchi_pancake, isFeatured:true, sortOrder:6 },
      { name:'Tteokbokki', description:'Chewy rice cakes in sweet and spicy gochujang.', price:25, category:'snack', tags:['spicy','vegetarian'], images:[IMG.tteok], primaryImage:IMG.tteok, isFeatured:true, sortOrder:7 },
      { name:'Veg Tempura (1 pc)', description:'Light crispy vegetable tempura.', price:5, category:'snack', tags:['vegetarian'], images:[IMG.chips], primaryImage:IMG.chips, isFeatured:false, sortOrder:8 },
      { name:'Japchae 잡채', description:'Stir-fried glass noodles with vegetables and beef.', price:22, category:'noodle', tags:[], images:[IMG.japchae], primaryImage:IMG.japchae, isFeatured:true, sortOrder:10 },
      { name:'Kimchi Fried Rice', description:'Fried rice with aged kimchi — smoky and spicy.', price:20, category:'noodle', tags:['spicy'], images:[IMG.kimchi_fr], primaryImage:IMG.kimchi_fr, isFeatured:false, sortOrder:11 },
      { name:'Vegetable Bibimbap', description:'Steamed rice topped with vegetables and Korean chilli paste.', price:22, category:'bibimbap', tags:['vegetarian'], images:[IMG.bibimbap], primaryImage:IMG.bibimbap, isFeatured:false, sortOrder:20 },
      { name:'Bulgogi Beef Bibimbap', description:'Steamed rice with marinated bulgogi beef and sunny-side egg.', price:27, category:'bibimbap', tags:[], images:[IMG.bibimbap], primaryImage:IMG.bibimbap, isFeatured:true, sortOrder:21 },
      { name:'Spicy Beef Bibimbap', description:'Bibimbap topped with spicy Korean beef.', price:27, category:'bibimbap', tags:['spicy'], images:[IMG.bibimbap], primaryImage:IMG.bibimbap, isFeatured:false, sortOrder:22 },
      { name:'Bulgogi Beef Rice Bowl 불고기', description:'Thinly sliced marinated beef with soy sauce and garlic.', price:24.90, category:'rice-bowl', tags:[], images:[IMG.bulgogi], primaryImage:IMG.bulgogi, isFeatured:true, sortOrder:30 },
      { name:'Spicy Beef Rice Bowl', description:'Stir-fried beef in spicy Korean chilli sauce.', price:24.90, category:'rice-bowl', tags:['spicy'], images:[IMG.rice_bowl], primaryImage:IMG.rice_bowl, isFeatured:false, sortOrder:31 },
      { name:'Spicy Chicken Stir-Fry Rice Bowl', description:'Spicy stir-fried chicken with capsicum and carrots.', price:22.90, category:'rice-bowl', tags:['spicy'], images:[IMG.chicken], primaryImage:IMG.chicken, isFeatured:false, sortOrder:32 },
      { name:'Mild Chicken Stir-Fry Rice Bowl', description:'Mild soy-based chicken stir-fry with vegetables.', price:22.90, category:'rice-bowl', tags:[], images:[IMG.chicken], primaryImage:IMG.chicken, isFeatured:false, sortOrder:33 },
      { name:'Doenjang Jjigae 된장찌개', description:'Korean soybean paste stew with tofu and beef.', price:24, category:'soup', tags:[], images:[IMG.soup], primaryImage:IMG.soup, isFeatured:false, sortOrder:40 },
      { name:'Kimchi Jjigae 김치찌개', description:'Spicy kimchi stew with tuna and tofu.', price:24, category:'soup', tags:['spicy'], images:[IMG.soup], primaryImage:IMG.soup, isFeatured:true, sortOrder:41 },
      { name:'Chicken Wings — Original', description:'Golden crispy wings with classic seasoning.', price:19, category:'fried-chicken', tags:[], images:[IMG.chicken], primaryImage:IMG.chicken, sizes:[{label:'Small',price:19},{label:'Large',price:29}], isFeatured:false, sortOrder:50 },
      { name:'Chicken Wings — Sweet & Spicy', description:'Golden crispy wings with sweet Korean chilli glaze.', price:19, category:'fried-chicken', tags:['spicy'], images:[IMG.chicken], primaryImage:IMG.chicken, sizes:[{label:'Small',price:19},{label:'Large',price:29}], isFeatured:false, sortOrder:51 },
      { name:'Chicken Wings — Garlic Soy', description:'Golden crispy wings with garlic soy glaze.', price:19, category:'fried-chicken', tags:[], images:[IMG.chicken], primaryImage:IMG.chicken, sizes:[{label:'Small',price:19},{label:'Large',price:29}], isFeatured:true, sortOrder:52 },
      { name:'Chicken Wings — Snowy Cheese', description:'Golden crispy wings with snowy cheese powder.', price:21, category:'fried-chicken', tags:[], images:[IMG.chicken], primaryImage:IMG.chicken, sizes:[{label:'Small',price:21},{label:'Large',price:31}], isFeatured:true, sortOrder:53 },
      { name:'Chicken Drumsticks — Original', description:'Juicy fried drumsticks with crispy golden skin.', price:20, category:'fried-chicken', tags:[], images:[IMG.drumstick], primaryImage:IMG.drumstick, sizes:[{label:'Small',price:20},{label:'Large',price:30}], isFeatured:false, sortOrder:54 },
      { name:'Chicken Drumsticks — Sweet & Spicy', description:'Juicy drumsticks with sweet and spicy chilli.', price:20, category:'fried-chicken', tags:['spicy'], images:[IMG.drumstick], primaryImage:IMG.drumstick, sizes:[{label:'Small',price:20},{label:'Large',price:30}], isFeatured:false, sortOrder:55 },
      { name:'Chicken Drumsticks — Garlic Soy', description:'Juicy drumsticks with garlic soy glaze.', price:20, category:'fried-chicken', tags:[], images:[IMG.drumstick], primaryImage:IMG.drumstick, sizes:[{label:'Small',price:20},{label:'Large',price:30}], isFeatured:false, sortOrder:56 },
      { name:'Chicken Drumsticks — Snowy Cheese', description:'Juicy drumsticks with snowy cheese powder.', price:22, category:'fried-chicken', tags:[], images:[IMG.drumstick], primaryImage:IMG.drumstick, sizes:[{label:'Small',price:22},{label:'Large',price:32}], isFeatured:false, sortOrder:57 },
      { name:'Boneless Chicken — Original', description:'Crispy juicy boneless fried chicken.', price:18, category:'fried-chicken', tags:[], images:[IMG.boneless], primaryImage:IMG.boneless, sizes:[{label:'Small',price:18},{label:'Large',price:28}], isFeatured:true, sortOrder:58 },
      { name:'Boneless Chicken — Sweet & Spicy', description:'Crispy boneless chicken with sweet Korean chilli.', price:19, category:'fried-chicken', tags:['spicy'], images:[IMG.boneless], primaryImage:IMG.boneless, sizes:[{label:'Small',price:19},{label:'Large',price:27}], isFeatured:false, sortOrder:59 },
      { name:'Boneless Chicken — Garlic Soy', description:'Crispy boneless chicken with garlic soy glaze.', price:19, category:'fried-chicken', tags:[], images:[IMG.boneless], primaryImage:IMG.boneless, sizes:[{label:'Small',price:19},{label:'Large',price:28}], isFeatured:false, sortOrder:60 },
      { name:'Boneless Chicken — Snowy Cheese', description:'Crispy boneless chicken with snowy cheese powder.', price:20, category:'fried-chicken', tags:[], images:[IMG.boneless], primaryImage:IMG.boneless, sizes:[{label:'Small',price:20},{label:'Large',price:30}], isFeatured:false, sortOrder:61 },
      { name:'Kimchi', description:'Traditional fermented kimchi.', price:4, category:'side', tags:['vegan','spicy'], images:[IMG.kimchi], primaryImage:IMG.kimchi, isFeatured:false, sortOrder:70 },
      { name:'Pickled Radish', description:'Lightly pickled daikon radish.', price:4, category:'side', tags:['vegan'], images:[IMG.kimchi], primaryImage:IMG.kimchi, isFeatured:false, sortOrder:71 },
      { name:'Bean Sprout Salad', description:'Lightly seasoned Korean bean sprout salad.', price:4, category:'side', tags:['vegan'], images:[IMG.chips], primaryImage:IMG.chips, isFeatured:false, sortOrder:72 },
      { name:'Steamed Rice', description:'Perfectly steamed white rice.', price:4, category:'side', tags:['vegan','gluten-free'], images:[IMG.rice], primaryImage:IMG.rice, isFeatured:false, sortOrder:73 },
      { name:'Small Chips (side)', description:'Small portion of crispy golden chips.', price:4, category:'side', tags:['vegan'], images:[IMG.chips], primaryImage:IMG.chips, isFeatured:false, sortOrder:74 },
      { name:'Cabbage Salad', description:'Fresh crispy cabbage salad with light dressing.', price:5, category:'side', tags:['vegan'], images:[IMG.chips], primaryImage:IMG.chips, isFeatured:false, sortOrder:75 },
      { name:'Dumplings (5 pcs side)', description:'Five pan-fried vegetable dumplings.', price:11, category:'side', tags:['vegetarian'], images:[IMG.dumpling], primaryImage:IMG.dumpling, isFeatured:false, sortOrder:76 },
      { name:'Extra Bulgogi Beef', description:'Extra serving of marinated bulgogi beef.', price:10, category:'side', tags:[], images:[IMG.bulgogi], primaryImage:IMG.bulgogi, isFeatured:false, sortOrder:77 },
      { name:'Extra Spicy Beef', description:'Extra serving of spicy Korean beef.', price:10, category:'side', tags:['spicy'], images:[IMG.rice_bowl], primaryImage:IMG.rice_bowl, isFeatured:false, sortOrder:78 },
    ];
    await MenuItem.insertMany(items);
    return NextResponse.json({ message: `✅ Seeded ${items.length} menu items, 12 tables.` });
  } catch (e: any) {
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
