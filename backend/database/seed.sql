-- 初始化测试数据脚本
-- 用于开发环境填充测试数据

USE bbq_shop;

-- 插入测试商品
INSERT INTO products (category_id, name, description, images, price, original_price, stock, sales, status, is_hot, sort) VALUES
-- 肉类
(1, '羊肉串', '新鲜羊肉，已腌制，每串约 50g', '["/images/products/lamb-skewer-1.jpg", "/images/products/lamb-skewer-2.jpg"]', 599, 799, 500, 1280, 1, 1, 1),
(1, '牛肉串', '优质牛肉，秘制调料腌制', '["/images/products/beef-skewer-1.jpg"]', 699, 899, 300, 856, 1, 1, 2),
(1, '五花肉', '精选猪五花肉，切片装 500g', '["/images/products/pork-belly-1.jpg"]', 2999, 3599, 200, 432, 1, 0, 3),
(1, '鸡翅中', '冷冻鸡翅中，500g 装', '["/images/products/chicken-wing-1.jpg"]', 3499, 3999, 150, 623, 1, 1, 4),
(1, '骨肉相连', '鸡胸肉串，10 串装', '["/images/products/chicken-bone-1.jpg"]', 1999, 2499, 250, 345, 1, 0, 5),

-- 海鲜
(2, '烤鱿鱼', '新鲜鱿鱼须，200g 装', '["/images/products/squid-1.jpg"]', 2499, 2999, 100, 234, 1, 1, 1),
(2, '基围虾', '鲜活基围虾，500g 装', '["/images/products/shrimp-1.jpg"]', 4999, 5999, 80, 189, 1, 0, 2),
(2, '扇贝', '蒜蓉粉丝扇贝，6 只装', '["/images/products/scallop-1.jpg"]', 3999, 4599, 120, 156, 1, 0, 3),
(2, '秋刀鱼', '冷冻秋刀鱼，5 条装', '["/images/products/saury-1.jpg"]', 1999, 2399, 200, 278, 1, 0, 4),

-- 蔬菜
(3, '土豆片', '新鲜土豆切片，300g 装', '["/images/products/potato-1.jpg"]', 599, 799, 400, 567, 1, 0, 1),
(3, '韭菜', '新鲜韭菜，200g 装', '["/images/products/leek-1.jpg"]', 399, 499, 300, 423, 1, 0, 2),
(3, '金针菇', '新鲜金针菇，300g 装', '["/images/products/enoki-1.jpg"]', 499, 599, 350, 389, 1, 0, 3),
(3, '茄子', '长茄子，2 根装', '["/images/products/eggplant-1.jpg"]', 699, 899, 250, 312, 1, 0, 4),
(3, '玉米', '甜玉米，3 根装', '["/images/products/corn-1.jpg"]', 999, 1299, 200, 445, 1, 1, 5),
(3, '青椒', '菜椒，300g 装', '["/images/products/pepper-1.jpg"]', 499, 599, 300, 234, 1, 0, 6),

-- 丸子类
(4, '牛肉丸', '手打牛肉丸，250g 装', '["/images/products/beef-ball-1.jpg"]', 1999, 2399, 180, 345, 1, 0, 1),
(4, '鱼丸', '潮汕鱼丸，250g 装', '["/images/products/fish-ball-1.jpg"]', 1599, 1899, 200, 289, 1, 0, 2),
(4, '亲亲肠', '台湾烤肠，10 根装', '["/images/products/sausage-1.jpg"]', 1799, 2199, 250, 567, 1, 1, 3),
(4, '蟹柳', '即食蟹柳，200g 装', '["/images/products/crab-stick-1.jpg"]', 1299, 1599, 220, 178, 1, 0, 4),
(4, '年糕', '韩式年糕，300g 装', '["/images/products/rice-cake-1.jpg"]', 899, 1099, 300, 234, 1, 0, 5),

-- 调料
(5, '烧烤酱', '秘制烧烤酱，200g 装', '["/images/products/bbq-sauce-1.jpg"]', 1299, 1599, 150, 456, 1, 0, 1),
(5, '孜然粉', '新疆孜然粉，50g 装', '["/images/products/cumin-1.jpg"]', 599, 799, 200, 389, 1, 0, 2),
(5, '辣椒粉', '特辣辣椒粉，50g 装', '["/images/products/chili-1.jpg"]', 499, 699, 250, 312, 1, 0, 3),
(5, '烧烤刷', '硅胶油刷，2 支装', '["/images/products/brush-1.jpg"]', 999, 1299, 100, 123, 1, 0, 4),
(5, '锡纸', '加厚锡纸，10m 装', '["/images/products/foil-1.jpg"]', 799, 999, 150, 234, 1, 0, 5),

-- 酒水
(6, '可乐', '可口可乐，330ml*6 罐', '["/images/products/coke-1.jpg"]', 1599, 1899, 300, 678, 1, 0, 1),
(6, '雪碧', '雪碧，330ml*6 罐', '["/images/products/sprite-1.jpg"]', 1599, 1899, 280, 534, 1, 0, 2),
(6, '啤酒', '青岛啤酒，500ml*6 罐', '["/images/products/beer-1.jpg"]', 3999, 4599, 200, 445, 1, 1, 3),
(6, '果汁', '鲜橙汁，1L 装', '["/images/products/juice-1.jpg"]', 1299, 1599, 150, 267, 1, 0, 4);

-- 插入测试用户
INSERT INTO users (openid, nickname, avatar, phone) VALUES
('wx_openid_test_001', '张三', '/images/avatars/user1.jpg', '13800138001'),
('wx_openid_test_002', '李四', '/images/avatars/user2.jpg', '13800138002'),
('wx_openid_test_003', '王五', '/images/avatars/user3.jpg', '13800138003');

-- 插入测试地址
INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default) VALUES
(1, '张三', '13800138001', '广东省', '深圳市', '南山区', '科技园南区 A 栋 101', 1),
(2, '李四', '13800138002', '广东省', '深圳市', '福田区', '会展中心 B 栋 202', 1),
(3, '王五', '13800138003', '广东省', '深圳市', '宝安区', '宝安中心 C 栋 303', 1);

-- 插入测试订单
INSERT INTO orders (order_no, user_id, total_amount, pay_amount, freight_amount, status, remark, receiver_name, receiver_phone, receiver_address, paid_at) VALUES
('ORD202602270001', 1, 15980, 15980, 0, 3, '请尽快发货', '张三', '13800138001', '广东省深圳市南山区科技园南区 A 栋 101', '2026-02-26 10:30:00'),
('ORD202602270002', 2, 8990, 8990, 0, 2, '', '李四', '13800138002', '广东省深圳市福田区会展中心 B 栋 202', '2026-02-26 14:20:00'),
('ORD202602270003', 1, 25970, 25970, 0, 1, '多加点辣椒', '张三', '13800138001', '广东省深圳市南山区科技园南区 A 栋 101', '2026-02-27 09:15:00'),
('ORD202602270004', 3, 5990, 5990, 0, 0, '', '王五', '13800138003', '广东省深圳市宝安区中心 C 栋 303', NULL);

-- 插入订单商品
INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity) VALUES
(1, 1, '羊肉串', '/images/products/lamb-skewer-1.jpg', 599, 10),
(1, 4, '鸡翅中', '/images/products/chicken-wing-1.jpg', 3499, 2),
(1, 13, '玉米', '/images/products/corn-1.jpg', 999, 5),
(2, 6, '烤鱿鱼', '/images/products/squid-1.jpg', 2499, 2),
(2, 19, '亲亲肠', '/images/products/sausage-1.jpg', 1799, 2),
(2, 25, '可乐', '/images/products/coke-1.jpg', 1599, 1),
(3, 2, '牛肉串', '/images/products/beef-skewer-1.jpg', 699, 15),
(3, 3, '五花肉', '/images/products/pork-belly-1.jpg', 2999, 4),
(3, 7, '基围虾', '/images/products/shrimp-1.jpg', 4999, 2),
(4, 10, '土豆片', '/images/products/potato-1.jpg', 599, 5),
(4, 11, '韭菜', '/images/products/leek-1.jpg', 399, 5);

-- 插入库存流水
INSERT INTO stock_logs (product_id, change_qty, before_stock, after_stock, reason, reference_type, reference_id) VALUES
(1, -10, 510, 500, '下单', 'order', 1),
(4, -2, 152, 150, '下单', 'order', 1),
(13, -5, 205, 200, '下单', 'order', 1),
(6, -2, 102, 100, '下单', 'order', 2),
(19, -2, 252, 250, '下单', 'order', 2),
(25, -1, 301, 300, '下单', 'order', 2),
(2, -15, 315, 300, '下单', 'order', 3),
(3, -4, 204, 200, '下单', 'order', 3),
(7, -2, 82, 80, '下单', 'order', 3);
