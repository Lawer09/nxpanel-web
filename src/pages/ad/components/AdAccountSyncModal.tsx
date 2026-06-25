import { App, DatePicker, Descriptions, Form, Modal, Radio, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  syncAccountMeta,
  syncApps,
  syncRevenueByDate,
  syncRevenueNowBackfill,
} from '@/services/ad/api';

const { Text } = Typography;
const { RangePicker } = DatePicker;

type SyncType = 'revenue' | 'accountMeta' | 'apps' | 'revenueNowBackfill';

interface Props {
  open: boolean;
  account?: API.AdAccount;
  syncServers: API.SyncServer[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SYNC_TYPE_OPTIONS: { label: string; value: SyncType }[] = [
  { label: '同步收入', value: 'revenue' },
  { label: '同步账号元信息', value: 'accountMeta' },
  { label: '同步应用信息', value: 'apps' },
  { label: '同步近期收益聚合表', value: 'revenueNowBackfill' },
];

const SUCCESS_TEXT: Record<SyncType, string> = {
  revenue: '收入同步指令已下发',
  accountMeta: '账号元信息同步指令已下发',
  apps: '应用信息同步指令已下发',
  revenueNowBackfill: '近期收益聚合表同步指令已下发',
};

function formatDateValue(value: any) {
  if (!value) return '';
  if (typeof value.format === 'function') return value.format('YYYY-MM-DD');
  return String(value);
}

function getResultElapsed(result?: API.SyncTriggerResult) {
  return result?.data?.elapsed || result?.body?.elapsed || '-';
}

const AdAccountSyncModal: React.FC<Props> = ({
  open,
  account,
  syncServers,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi, modal } = App.useApp();
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const syncType = Form.useWatch('syncType', form) as SyncType | undefined;

  const assignedServer = useMemo(
    () => syncServers.find((item) => item.serverId === account?.assignedServerId),
    [account?.assignedServerId, syncServers],
  );

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ syncType: 'revenue' });
    }
  }, [form, open, account?.id]);

  const handleSubmit = async () => {
    if (!account?.assignedServerId) {
      messageApi.warning('请先分配同步节点');
      return;
    }

    try {
      const values = await form.validateFields();
      const currentSyncType = values.syncType as SyncType;
      setConfirmLoading(true);

      let res: API.ApiResponse<API.SyncTriggerResult>;
      if (currentSyncType === 'revenue') {
        const [start, end] = values.dateRange || [];
        res = await syncRevenueByDate(account.assignedServerId, {
          start_date: formatDateValue(start),
          end_date: formatDateValue(end),
        });
      } else if (currentSyncType === 'accountMeta') {
        res = await syncAccountMeta(account.assignedServerId);
      } else if (currentSyncType === 'apps') {
        res = await syncApps(account.assignedServerId);
      } else {
        res = await syncRevenueNowBackfill(account.assignedServerId);
      }

      if (res.code !== 0) {
        messageApi.error(res.msg || '同步请求失败');
        return;
      }

      const result = res.data;
      modal.success({
        title: res.msg || result?.msg || SUCCESS_TEXT[currentSyncType],
        content: (
          <Descriptions size="small" column={1}>
            <Descriptions.Item label="HTTP 状态">{result?.httpStatus ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="耗时">{getResultElapsed(result)}</Descriptions.Item>
            <Descriptions.Item label="URL">
              <Text copyable={!!result?.url} ellipsis={{ tooltip: result?.url }}>
                {result?.url || '-'}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        ),
      });
      onOpenChange(false);
      onSuccess();
    } catch {
      // validation error or request interceptor handled error
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title="同步广告账户"
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleSubmit}
      confirmLoading={confirmLoading}
      destroyOnHidden
      width={640}
    >
      <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="账户">
          {account?.accountLabel || account?.accountName || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="主同步节点">
          {assignedServer
            ? `${assignedServer.serverName} (${assignedServer.serverId})`
            : account?.assignedServerId || '-'}
        </Descriptions.Item>
      </Descriptions>

      <Form form={form} layout="vertical">
        <Form.Item name="syncType" label="同步内容" rules={[{ required: true }]}>
          <Radio.Group optionType="button" buttonStyle="solid" options={SYNC_TYPE_OPTIONS} />
        </Form.Item>

        {syncType === 'revenue' && (
          <Form.Item
            name="dateRange"
            label="同步日期范围"
            rules={[{ required: true, message: '请选择同步日期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default AdAccountSyncModal;
