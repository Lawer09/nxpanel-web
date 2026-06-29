import { EditOutlined } from '@ant-design/icons';
import { Button, Descriptions, Drawer, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';

const { Paragraph, Text } = Typography;

type UserDetailDrawerProps = {
  open: boolean;
  user?: API.UserItem;
  onClose: () => void;
  onEdit: () => void;
};

const formatBytes = (bytes?: number | null): string => {
  if (bytes == null) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

const formatDateTime = (timestamp?: number | null, withSeconds = true) => {
  if (!timestamp) return '-';
  return dayjs.unix(timestamp).format(withSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm');
};

const renderValue = (value?: React.ReactNode) => {
  if (value === undefined || value === null || value === '') return '-';
  return value;
};

const renderMetaValue = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return '-';
  return (
    <Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}>
      {String(value)}
    </Paragraph>
  );
};

const renderUserType = (user?: API.UserItem) => {
  const userType = user?.user_type || 'global';
  if (userType === 'define') {
    return <Tag color="processing">自定义菜单</Tag>;
  }
  return <Tag>全量菜单</Tag>;
};

const renderRoles = (user?: API.UserItem) => {
  const tags: React.ReactNode[] = [];
  if (user?.is_admin) tags.push(<Tag color="gold" key="admin">管理员</Tag>);
  if (user?.is_staff) tags.push(<Tag color="cyan" key="staff">员工</Tag>);
  if (!tags.length) return '-';
  return <Space size={[4, 4]} wrap>{tags}</Space>;
};

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({ open, user, onClose, onEdit }) => {
  const used = (user?.u ?? 0) + (user?.d ?? 0);
  const menus = (user?.menus ?? []).filter(Boolean);
  const meta = user?.register_metadata;

  return (
    <Drawer
      title={user ? `用户详情 · ${user.email}` : '用户详情'}
      width={920}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        user ? (
          <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
            编辑用户
          </Button>
        ) : null
      }
    >
      {user ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Descriptions
            title="账户概览"
            bordered
            size="small"
            column={3}
            items={[
              { key: 'id', label: '用户 ID', children: user.id },
              {
                key: 'status',
                label: '状态',
                children: user.banned ? <Tag color="error">封禁</Tag> : <Tag color="success">正常</Tag>,
              },
              { key: 'plan', label: '当前套餐', children: user.plan?.name || '无套餐' },
              { key: 'userType', label: '用户类型', children: renderUserType(user) },
              { key: 'roles', label: '角色', children: renderRoles(user) },
              {
                key: 'expiredAt',
                label: '到期时间',
                children: user.expired_at ? (
                  <Tag color={dayjs.unix(user.expired_at).isBefore(dayjs()) ? 'error' : 'default'}>
                    {formatDateTime(user.expired_at, false)}
                  </Tag>
                ) : (
                  <Tag color="success">长期有效</Tag>
                ),
              },
            ]}
          />

          <Descriptions
            title="订阅与配额"
            bordered
            size="small"
            column={2}
            items={[
              { key: 'subscribeUrl', label: '订阅链接', children: renderMetaValue(user.subscribe_url) },
              { key: 'uuid', label: 'UUID', children: renderMetaValue(user.uuid) },
              { key: 'usedTraffic', label: '已用流量', children: formatBytes(used) },
              { key: 'totalTraffic', label: '总流量', children: formatBytes(user.transfer_enable) },
              { key: 'speedLimit', label: '限速', children: user.speed_limit ? `${user.speed_limit} Mbps` : '不限' },
              { key: 'deviceLimit', label: '设备限制', children: user.device_limit ? `${user.device_limit}` : '不限' },
              { key: 'reportTraffic', label: '上报流量', children: renderValue(user.report_traffic ?? '-') },
            ]}
          />

          <Descriptions
            title="财务与备注"
            bordered
            size="small"
            column={2}
            items={[
              {
                key: 'balance',
                label: '余额',
                children: user.balance != null ? `¥${Number(user.balance).toFixed(2)}` : '-',
              },
              {
                key: 'commissionBalance',
                label: '佣金余额',
                children:
                  user.commission_balance != null
                    ? `¥${Number(user.commission_balance).toFixed(2)}`
                    : '-',
              },
              {
                key: 'commissionRate',
                label: '返佣比例',
                children: user.commission_rate != null ? `${user.commission_rate}%` : '-',
              },
              {
                key: 'discount',
                label: '专属折扣',
                children: user.discount != null ? `${user.discount}%` : '-',
              },
              {
                key: 'remarks',
                label: '备注',
                span: 2,
                children: renderMetaValue(user.remarks),
              },
            ]}
          />

          <Descriptions
            title="注册与登录"
            bordered
            size="small"
            column={2}
            items={[
              { key: 'email', label: '邮箱', children: user.email },
              { key: 'ip', label: '注册 IP', children: user.ip || '-' },
              { key: 'createdAt', label: '注册时间', children: formatDateTime(user.created_at) },
              { key: 'lastLoginAt', label: '最近登录', children: formatDateTime(user.last_login_at) },
              { key: 'inviteUser', label: '邀请人', children: user.invite_user?.email || '-' },
            ]}
          />

          <Descriptions
            title="菜单权限"
            bordered
            size="small"
            column={1}
            items={[
              {
                key: 'menus',
                label: '可见菜单',
                children:
                  user.user_type === 'define' ? (
                    menus.length ? (
                      <Space size={[6, 6]} wrap>
                        {menus.map((menu) => (
                          <Tag key={menu}>{menu}</Tag>
                        ))}
                      </Space>
                    ) : (
                      <Text type="warning">未配置菜单路径</Text>
                    )
                  ) : (
                    '跟随系统默认菜单'
                  ),
              },
            ]}
          />

          <Descriptions
            title="注册元数据"
            bordered
            size="small"
            column={2}
            items={[
              { key: 'appId', label: '包名', children: renderMetaValue(meta?.app_id) },
              { key: 'appVersion', label: '应用版本', children: renderMetaValue(meta?.app_version) },
              { key: 'channel', label: '渠道', children: renderMetaValue(meta?.channel_type) },
              { key: 'platform', label: '平台', children: renderMetaValue(meta?.platform) },
              { key: 'country', label: '国家', children: renderMetaValue(meta?.country) },
              { key: 'city', label: '城市', children: renderMetaValue(meta?.city) },
              { key: 'brand', label: '品牌', children: renderMetaValue(meta?.brand) },
              { key: 'utmSource', label: '来源', children: renderMetaValue(meta?.utm_source) },
              { key: 'utmMedium', label: '媒介', children: renderMetaValue(meta?.utm_medium) },
              { key: 'installTs', label: '安装 TS', children: renderMetaValue(meta?.install_begin_ts) },
              { key: 'clickTs', label: '点击 TS', children: renderMetaValue(meta?.click_ts) },
              {
                key: 'referrer',
                label: 'Referrer',
                span: 2,
                children: renderMetaValue(meta?.raw_referrer),
              },
            ]}
          />
        </Space>
      ) : null}
    </Drawer>
  );
};

export default UserDetailDrawer;
