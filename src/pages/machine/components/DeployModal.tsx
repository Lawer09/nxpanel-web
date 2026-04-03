import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import {
  App,
  Badge,
  Button,
  Descriptions,
  Form,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { fetchDeployTemplates } from '@/services/server/api';
import {
  clearNode,
  deployNode,
  deployStatus,
} from '@/services/machine/api';

const { Text } = Typography;

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <ClockCircleOutlined style={{ color: '#faad14' }} />,
  running: <LoadingOutlined style={{ color: '#1677ff' }} />,
  success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  failed: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
};

interface DeployModalProps {
  open: boolean;
  machine?: API.Machine;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ExecutionResult {
  output: string;
  exit_code: number;
}

const DeployModal: React.FC<DeployModalProps> = ({
  open,
  machine,
  onClose,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<API.DeployTemplate[]>([]);
  const [deployLoading, setDeployLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  // Async polling state
  const [taskId, setTaskId] = useState<number | null>(null);
  const [taskDetail, setTaskDetail] = useState<API.DeployTaskDetail | null>(
    null,
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setTaskId(null);
      setTaskDetail(null);
      fetchDeployTemplates({ page: 1, page_size: 100 }).then((res) => {
        if (res.code === 0) {
          const list = res.data?.data ?? [];
          setTemplates(list);
          const def = list.find((t) => t.is_default);
          if (def) form.setFieldValue('template_id', def.id);
        }
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

  const startPoll = (tid: number) => {
    pollRef.current = setInterval(async () => {
      const res = await deployStatus({ task_id: tid });
      if (res.code !== 0) return;
      const data = res.data as API.DeployTaskDetail;
      setTaskDetail(data);
      if (data.status === 'success' || data.status === 'failed') {
        stopPoll();
        if (data.status === 'success') onSuccess?.();
      }
    }, 2500);
  };

  const handleDeploy = async () => {
    if (!machine?.id) {
      messageApi.error('无效的机器');
      return;
    }
    const values = await form.validateFields();
    setDeployLoading(true);
    const res = await deployNode({
      id: machine.id,
      template_id: values.template_id,
    });
    setDeployLoading(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '部署失败');
      return;
    }
    const tid = res.data.task_id;
    setTaskId(tid);
    setTaskDetail(null);
    messageApi.success('部署任务已提交，正在轮询状态…');
    startPoll(tid);
  };

  const handleClear = async () => {
    if (!machine?.id) {
      messageApi.error('无效的机器');
      return;
    }
    setClearLoading(true);
    const res = await clearNode({ id: machine.id });
    setClearLoading(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '清除失败');
      return;
    }
    messageApi.success('节点已清除');
    onClose();
  };

  const handleClose = () => {
    stopPoll();
    onClose();
  };

  const isPolling = taskId !== null;
  const isDone =
    taskDetail?.status === 'success' || taskDetail?.status === 'failed';

  return (
    <Modal
      title={`部署节点 — ${machine?.name ?? 'Unknown'} (${machine?.ip_address ?? ''})`}
      open={open}
      onCancel={handleClose}
      width={680}
      destroyOnHidden
      footer={
        isPolling
          ? [
              <Button key="close" onClick={handleClose}>
                关闭
              </Button>,
              isDone ? (
                <Button
                  key="retry"
                  onClick={() => {
                    setTaskId(null);
                    setTaskDetail(null);
                  }}
                >
                  重新部署
                </Button>
              ) : null,
            ].filter(Boolean)
          : [
              <Button key="close" onClick={handleClose}>
                关闭
              </Button>,
              <Button
                key="clear"
                danger
                loading={clearLoading}
                disabled={deployLoading}
                onClick={handleClear}
              >
                清除节点
              </Button>,
              <Button
                key="deploy"
                type="primary"
                loading={deployLoading}
                disabled={clearLoading}
                onClick={handleDeploy}
              >
                部署节点
              </Button>,
            ]
      }
    >
      {/* Template selection */}
      {!isPolling && (
        <Form form={form} layout="vertical">
          <Form.Item
            name="template_id"
            label="部署模板"
            rules={[{ required: true, message: '请选择部署模板' }]}
            extra="将使用所选模板的配置在此机器上自动部署节点"
          >
            <Select
              placeholder="选择部署模板"
              allowClear
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
          {templates.length === 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              暂无部署模板，请先前往「部署模板」页面创建。
            </Text>
          )}
        </Form>
      )}

      {/* Polling status panel */}
      {isPolling && (
        <div style={{ minHeight: 160 }}>
          {!taskDetail ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin>
                <div style={{ padding: '20px 0', color: '#999', fontSize: 13 }}>
                  正在提交任务，等待状态…
                </div>
              </Spin>
            </div>
          ) : (
            <>
              <Descriptions
                bordered
                size="small"
                column={2}
                style={{ marginBottom: 16 }}
              >
                <Descriptions.Item label="任务 ID">
                  {taskDetail.id}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Space>
                    {STATUS_ICON[taskDetail.status]}
                    <Badge
                      status={
                        taskDetail.status === 'success'
                          ? 'success'
                          : taskDetail.status === 'failed'
                            ? 'error'
                            : taskDetail.status === 'running'
                              ? 'processing'
                              : 'warning'
                      }
                      text={taskDetail.status}
                    />
                  </Space>
                </Descriptions.Item>
                {taskDetail.server && (
                  <Descriptions.Item label="创建节点" span={2}>
                    {taskDetail.server.name} (ID: {taskDetail.server.id})
                  </Descriptions.Item>
                )}
                {taskDetail.started_at && (
                  <Descriptions.Item label="开始时间">
                    {taskDetail.started_at}
                  </Descriptions.Item>
                )}
                {taskDetail.finished_at && (
                  <Descriptions.Item label="完成时间">
                    {taskDetail.finished_at}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {(taskDetail.status === 'running' ||
                taskDetail.status === 'pending') && (
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <Spin size="small" />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    正在部署，每 2.5s 刷新状态…
                  </Text>
                </div>
              )}

              {taskDetail.output && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    执行输出：
                  </Text>
                  <pre
                    style={{
                      marginTop: 6,
                      background: '#1f1f1f',
                      color: '#e0e0e0',
                      padding: '10px 14px',
                      borderRadius: 6,
                      maxHeight: 260,
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    {taskDetail.output}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

export default DeployModal;
