import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Drawer,
  Input,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import React, { useState } from 'react';
import { recordsByIp, unbindRecord } from '@/services/swagger/dns';

const { Text } = Typography;

interface IpRecordsDrawerProps {
  open: boolean;
  onClose: () => void;
  onResolveClick: (ip: string) => void;
}

const IpRecordsDrawer: React.FC<IpRecordsDrawerProps> = ({
  open,
  onClose,
  onResolveClick,
}) => {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<API.DnsRecordsByIpResult | null>(null);
  const [emptyMsg, setEmptyMsg] = useState('');

  const handleSearch = async () => {
    if (!ip.trim()) {
      messageApi.warning('请输入 IPv4 地址');
      return;
    }
    setLoading(true);
    setResult(null);
    setEmptyMsg('');
    const res = await recordsByIp(ip.trim());
    setLoading(false);
    if (res.code === 0) {
      setResult(res.data);
    } else {
      setEmptyMsg(res.msg || '无绑定记录');
    }
  };

  const handleUnbind = (fqdn: string) => {
    modalApi.confirm({
      title: `确认解绑 ${fqdn}？`,
      content: `将从 ${ip} 移除该解析记录。`,
      okType: 'danger',
      onOk: async () => {
        const res = await unbindRecord({ ipv4: ip, fqdn });
        if (res.code !== 0) {
          messageApi.error(res.msg || '解绑失败');
          return;
        }
        messageApi.success('解绑成功');
        handleSearch();
      },
    });
  };

  return (
    <Drawer
      title="查询 IP 绑定记录"
      open={open}
      width={540}
      onClose={() => {
        onClose();
        setResult(null);
        setEmptyMsg('');
        setIp('');
      }}
      destroyOnHidden
      extra={
        <Button
          type="primary"
          size="small"
          onClick={() => onResolveClick(ip)}
          disabled={!ip.trim()}
        >
          + 新增解析
        </Button>
      }
    >
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          placeholder="输入 IPv4，如 1.2.3.4"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          onPressEnter={handleSearch}
          prefix={<SearchOutlined />}
        />
        <Button type="primary" loading={loading} onClick={handleSearch}>
          查询
        </Button>
      </Space.Compact>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      )}

      {emptyMsg && !loading && (
        <Alert type="info" message={emptyMsg} showIcon />
      )}

      {result && !loading && (
        <Table<API.DnsRecord>
          size="small"
          rowKey="id"
          dataSource={result.records}
          pagination={false}
          columns={[
            {
              title: 'FQDN',
              dataIndex: 'fqdn',
              render: (v) => <Text copyable>{v}</Text>,
            },
            {
              title: '子域名',
              dataIndex: 'subdomain',
              width: 90,
            },
            {
              title: '主域名',
              dataIndex: 'domain',
              width: 120,
            },
            {
              title: '状态',
              dataIndex: 'enabled',
              width: 70,
              render: (v) => (
                <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '禁用'}</Tag>
              ),
            },
            {
              title: '操作',
              width: 70,
              render: (_, record) => (
                <Button
                  type="link"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleUnbind(record.fqdn)}
                >
                  解绑
                </Button>
              ),
            },
          ]}
        />
      )}
    </Drawer>
  );
};

export default IpRecordsDrawer;
