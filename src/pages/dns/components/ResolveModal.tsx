import {
  ModalForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Alert, App, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { availableDomains, resolveRecord } from '@/services/dns/api';

interface ResolveModalProps {
  open: boolean;
  initialIp?: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ACTION_COLOR: Record<string, string> = {
  created: 'green',
  unchanged: 'blue',
  replace: 'orange',
};

const ACTION_LABEL: Record<string, string> = {
  created: '新建解析',
  unchanged: '记录已存在（无变化）',
  replace: '唯一模式替换',
};

const ResolveModal: React.FC<ResolveModalProps> = ({
  open,
  initialIp,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [domains, setDomains] = useState<API.DnsDomain[]>([]);
  const [result, setResult] = useState<API.DnsResolveResult | null>(null);

  useEffect(() => {
    if (open) {
      setResult(null);
      availableDomains().then((res) => {
        if (res.code === 0) setDomains(res.data ?? []);
      });
    }
  }, [open]);

  return (
    <ModalForm
      title="IP 解析绑定"
      open={open}
      width={480}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setResult(null);
      }}
      submitter={{
        searchConfig: { submitText: '解析' },
      }}
      onFinish={async (values) => {
        const res = await resolveRecord({
          ipv4: values.ipv4,
          subdomain: values.subdomain,
          domain: values.domain,
          unique: values.unique ?? false,
        });
        if (res.code !== 0) {
          messageApi.error(res.msg || '解析失败');
          return false;
        }
        setResult(res.data!);
        messageApi.success(res.msg || '操作成功');
        onSuccess();
        return true;
      }}
      initialValues={{ ipv4: initialIp ?? '', unique: false }}
    >
      <ProFormText
        name="ipv4"
        label="IPv4 地址"
        rules={[
          { required: true, message: '请输入 IPv4 地址' },
          { pattern: /^\d{1,3}(\.\d{1,3}){3}$/, message: 'IP 格式不正确' },
        ]}
        placeholder="如 1.2.3.4"
      />
      <ProFormText
        name="subdomain"
        label="子域名前缀"
        rules={[{ required: true, message: '请输入子域名前缀' }]}
        placeholder="如 hk01"
      />
      <ProFormSelect
        name="domain"
        label="主域名"
        rules={[{ required: true, message: '请选择主域名' }]}
        options={domains.map((d) => ({ label: d.domain, value: d.domain }))}
        placeholder="选择可用主域名"
      />
      <ProFormSwitch
        name="unique"
        label="唯一模式"
        tooltip="开启后，该 IP 在此主域名下的旧解析记录将全部被替换"
      />

      {result && (
        <Alert
          style={{ marginTop: 8 }}
          type={result.action === 'replace' ? 'warning' : 'success'}
          message={
            <span>
              <Tag color={ACTION_COLOR[result.action]}>
                {ACTION_LABEL[result.action]}
              </Tag>{' '}
              <strong>{result.fqdn}</strong>
              {' → '}
              {result.ipv4}
            </span>
          }
          description={
            result.removed_records?.length ? (
              <div>
                已移除旧记录：
                {result.removed_records.map((r) => (
                  <Tag key={r} style={{ marginTop: 4 }}>
                    {r}
                  </Tag>
                ))}
              </div>
            ) : undefined
          }
          showIcon
        />
      )}
    </ModalForm>
  );
};

export default ResolveModal;
