const bcrypt = require('bcryptjs');
const db = require('../../src/models');

async function seed() {
  console.log('Seeding database...');

  // Create admin
  const adminExists = await db.Admin.findOne({ where: { username: 'admin' } });
  if (!adminExists) {
    await db.Admin.create({
      username: 'admin',
      password: 'admin123',
      name: '超级管理员',
      role: 'super_admin',
    });
    console.log('Admin created: admin / admin123');
  }

  // Create categories
  const categoryCount = await db.Category.count();
  if (categoryCount === 0) {
    const meat = await db.Category.create({ name: '肉类', icon: '🥩', sort_order: 1 });
    const seafood = await db.Category.create({ name: '海鲜', icon: '🦐', sort_order: 2 });
    const veggie = await db.Category.create({ name: '蔬菜', icon: '🥬', sort_order: 3 });
    const combo = await db.Category.create({ name: '套餐', icon: '🍱', sort_order: 4 });
    const tools = await db.Category.create({ name: '工具调料', icon: '🧂', sort_order: 5 });

    // Sub-categories
    await db.Category.bulkCreate([
      { name: '牛肉', parent_id: meat.id, sort_order: 1 },
      { name: '羊肉', parent_id: meat.id, sort_order: 2 },
      { name: '猪肉', parent_id: meat.id, sort_order: 3 },
      { name: '鸡肉', parent_id: meat.id, sort_order: 4 },
      { name: '鱼类', parent_id: seafood.id, sort_order: 1 },
      { name: '虾蟹', parent_id: seafood.id, sort_order: 2 },
      { name: '贝类', parent_id: seafood.id, sort_order: 3 },
      { name: '时令蔬菜', parent_id: veggie.id, sort_order: 1 },
      { name: '菌菇', parent_id: veggie.id, sort_order: 2 },
      { name: '双人套餐', parent_id: combo.id, sort_order: 1 },
      { name: '家庭套餐', parent_id: combo.id, sort_order: 2 },
      { name: '烧烤工具', parent_id: tools.id, sort_order: 1 },
      { name: '调味料', parent_id: tools.id, sort_order: 2 },
    ]);
    console.log('Categories created');
  }

  // Create sample products
  const productCount = await db.Product.count();
  if (productCount === 0) {
    const categories = await db.Category.findAll({ where: { parent_id: { [db.Sequelize.Op.ne]: 0 } } });
    const catMap = {};
    categories.forEach((c) => { catMap[c.name] = c.id; });

    const products = [
      { name: '澳洲安格斯肥牛卷', category_id: catMap['牛肉'], price: 58.00, original_price: 68.00, stock: 200, sales: 156, images: ['/images/products/beef-roll.jpg'], is_hot: 1, description: '精选澳洲安格斯牛肉，纹理清晰，肥瘦相间，烤制后口感鲜嫩多汁。' },
      { name: '和牛M5雪花牛排', category_id: catMap['牛肉'], price: 128.00, original_price: 158.00, stock: 100, sales: 89, images: ['/images/products/wagyu.jpg'], is_hot: 1, description: 'M5级和牛，丰富的雪花纹理，入口即化。' },
      { name: '新疆羊肉串（10串）', category_id: catMap['羊肉'], price: 45.00, original_price: 55.00, stock: 300, sales: 234, images: ['/images/products/lamb-skewer.jpg'], is_hot: 1, description: '精选新疆羔羊后腿肉，鲜嫩不膻，已穿串，解冻即烤。' },
      { name: '法式羊排', category_id: catMap['羊肉'], price: 89.00, original_price: 109.00, stock: 80, sales: 67, images: ['/images/products/lamb-rack.jpg'], description: '法式修切羊排，肉质细嫩，适合整块烤制。' },
      { name: '黑猪五花肉片', category_id: catMap['猪肉'], price: 35.00, original_price: 42.00, stock: 250, sales: 189, images: ['/images/products/pork-belly.jpg'], is_hot: 1, description: '黑猪五花，层次分明，烤制后焦香四溢。' },
      { name: '奥尔良鸡翅（8只）', category_id: catMap['鸡肉'], price: 32.00, original_price: 38.00, stock: 200, sales: 312, images: ['/images/products/chicken-wings.jpg'], is_hot: 1, description: '已腌制入味，解冻直接烤，方便快捷。' },
      { name: '阿根廷红虾（1kg）', category_id: catMap['虾蟹'], price: 79.00, original_price: 99.00, stock: 120, sales: 98, images: ['/images/products/red-shrimp.jpg'], is_hot: 1, description: '阿根廷野生红虾，肉质紧实弹牙，海鲜烧烤必备。' },
      { name: '鲜活大扇贝（6只）', category_id: catMap['贝类'], price: 42.00, original_price: 52.00, stock: 100, sales: 76, images: ['/images/products/scallop.jpg'], description: '新鲜大扇贝，蒜蓉粉丝烤制，鲜美无比。' },
      { name: '秋刀鱼（3条）', category_id: catMap['鱼类'], price: 28.00, original_price: 35.00, stock: 150, sales: 123, images: ['/images/products/saury.jpg'], description: '日式烤秋刀鱼经典食材，撒盐烤制即可。' },
      { name: '烤蔬菜拼盘', category_id: catMap['时令蔬菜'], price: 25.00, original_price: 30.00, stock: 200, sales: 145, images: ['/images/products/veggie-platter.jpg'], description: '含玉米、土豆、茄子、青椒、韭菜等时令蔬菜组合。' },
      { name: '烤菌菇拼盘', category_id: catMap['菌菇'], price: 38.00, original_price: 45.00, stock: 100, sales: 67, images: ['/images/products/mushroom.jpg'], description: '含杏鲍菇、金针菇、香菇等多种菌菇。' },
      { name: '双人烧烤套餐', category_id: catMap['双人套餐'], price: 168.00, original_price: 218.00, stock: 50, sales: 89, images: ['/images/products/combo-2.jpg'], is_hot: 1, description: '含牛肉卷、羊肉串、鸡翅、虾、蔬菜拼盘，适合2人享用。' },
      { name: '家庭欢聚套餐（4-6人）', category_id: catMap['家庭套餐'], price: 388.00, original_price: 488.00, stock: 30, sales: 45, images: ['/images/products/combo-family.jpg'], description: '含和牛、羊排、五花肉、海鲜、蔬菜等丰富食材，适合4-6人聚会。' },
      { name: '一次性烧烤炉', category_id: catMap['烧烤工具'], price: 29.00, original_price: 35.00, stock: 500, sales: 234, images: ['/images/products/grill.jpg'], description: '便携式一次性烧烤炉，含炭火，点燃即用。' },
      { name: '烧烤调料组合装', category_id: catMap['调味料'], price: 18.00, original_price: 25.00, stock: 300, sales: 198, images: ['/images/products/seasoning.jpg'], description: '含孜然粉、辣椒粉、烧烤酱、食用油等基础调料。' },
    ];

    for (const p of products) {
      const product = await db.Product.create(p);
      // Add specs for meat products
      if (['牛肉', '羊肉', '猪肉'].includes(categories.find((c) => c.id === p.category_id)?.name)) {
        await db.ProductSpec.bulkCreate([
          { product_id: product.id, name: '500g', price: p.price, stock: Math.floor(p.stock / 2) },
          { product_id: product.id, name: '1kg', price: p.price * 1.8, stock: Math.floor(p.stock / 2) },
        ]);
      }
    }
    console.log('Sample products created');
  }

  // Create settings
  const settingCount = await db.Setting.count();
  if (settingCount === 0) {
    await db.Setting.bulkCreate([
      { key: 'shop_name', value: '"烤乐汇"', description: '店铺名称' },
      { key: 'shop_phone', value: '"400-888-8888"', description: '客服电话' },
      { key: 'delivery_fee', value: '8', description: '配送费（元）' },
      { key: 'free_delivery_amount', value: '99', description: '免配送费金额（元）' },
      { key: 'min_order_amount', value: '30', description: '起送金额（元）' },
      { key: 'business_hours', value: '"09:00-22:00"', description: '营业时间' },
    ]);
    console.log('Settings created');
  }

  console.log('Seed completed!');
}

module.exports = seed;
