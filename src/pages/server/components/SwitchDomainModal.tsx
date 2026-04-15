import { ModalForm } from '@ant-design/pro-components';
import { Alert, App, Button, Input, Select, Space, Table, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { availableDomains } from '@/services/dns/api';
import { batchBindDomain } from '@/services/server/api';

interface SwitchDomainModalProps {
  open: boolean;
  servers?: API.ServerNode[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SwitchDomainModal: React.FC<SwitchDomainModalProps> = ({
  open,
  servers,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [domains, setDomains] = useState<API.DnsDomain[]>([]);
  const [result, setResult] = useState<API.BatchBindDomainResult | null>(null);
  const [bindings, setBindings] = useState<API.BatchBindDomainItem[]>([]);
  const [bulkDomain, setBulkDomain] = useState<string | undefined>();
  const [bulkSubdomain, setBulkSubdomain] = useState<string>('');

  useEffect(() => {
    if (open) {
      setResult(null);
      setBulkDomain(undefined);
      setBulkSubdomain('');
      setBindings(
        (servers || []).map((item) => ({
          id: item.id,
          domain: '',
          subdomain: '',
        })),
      );
      availableDomains().then((res) => {
        if (res.code === 0) {
          setDomains(res.data ?? []);
        }
      });
    }
  }, [open]);

  const domainOptions = useMemo(
    () => domains.map((item) => ({ label: item.domain, value: item.domain })),
    [domains],
  );

  const serverNameLabel = servers?.length === 1 ? ` - ${servers[0].name}` : '';
  const serverCountLabel = servers?.length ? `（${servers.length} 个节点）` : '';

  return (
    <ModalForm
      title={`切换域名${serverNameLabel}${serverCountLabel}`}
      open={open}
      width={520}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setResult(null);
      }}
      submitter={{ searchConfig: { submitText: '切换' } }}
      onFinish={async () => {
        if (!servers?.length) {
          messageApi.error('请选择节点');
          return false;
        }
        if (!bindings.length) {
          messageApi.error('未找到可提交的节点');
          return false;
        }
        const missing = bindings.filter((item) => !item.domain);
        if (missing.length) {
          messageApi.error('请为所有节点选择主域名');
          return false;
        }
        const res = await batchBindDomain({
          bindings: bindings.map((item) => ({
            id: item.id,
            domain: item.domain,
            subdomain: item.subdomain,
          })),
        });
        if (res.code !== 0) {
          messageApi.error(res.msg || '切换失败');
          return false;
        }
        setResult(res.data ?? null);
        messageApi.success(res.msg || '切换成功');
        onSuccess();
        return false;
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Space wrap>
          <Select
            value={bulkDomain}
            options={domainOptions}
            placeholder={domainOptions.length ? '批量填充主域名' : '暂无可用域名'}
            showSearch
            style={{ width: 220 }}
            onChange={(value) => setBulkDomain(value)}
          />
          <Input
            value={bulkSubdomain}
            placeholder="批量填充子域名（可选）"
            style={{ width: 220 }}
            onChange={(e) => setBulkSubdomain(e.target.value)}
          />
          <Button
            onClick={() => {
              if (!bulkDomain) {
                messageApi.warning('请选择主域名');
                return;
              }
              setBindings((prev) =>
                prev.map((item) => ({
                  ...item,
                  domain: bulkDomain,
                  subdomain: bulkSubdomain,
                })),
              );
            }}
          >
            批量填充
          </Button>
          <Button
            onClick={() => {
              setBulkDomain(undefined);
              setBulkSubdomain('');
            }}
          >
            清空批量值
          </Button>
        </Space>

        <Table
        rowKey="id"
        pagination={false}
        size="small"
        dataSource={bindings.map((item) => ({
          ...item,
          name: servers?.find((s) => s.id === item.id)?.name || item.id,
        }))}
        columns={[
          {
            title: '节点',
            dataIndex: 'name',
            width: 140,
            render: (value, record) => (
              <Space direction="vertical" size={0}>
                <Typography.Text>{value}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  ID: {record.id}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: '主域名',
            dataIndex: 'domain',
            width: 220,
            render: (_, record, index) => (
              <Select
                value={record.domain || undefined}
                options={domainOptions}
                placeholder={domainOptions.length ? '选择可用主域名' : '暂无可用域名'}
                showSearch
                style={{ width: '100%' }}
                onChange={(value) => {
                  setBindings((prev) =>
                    prev.map((item, idx) =>
                      idx === index ? { ...item, domain: value } : item,
                    ),
                  );
                }}
              />
            ),
          },
          {
            title: '子域名',
            dataIndex: 'subdomain',
            render: (_, record, index) => (
              <Input
                value={record.subdomain}
                placeholder="如 hk01（可选）"
                onChange={(e) => {
                  const value = e.target.value;
                  setBindings((prev) =>
                    prev.map((item, idx) =>
                      idx === index ? { ...item, subdomain: value } : item,
                    ),
                  );
                }}
              />
            ),
          },
        ]}
        />
      </Space>

      {result && (
        <Alert
          style={{ marginTop: 12 }}
          type={result.errors?.length ? 'warning' : 'success'}
          showIcon
          message={
            <Space size={12} wrap>
              <span>成功：{result.results?.length ?? 0}</span>
              <span>失败：{result.errors?.length ?? 0}</span>
            </Space>
          }
          description={
            <div>
              {result.results?.[0] && (
                <div>
                  FQDN：<Typography.Text strong>{result.results[0].fqdn}</Typography.Text>
                  {'  '}解析 IP：<Typography.Text strong>{result.results[0].resolved_ip}</Typography.Text>
                </div>
              )}
              {result.errors?.length ? (
                <div style={{ marginTop: 8 }}>
                  {result.errors.slice(0, 5).map((item) => (
                    <div key={`${item.index}-${item.server_id}`}>
                      {item.domain}.{item.subdomain} - {item.error}
                    </div>
                  ))}
                  {result.errors.length > 5 && <div>...</div>}
                </div>
              ) : null}
            </div>
          }
        />
      )}
    </ModalForm>
  );
};

export default SwitchDomainModal;
