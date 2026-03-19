-- 烧烤食材售卖系统数据库脚本 (MySQL 版本)
-- 创建时间：2026-02-27
-- 字符集：utf8mb4，支持中文及 emoji

CREATE DATABASE IF NOT EXISTS bbq_shop DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bbq_shop;

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL UNIQUE COMMENT '管理员用户名',
    password VARCHAR(128) NOT NULL COMMENT '加密密码',
    role VARCHAR(32) DEFAULT 'admin' COMMENT '角色：admin/super_admin',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(64) NOT NULL UNIQUE COMMENT '微信 openid',
    session_key VARCHAR(128) COMMENT '微信 session_key',
    nickname VARCHAR(64) COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像 URL',
    phone VARCHAR(20) COMMENT '手机号',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 商品分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(64) NOT NULL COMMENT '分类名称',
    icon VARCHAR(255) COMMENT '分类图标',
    sort INT DEFAULT 0 COMMENT '排序权重，越小越靠前',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- 商品表
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL COMMENT '分类ID',
    name VARCHAR(128) NOT NULL COMMENT '商品名称',
    description TEXT COMMENT '商品描述',
    images TEXT COMMENT '商品图片 JSON 数组',
    price DECIMAL(10,2) NOT NULL COMMENT '售价（分）',
    original_price DECIMAL(10,2) COMMENT '原价（分）',
    stock INT DEFAULT 0 COMMENT '库存数量',
    sales INT DEFAULT 0 COMMENT '销量',
    status TINYINT DEFAULT 1 COMMENT '状态：0下架 1上架',
    is_hot TINYINT DEFAULT 0 COMMENT '是否热销：0否 1是',
    sort INT DEFAULT 0 COMMENT '排序权重',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- 收货地址表
CREATE TABLE IF NOT EXISTS addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(64) NOT NULL COMMENT '收货人姓名',
    phone VARCHAR(20) NOT NULL COMMENT '收货人电话',
    province VARCHAR(64) COMMENT '省份',
    city VARCHAR(64) COMMENT '城市',
    district VARCHAR(64) COMMENT '区/县',
    detail VARCHAR(255) NOT NULL COMMENT '详细地址',
    is_default TINYINT DEFAULT 0 COMMENT '是否默认地址：0否 1是',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收货地址表';

-- 购物车表
CREATE TABLE IF NOT EXISTS cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    product_id INT NOT NULL COMMENT '商品ID',
    quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
    checked TINYINT DEFAULT 1 COMMENT '是否选中：0否 1是',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_product (user_id, product_id),
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(32) NOT NULL UNIQUE COMMENT '订单号',
    user_id INT NOT NULL COMMENT '用户ID',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '商品总金额（分）',
    pay_amount DECIMAL(10,2) NOT NULL COMMENT '实付金额（分）',
    freight_amount DECIMAL(10,2) DEFAULT 0 COMMENT '运费（分）',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0待付款 1待发货 2待收货 3已完成 4已取消',
    remark VARCHAR(255) COMMENT '买家备注',
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
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 订单商品表
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL COMMENT '订单ID',
    product_id INT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(128) NOT NULL COMMENT '商品名称（快照）',
    product_image VARCHAR(255) COMMENT '商品图片（快照）',
    price DECIMAL(10,2) NOT NULL COMMENT '商品单价（快照，分）',
    quantity INT NOT NULL COMMENT '购买数量',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单商品快照表';

-- 库存流水表
CREATE TABLE IF NOT EXISTS stock_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL COMMENT '商品ID',
    change_qty INT NOT NULL COMMENT '变动数量（正增负减）',
    before_stock INT NOT NULL COMMENT '变动前库存',
    after_stock INT NOT NULL COMMENT '变动后库存',
    reason VARCHAR(64) NOT NULL COMMENT '变动原因',
    reference_type VARCHAR(32) COMMENT '关联类型：order/admin',
    reference_id INT COMMENT '关联ID',
    operator_id INT COMMENT '操作人ID（管理员）',
    remark VARCHAR(255) COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product (product_id),
    CONSTRAINT fk_stock_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存流水表';

-- 系统配置表
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(64) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type VARCHAR(32) DEFAULT 'string' COMMENT '值类型',
    remark VARCHAR(255) COMMENT '说明',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT COMMENT '操作管理员ID',
    action VARCHAR(64) NOT NULL COMMENT '操作动作',
    module VARCHAR(64) COMMENT '模块',
    method VARCHAR(16) COMMENT 'HTTP 方法',
    path VARCHAR(255) COMMENT '请求路径',
    params TEXT COMMENT '请求参数',
    ip VARCHAR(64) COMMENT '操作IP',
    user_agent VARCHAR(255) COMMENT 'UA',
    status INT COMMENT 'HTTP 状态码',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 插入默认管理员（密码：admin123，请部署后立即修改）
INSERT IGNORE INTO admins (username, password, role, status)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'super_admin', 1);

-- 插入默认分类
INSERT IGNORE INTO categories (id, name, sort, status) VALUES
(1, '肉类食材', 1, 1),
(2, '海鲜食材', 2, 1),
(3, '蔬菜食材', 3, 1),
(4, '丸子类',   4, 1),
(5, '调料类',   5, 1),
(6, '酒水饮料', 6, 1);
