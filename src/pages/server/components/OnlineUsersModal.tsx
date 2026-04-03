import React, { useEffect, useState } from 'react';
import { Modal, Table, Tag, Space, Typography, Statistic, Row, Col, Spin, Empty } from 'antd';
import { UserOutlined, GlobalOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getServerOnlineUsers } from '@/services/server/api';

const { Text } = Typography;

type OnlineUsersModalProps = {
  open: boolean;
  serverId: number | null;
  serverName?: string;
  onClose: () => void;
};

const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({
  open,
  serverId,
  serverName,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<API.ServerOnlineUsersResult | null>(null);

  useEffect(() => {
    if (!open || !serverId) {
      setData(null);
      return;
    }
    setLoading(true);
    getServerOnlineUsers({ id: serverId })
      .then((res) => {
        if (res.code === 0 && res.data) {
          setData(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, [open, serverId]);

  const columns: ColumnsType<API.ServerOnlineUser> = [
    {
      title: 'UID',
      dataIndex: 'user_id',
      width: 80,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      ellipsis: true,
      render: (email: string) => <Text copyable>{email}</Text>,
    },
    {
      title: 'IP 数',
      dataIndex: 'ip_count',
      width: 80,
      align: 'center',
    },
    {
      title: 'IP 列表',
      dataIndex: 'ips',
      render: (ips: string[]) =>
        ips?.length ? (
          <Space wrap size={4}>
            {ips.map((ip) => (
              <Tag key={ip} icon={<GlobalOutlined />} color="blue" style={{ fontSize: 12 }}>
                {ip}
              </Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '最后活跃',
      dataIndex: 'last_update_at',
      width: 180,
      render: (val: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {val || '-'}
          </Text>
        </Space>
      ),
    },
  ];

  const title = data
    ? `在线用户 — ${data.server_name}`
    : serverName
      ? `在线用户 — ${serverName}`
      : '在线用户';

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        {data ? (
          <>
            <Row gutter={24} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Statistic
                  title="节点标识"
                  value={data.node_key}
                  prefix={<GlobalOutlined />}
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="在线用户数"
                  value={data.online_count}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: data.online_count > 0 ? '#52c41a' : '#8c8c8c' }}
                />
              </Col>
            </Row>
            {data.users?.length ? (
              <Table<API.ServerOnlineUser>
                rowKey="user_id"
                columns={columns}
                dataSource={data.users}
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
              />
            ) : (
              <Empty description="暂无在线用户" />
            )}
          </>
        ) : (
          !loading && <Empty description="暂无数据" />
        )}
      </Spin>
    </Modal>
  );
};

export default OnlineUsersModal;
