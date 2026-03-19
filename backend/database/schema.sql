-- 烧烤食材售卖系统数据库脚本
-- MySQL 8.0+
-- 创建时间：2026-02-27

-- 创建数据库
CREATE DATABASE IF NOT EXISTS bbq_shop DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bbq_shop;

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(128) NOT NULL COMMENT '密码 (bcrypt 加密)',
    role VARCHAR(32) DEFAULT 'admin' COMMENT '角色',
    status TINYINT DEFAULT 1 COMMENT '状态 1 启用 0 禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    openid VARCHAR(64) NOT NULL UNIQUE COMMENT '微信 openid',
    session_key VARCHAR(128) COMMENT '微信 session_key',
    nickname VARCHAR(64) COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像 URL',
    phone VARCHAR(20) COMMENT '手机号',
    status TINYINT DEFAULT 1 COMMENT '状态 1 正常 0 禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_openid (openid),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 商品分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL COMMENT '分类名称',
    icon VARCHAR(255) COMMENT '分类图标',
    sort INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态 1 启用 0 禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sort (sort),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品分类表';

-- 商品表
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL COMMENT '分类 ID',
    name VARCHAR(128) NOT NULL COMMENT '商品名称',
    description TEXT COMMENT '商品描述',
    images JSON COMMENT '图片 URLs',
    price DECIMAL(10,2) NOT NULL COMMENT '价格 (分)',
    original_price DECIMAL(10,2) COMMENT '原价 (分)',
    stock INT DEFAULT 0 COMMENT '库存',
    sales INT DEFAULT 0 COMMENT '销量',
    status TINYINT DEFAULT 1 COMMENT '状态 1 上架 0 下架',
    is_hot TINYINT DEFAULT 0 COMMENT '是否热销',
    sort INT DEFAULT 0 COMMENT '排序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_hot (is_hot),
    INDEX idx_sort (sort),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- 收货地址表
CREATE TABLE IF NOT EXISTS addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    name VARCHAR(64) NOT NULL COMMENT '收货人姓名',
    phone VARCHAR(20) NOT NULL COMMENT '手机号',
    province VARCHAR(64) COMMENT '省',
    city VARCHAR(64) COMMENT '市',
    district VARCHAR(64) COMMENT '区',
    detail VARCHAR(255) NOT NULL COMMENT '详细地址',
    is_default TINYINT DEFAULT 0 COMMENT '是否默认地址',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_default (is_default),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收货地址表';

-- 购物车表
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    product_id BIGINT NOT NULL COMMENT '商品 ID',
    quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
    checked TINYINT DEFAULT 1 COMMENT '是否选中 1 是 0 否',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_product (user_id, product_id),
    INDEX idx_user (user_id),
    INDEX idx_checked (checked),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(32) NOT NULL UNIQUE COMMENT '订单号',
    user_id BIGINT NOT NULL COMMENT '用户 ID',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '订单总额 (分)',
    pay_amount DECIMAL(10,2) NOT NULL COMMENT '实付金额 (分)',
    freight_amount DECIMAL(10,2) DEFAULT 0 COMMENT '运费 (分)',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '订单状态 0 待付款 1 待发货 2 待收货 3 已完成 4 已取消',
    remark VARCHAR(255) COMMENT '用户备注',
    receiver_name VARCHAR(64) NOT NULL COMMENT '收货人姓名',
    receiver_phone VARCHAR(20) NOT NULL COMMENT '收货人电话',
    receiver_address VARCHAR(255) NOT NULL COMMENT '收货地址',
    logistics_no VARCHAR(64) COMMENT '物流单号',
    logistics_company VARCHAR(64) COMMENT '物流公司',
    paid_at DATETIME COMMENT '支付时间',
    shipped_at DATETIME COMMENT '发货时间',
    completed_at DATETIME COMMENT '完成时间',
    cancelled_at DATETIME COMMENT '取消时间',
    cancel_reason VARCHAR(255) COMMENT '取消原因',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_no (order_no),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 订单商品表
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL COMMENT '订单 ID',
    product_id BIGINT NOT NULL COMMENT '商品 ID',
    product_name VARCHAR(128) NOT NULL COMMENT '商品名称',
    product_image VARCHAR(255) COMMENT '商品图片',
    price DECIMAL(10,2) NOT NULL COMMENT '单价 (分)',
    quantity INT NOT NULL COMMENT '数量',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单商品表';

-- 库存流水表
CREATE TABLE IF NOT EXISTS stock_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL COMMENT '商品 ID',
    change_qty INT NOT NULL COMMENT '变动数量 (+/-)',
    before_stock INT NOT NULL COMMENT '变动前库存',
    after_stock INT NOT NULL COMMENT '变动后库存',
    reason VARCHAR(64) NOT NULL COMMENT '原因 下单/取消/手动调整/退货',
    reference_type VARCHAR(32) COMMENT '关联类型 order/admin',
    reference_id BIGINT COMMENT '关联 ID',
    operator_id BIGINT COMMENT '操作人 ID',
    remark VARCHAR(255) COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product (product_id),
    INDEX idx_reference (reference_type, reference_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存流水表';

-- 系统配置表
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(64) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type VARCHAR(32) DEFAULT 'string' COMMENT '配置类型',
    remark VARCHAR(255) COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT COMMENT '管理员 ID',
    action VARCHAR(64) NOT NULL COMMENT '操作动作',
    module VARCHAR(64) COMMENT '模块',
    method VARCHAR(16) COMMENT '请求方法',
    path VARCHAR(255) COMMENT '请求路径',
    params JSON COMMENT '请求参数',
    ip VARCHAR(64) COMMENT 'IP 地址',
    user_agent VARCHAR(255) COMMENT 'User-Agent',
    status INT COMMENT '响应状态',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin (admin_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 初始化数据

-- 插入默认管理员 (密码：admin123, bcrypt 加密)
-- 密码哈希生成方式：bcrypt.hash('admin123', 10)
-- 注意：首次部署时请修改默认密码！
INSERT INTO admins (username, password, role, status) VALUES 
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'super_admin', 1);

-- 插入商品分类
INSERT INTO categories (name, icon, sort, status) VALUES 
('肉类食材', '/images/categories/meat.png', 1, 1),
('海鲜食材', '/images/categories/seafood.png', 2, 1),
('蔬菜食材', '/images/categories/vegetable.png', 3, 1),
('丸子类', '/images/categories/balls.png', 4, 1),
('调料类', '/images/categories/sauce.png', 5, 1),
('酒水饮料', '/images/categories/drink.png', 6, 1);

-- 插入系统配置
INSERT INTO settings (config_key, config_value, config_type, remark) VALUES 
('wx_appid', '', 'string', '微信小程序 AppID'),
('wx_secret', '', 'string', '微信小程序 Secret'),
('wx_mchid', '', 'string', '微信商户号'),
('wx_apikey', '', 'string', '微信 API 密钥'),
('freight_amount', '0', 'number', '运费 (分)'),
('free_freight_amount', '9900', 'number', '包邮门槛 (分)'),
('stock_warning', '10', 'number', '库存预警值');

-- 创建视图：订单统计
CREATE OR REPLACE VIEW v_order_stats AS
SELECT 
    DATE(created_at) as stat_date,
    COUNT(*) as total_orders,
    SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as unpaid_orders,
    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as pending_ship_orders,
    SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as pending_recv_orders,
    SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as completed_orders,
    SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as cancelled_orders,
    SUM(CASE WHEN status = 3 THEN total_amount ELSE 0 END) / 100 as total_revenue
FROM orders
GROUP BY DATE(created_at);

-- 创建存储过程：更新商品销量
DELIMITER $$
CREATE PROCEDURE update_product_sales(IN p_order_id BIGINT)
BEGIN
    UPDATE products p
    INNER JOIN order_items oi ON p.id = oi.product_id
    SET p.sales = p.sales + oi.quantity
    WHERE oi.order_id = p_order_id;
END$$
DELIMITER ;

-- 创建触发器：订单创建后扣减库存
DELIMITER $$
CREATE TRIGGER trg_order_stock_after_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 1 THEN
        UPDATE products p
        INNER JOIN order_items oi ON p.id = oi.product_id
        SET p.stock = p.stock - oi.quantity
        WHERE oi.order_id = NEW.id;
        
        INSERT INTO stock_logs (product_id, change_qty, before_stock, after_stock, reason, reference_type, reference_id)
        SELECT oi.product_id, -oi.quantity, p.stock + oi.quantity, p.stock, '下单', 'order', NEW.id
        FROM order_items oi
        INNER JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = NEW.id;
    END IF;
END$$
DELIMITER ;
