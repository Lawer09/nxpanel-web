import React from 'react';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { saveIpPool } from '@/services/swagger/ipPool';

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
  return (
    <ModalForm<API.IpPoolSaveParams>
      title={current ? '编辑 IP' : '新增 IP'}
      open={open}
      initialValues={current}
      modalProps={{
        destroyOnClose: true,
      }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        const payload: API.IpPoolSaveParams = {
          id: current?.id,
          ip: current?.id ? undefined : values.ip,
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
          message.error(res.msg || '保存失败');
          return false;
        }
        message.success(current ? 'IP 已更新' : 'IP 已创建');
        onSuccess();
        return true;
      }}
    >
      <ProFormText
        name="ip"
        label="IP 地址"
        disabled={Boolean(current?.id)}
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
      />
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
