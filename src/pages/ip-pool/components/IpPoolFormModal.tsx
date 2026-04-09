import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Button, Form, Input, message, Space } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { getIpInfo, saveIpPool } from '@/services/infra/api';
import { getMachineList } from '@/services/machine/api';

type IpPoolFormModalProps = {
  open: boolean;
  current?: API.IpPoolItem;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const IpPoolFormModal: React.FC<IpPoolFormModalProps> = ({
  open,
  current,
  onOpenChange,
  onSuccess,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const formRef = useRef<ProFormInstance<API.IpPoolSaveParams>>(null);
  const [fetchingIpInfo, setFetchingIpInfo] = useState(false);
  const [machines, setMachines] = useState<API.Machine[]>([]);
  const [machinesLoading, setMachinesLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setMachinesLoading(true);
      getMachineList({ page: 1, pageSize: 200 })
        .then((res) => setMachines(res.data?.data || []))
        .finally(() => setMachinesLoading(false));
    }
  }, [open]);

  const fetchIpDetail = async () => {
    const ip = formRef.current?.getFieldValue('ip');
    if (!ip) {
      messageApi.warning('请先输入 IP 地址');
      return;
    }
    const ipv4Pattern =
      /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
    if (!ipv4Pattern.test(ip)) {
      messageApi.warning('IP 地址格式错误');
      return;
    }
    setFetchingIpInfo(true);
    try {
      const res = await getIpInfo({ ip });
      if (res.code !== 0 || !res.data) {
        messageApi.error(res.msg || '获取 IP 信息失败');
        return;
      }
      formRef.current?.setFieldsValue({
        hostname: res.data.hostname,
        city: res.data.city,
        region: res.data.region,
        country: res.data.country,
        loc: res.data.loc,
        org: res.data.org,
        postal: res.data.postal,
        timezone: res.data.timezone,
        readme_url: res.data.readme,
      });
      messageApi.success('IP 信息已填充');
    } catch (_error) {
      messageApi.error('获取 IP 信息失败');
    } finally {
      setFetchingIpInfo(false);
    }
  };

  return (
    <ModalForm<API.IpPoolSaveParams>
      title={current ? '编辑 IP' : '新增 IP'}
      open={open}
      initialValues={{ ...(current || {}), ip_type: current?.ip_type ?? 'elastic' }}
      formRef={formRef}
      modalProps={{
        destroyOnHidden: true,
      }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        const payload: API.IpPoolSaveParams = {
          id: current?.id,
          ip: current?.id ? undefined : values.ip,
          machine_id: values.machine_id ?? null,
          provider_id: values.provider_id ?? null,
          provider_ip_id: values.provider_ip_id ?? null,
          ip_type: values.ip_type ?? 'elastic',
          hostname: values.hostname,
          city: values.city,
          region: values.region,
          country: values.country,
          loc: values.loc,
          org: values.org,
          postal: values.postal,
          timezone: values.timezone,
          readme_url: values.readme_url,
          score: values.score,
          max_load: values.max_load,
          status: values.status,
          risk_level: values.risk_level,
        };
        const res = await saveIpPool(payload);
        if (res.code !== 0) {
          messageApi.error(res.msg || '保存失败');
          return false;
        }
        messageApi.success(current ? 'IP 已更新' : 'IP 已创建');
        onSuccess();
        return true;
      }}
    >
      {contextHolder}
      <Form.Item
        label="IP 地址"
        required={!current?.id}
        style={{ marginBottom: 24 }}
      >
        <Space.Compact block>
          <Form.Item
            name="ip"
            noStyle
            rules={
              current?.id
                ? []
                : [
                    { required: true, message: '请输入 IP 地址' },
                    {
                      pattern:
                        /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/,
                      message: 'IP 地址格式错误',
                    },
                  ]
            }
          >
            <Input disabled={Boolean(current?.id)} />
          </Form.Item>
          {!current?.id && (
            <Button loading={fetchingIpInfo} onClick={fetchIpDetail}>
              获取IP信息
            </Button>
          )}
        </Space.Compact>
      </Form.Item>
      <ProFormText name="hostname" label="主机名" />
      <ProFormText name="city" label="城市" />
      <ProFormText name="region" label="地区/州" />
      <ProFormText
        name="country"
        label="国家代码"
        rules={[
          {
            pattern: /^[A-Za-z]{2}$/,
            message: '请输入 2 位国家代码',
          },
        ]}
      />
      <ProFormText name="loc" label="坐标" placeholder="50.1155,8.6842" />
      <ProFormText name="org" label="组织/ISP" />
      <ProFormText name="postal" label="邮编" />
      <ProFormText name="timezone" label="时区" placeholder="Europe/Berlin" />
      <ProFormText name="readme_url" label="信息链接" />
      <ProFormSelect
        name="machine_id"
        label="绑定机器"
        allowClear
        showSearch
        placeholder="可选"
        
        fieldProps={{ 
          optionFilterProp: 'label',
          loading: machinesLoading 
        }}
        options={machines.map((m) => ({
          label: `${m.name}（${m.ip_address}）`,
          value: m.id,
        }))}
      />
      <ProFormSelect
        name="ip_type"
        label="IP 类型"
        options={[
          { label: '弹性IP', value: 'elastic' },
          { label: '公网IP', value: 'public' },
        ]}
      />
      <ProFormText name="provider_ip_id" label="Provider IP ID" />
      <ProFormDigit name="provider_id" label="Provider ID" min={1} />
      <ProFormDigit name="score" label="评分" min={0} max={100} />
      <ProFormDigit name="max_load" label="最大负载" min={0} />
      <ProFormSelect
        name="status"
        label="状态"
        options={[
          { label: 'active', value: 'active' },
          { label: 'cooldown', value: 'cooldown' },
        ]}
      />
      <ProFormDigit name="risk_level" label="风险值" min={0} max={100} />
    </ModalForm>
  );
};

export default IpPoolFormModal;
