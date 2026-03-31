import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Badge,
  Button,
  Descriptions,
  Divider,
  Form,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Steps,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { fetchDeployTemplates } from '@/services/swagger/deployTemplate';
import { batchDeploy, deployStatus } from '@/services/swagger/machine';

const { Text } = Typography;

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <ClockCircleOutlined style={{ color: '#faad14' }} />,
  running: <LoadingOutlined style={{ color: '#1677ff' }} />,
  success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  failed: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'warning',
  running: 'processing',
  success: 'success',
  failed: 'error',
};

interface BatchDeployModalProps {
  open: boolean;
  machines: API.Machine[];
  onClose: () => void;
  onSuccess?: () => void;
}

const BatchDeployModal: React.FC<BatchDeployModalProps> = ({
  open,
  machines,
  onClose,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<API.DeployTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'config' | 'polling'>('config');
  const [batchId, setBatchId] = useState<number | null>(null);
  const [batchStatus, setBatchStatus] = useState<API.BatchDeployStatus | null>(
    null,
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      setStep('config');
      setBatchId(null);
      setBatchStatus(null);
      form.resetFields();
      fetchDeployTemplates({ page: 1, page_size: 100 }).then((res) => {
        if (res.code === 0) setTemplates(res.data?.data ?? []);
      });
    }
    return () => stopPoll();
  }, [open]);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPoll = (bid: number) => {
    pollRef.current = setInterval(async () => {
      const res = await deployStatus({ batch_id: bid });
      if (res.code !== 0) return;
      const data = res.data as API.BatchDeployStatus;
      setBatchStatus(data);
      const { pending, running } = data.summary;
      if (pending === 0 && running === 0) {
        stopPoll();
        onSuccess?.();
      }
    }, 3000);
  };

  const handleDeploy = async () => {
    const values = await form.validateFields();
    setLoading(true);
    const res = await batchDeploy({
      machine_ids: machines.map((m) => m.id!).filter(Boolean),
      template_id: values.template_id,
    });
    setLoading(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '批量部署失败');
      return;
    }
    setBatchId(res.data.batch_id);
    setBatchStatus(null);
    setStep('polling');
    startPoll(res.data.batch_id);
    messageApi.success(`已提交 ${res.data.task_count} 个部署任务`);
  };

  const handleClose = () => {
    stopPoll();
    onClose();
  };

  const summary = batchStatus?.summary;

  return (
    <Modal
      title={`批量部署 — 已选 ${machines.length} 台机器`}
      open={open}
      onCancel={handleClose}
      width={720}
      destroyOnHidden
      footer={
        step === 'config'
          ? [
              <Button key="cancel" onClick={handleClose}>
                取消
              </Button>,
              <Button
                key="deploy"
                type="primary"
                loading={loading}
                onClick={handleDeploy}
              >
                开始部署
              </Button>,
            ]
          : [
              <Button key="close" onClick={handleClose}>
                关闭
              </Button>,
            ]
      }
    >
      {step === 'config' && (
        <Form form={form} layout="vertical">
          <Alert
            type="info"
            message={`将对以下 ${machines.length} 台机器执行批量部署`}
            description={
              <Space wrap style={{ marginTop: 8 }}>
                {machines.map((m) => (
                  <Tag key={m.id}>
                    {m.name} ({m.ip_address})
                  </Tag>
                ))}
              </Space>
            }
            style={{ marginBottom: 16 }}
          />
          <Form.Item
            name="template_id"
            label="部署模板"
            rules={[{ required: true, message: '请选择部署模板' }]}
          >
            <Select
              placeholder="选择部署模板"
              options={templates.map((t) => ({
                label: (
                  <Space>
                    {t.name}
                    <Tag color="blue" style={{ fontSize: 11 }}>
                      {t.node_type}
                    </Tag>
                    {t.is_default && (
                      <Tag color="gold" style={{ fontSize: 11 }}>
                        默认
                      </Tag>
                    )}
                  </Space>
                ),
                value: t.id,
              }))}
            />
          </Form.Item>
        </Form>
      )}

      {step === 'polling' && (
        <div>
          {summary && (
            <Descriptions
              bordered
              size="small"
              column={5}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="总计">
                {summary.total}
              </Descriptions.Item>
              <Descriptions.Item
                label={<span style={{ color: '#faad14' }}>待执行</span>}
              >
                {summary.pending}
              </Descriptions.Item>
              <Descriptions.Item
                label={<span style={{ color: '#1677ff' }}>执行中</span>}
              >
                {summary.running}
              </Descriptions.Item>
              <Descriptions.Item
                label={<span style={{ color: '#52c41a' }}>成功</span>}
              >
                {summary.success}
              </Descriptions.Item>
              <Descriptions.Item
                label={<span style={{ color: '#ff4d4f' }}>失败</span>}
              >
                {summary.failed}
              </Descriptions.Item>
            </Descriptions>
          )}

          {!batchStatus && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin tip="正在等待任务状态..." />
            </div>
          )}

          {batchStatus?.tasks && (
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {batchStatus.tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    padding: '10px 14px',
                    marginBottom: 8,
                    background:
                      task.status === 'failed' ? '#fff2f0' : '#fafafa',
                  }}
                >
                  <Space
                    style={{ width: '100%', justifyContent: 'space-between' }}
                  >
                    <Space>
                      {STATUS_ICON[task.status]}
                      <Text strong>
                        {task.machine?.name ?? `机器 #${task.machine_id}`}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {task.machine?.ip_address}
                      </Text>
                    </Space>
                    <Space>
                      <Badge
                        status={STATUS_COLOR[task.status] as any}
                        text={task.status}
                      />
                      {task.server && (
                        <Tag color="cyan" style={{ fontSize: 11 }}>
                          节点: {task.server.name}
                        </Tag>
                      )}
                    </Space>
                  </Space>
                  {task.status === 'failed' && task.output && (
                    <pre
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        background: '#1f1f1f',
                        color: '#f0f0f0',
                        padding: 8,
                        borderRadius: 4,
                        maxHeight: 100,
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {task.output}
                    </pre>
                  )}
                  {task.finished_at && (
                    <Text
                      type="secondary"
                      style={{ fontSize: 11, display: 'block', marginTop: 4 }}
                    >
                      完成于 {task.finished_at}
                    </Text>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default BatchDeployModal;
