import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, App } from 'antd';
import { useDashboard } from '../DashboardContext';
import { getTrafficSyncJobDetail, triggerTrafficSync } from '@/services/traffic-platform/api';
import dayjs from 'dayjs';

const SyncErrorDialog: React.FC = () => {
  const { syncErrorData, setSyncErrorData } = useDashboard();
  const { message } = App.useApp();
  const [detailRow, setDetailRow] = useState<API.TrafficSyncJobDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (syncErrorData?.id) {
      getTrafficSyncJobDetail(syncErrorData.id).then(res => {
        if (res.code === 0) setDetailRow(res.data as API.TrafficSyncJobDetail);
      });
    } else {
      setDetailRow(null);
    }
  }, [syncErrorData]);

  const handleRetry = async () => {
    if (!detailRow) return;
    setLoading(true);
    try {
      const res = await triggerTrafficSync({
        accountId: detailRow.platformAccountId,
        platformCode: detailRow.platformCode,
        startDate: dayjs(detailRow.startTime).format('YYYY-MM-DD'),
        endDate: dayjs(detailRow.endTime).format('YYYY-MM-DD'),
      });
      if (res.code === 0) {
        message.success('已重新提交同步任务');
        setSyncErrorData(null);
      } else {
        message.error(res.msg || '提交失败');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>同步失败详情</div>
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', fontWeight: 'normal' }}>
            查看任务失败原因，可根据错误信息调整配置后重新同步
          </div>
        </div>
      }
      width={640}
      open={!!syncErrorData}
      onCancel={() => setSyncErrorData(null)}
      onOk={handleRetry}
      okText="重新同步"
      cancelText="关闭"
      confirmLoading={loading}
      okButtonProps={{ style: { backgroundColor: '#2563EB' } }}
    >
      {detailRow ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="任务ID">{detailRow.id}</Descriptions.Item>
            <Descriptions.Item label="平台">{detailRow.platformCode}</Descriptions.Item>
            <Descriptions.Item label="账号">{detailRow.accountName || detailRow.platformAccountId}</Descriptions.Item>
            <Descriptions.Item label="同步范围">{dayjs(detailRow.startTime).format('YYYY-MM-DD')} ~ {dayjs(detailRow.endTime).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="失败时间">{detailRow.updatedAt ? dayjs(detailRow.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
          </Descriptions>

          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '8px' }}>错误信息</div>
            <div style={{ 
              backgroundColor: '#FEF2F2', 
              border: '1px solid #FECACA',
              color: '#B91C1C', 
              padding: '12px', 
              borderRadius: '8px',
              fontFamily: 'monospace'
            }}>
              {detailRow.errorMessage || '未知错误'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '8px' }}>请求参数</div>
            <pre style={{ 
              margin: 0, 
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              padding: '12px', 
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '12px',
              maxHeight: '150px', 
              overflow: 'auto',
              color: '#374151'
            }}>
              {JSON.stringify(detailRow.requestParams || {}, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>加载中...</div>
      )}
    </Modal>
  );
};

export default SyncErrorDialog;
