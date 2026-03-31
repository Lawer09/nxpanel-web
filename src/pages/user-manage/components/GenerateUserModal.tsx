import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Alert, App, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { generateUser } from '@/services/swagger/user';

type GenerateUserModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const GenerateUserModal: React.FC<GenerateUserModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [generatedList, setGeneratedList] = useState<any[]>([]);

  return (
    <ModalForm
      title="生成用户"
      open={open}
      modalProps={{ destroyOnHidden: true, width: 700 }}
      onOpenChange={(v) => {
        if (!v) setGeneratedList([]);
        onOpenChange(v);
      }}
      submitter={{
        searchConfig: { submitText: '生成' },
      }}
      onFinish={async (values) => {
        const isBatch = !!values.generate_count;
        const payload: API.UserGenerateParams = {
          email_suffix: values.email_suffix,
          password: values.password || undefined,
          plan_id: values.plan_id || undefined,
          expired_at: values.expired_at
            ? dayjs(values.expired_at).unix()
            : undefined,
        };

        if (isBatch) {
          payload.generate_count = values.generate_count;
          payload.download_csv = values.download_csv;
        } else {
          payload.email_prefix = values.email_prefix;
        }

        const res = await generateUser(payload);
        if (res.code !== 0) {
          messageApi.error(res.msg || '生成失败');
          return false;
        }

        if (isBatch && Array.isArray(res.data)) {
          setGeneratedList(res.data);
          messageApi.success(`批量生成成功，共 ${res.data.length} 个用户`);
        } else {
          messageApi.success('用户生成成功');
        }
        onSuccess();
        return true;
      }}
    >
      <Alert
        type="info"
        showIcon
        message="填写邮箱前缀为单个生成，填写批量生成数量为批量生成（二选一）"
        style={{ marginBottom: 16 }}
      />
      <ProFormText
        name="email_suffix"
        label="邮箱后缀"
        placeholder="如 gmail.com"
        rules={[{ required: true, message: '请输入邮箱后缀' }]}
      />
      <ProFormText
        name="email_prefix"
        label="邮箱前缀（单个）"
        placeholder="如 testuser"
      />
      <ProFormDigit
        name="generate_count"
        label="批量生成数量"
        min={1}
        max={500}
        fieldProps={{ precision: 0 }}
        placeholder="最大 500"
      />
      <ProFormText.Password
        name="password"
        label="密码"
        placeholder="不填则默认使用邮箱地址"
      />
      <ProFormDigit
        name="plan_id"
        label="套餐 ID"
        min={1}
        fieldProps={{ precision: 0 }}
        placeholder="可选"
      />
      <ProFormDateTimePicker
        name="expired_at"
        label="过期时间"
        placeholder="留空则永不过期"
        fieldProps={{ format: 'YYYY-MM-DD HH:mm:ss', allowClear: true }}
      />
      <ProFormSwitch name="download_csv" label="批量生成后下载 CSV" />

      {generatedList.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Typography.Title level={5}>
            生成结果（{generatedList.length} 条）
          </Typography.Title>
          <Table
            size="small"
            dataSource={generatedList.map((item, idx) => ({
              ...item,
              key: idx,
            }))}
            columns={[
              { title: '邮箱', dataIndex: 'email', key: 'email' },
              { title: '密码', dataIndex: 'password', key: 'password' },
              {
                title: '过期时间',
                dataIndex: 'expired_at',
                key: 'expired_at',
                render: (v: string) => v || '长期有效',
              },
            ]}
            pagination={{ pageSize: 10 }}
            scroll={{ y: 200 }}
            bordered
          />
        </div>
      )}
    </ModalForm>
  );
};

export default GenerateUserModal;
