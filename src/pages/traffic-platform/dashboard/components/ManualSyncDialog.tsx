import React, { useState } from 'react';
import { Modal, Form, Select, DatePicker, App } from 'antd';
import { useDashboard } from '../DashboardContext';
import { triggerTrafficSync } from '@/services/traffic-platform/api';

const { RangePicker } = DatePicker;

const ManualSyncDialog: React.FC = () => {
  const { manualSyncOpen, setManualSyncOpen, platformOptions, accountOptions, reloadKpi } = useDashboard();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  return (
    <Modal
      title={
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>手动同步</div>
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', fontWeight: 'normal' }}>
            选择平台、账号和日期范围，创建一次流量数据同步任务
          </div>
        </div>
      }
      width={520}
      open={manualSyncOpen}
      onCancel={() => setManualSyncOpen(false)}
      onOk={async () => {
        try {
          const v = await form.validateFields();
          setLoading(true);
          const res = await triggerTrafficSync({
            accountId: v.accountId,
            platformCode: v.platformCode,
            startDate: v.dateRange[0].format('YYYY-MM-DD'),
            endDate: v.dateRange[1].format('YYYY-MM-DD'),
          });
          setLoading(false);
          if (res.code !== 0) {
            message.error(res.msg || '提交失败');
            return;
          }
          message.success(`同步任务已创建，任务ID: ${res.data?.jobId || res.data}`);
          setManualSyncOpen(false);
          reloadKpi();
        } catch (e) {
          setLoading(false);
        }
      }}
      confirmLoading={loading}
      destroyOnHidden
      okText="开始同步"
      cancelText="取消"
      okButtonProps={{ style: { backgroundColor: '#2563EB' } }}
    >
      <div style={{ marginTop: '16px' }}>
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="platformCode" label="平台" style={{ marginBottom: '18px' }}>
            <Select allowClear options={platformOptions} placeholder="全部平台" />
          </Form.Item>
          <Form.Item name="accountId" label="账号" rules={[{ required: true, message: '请选择账号' }]} style={{ marginBottom: '18px' }}>
            <Select options={accountOptions} showSearch optionFilterProp="label" placeholder="选择账号" />
          </Form.Item>
          <Form.Item name="dateRange" label="同步日期范围" rules={[{ required: true, message: '请选择日期范围' }]} style={{ marginBottom: '18px' }}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default ManualSyncDialog;
