-- Migration: 添加站内信通知表
-- 用于记录用户取消待发货订单时推送给管理员的通知

CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         BIGINT        NOT NULL AUTO_INCREMENT,
  `type`       VARCHAR(32)   NOT NULL DEFAULT 'order_cancel' COMMENT '通知类型',
  `title`      VARCHAR(128)  NOT NULL COMMENT '标题',
  `content`    TEXT          NOT NULL COMMENT '正文',
  `ref_type`   VARCHAR(32)   DEFAULT NULL COMMENT '关联对象类型（order 等）',
  `ref_id`     BIGINT        DEFAULT NULL COMMENT '关联对象 ID',
  `is_read`    TINYINT       NOT NULL DEFAULT 0 COMMENT '是否已读（0未读/1已读）',
  `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理端站内信通知';
