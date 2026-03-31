import {
  App,
  Button,
  Divider,
  Empty,
  Modal,
  message,
  Result,
  Space,
  Spin,
} from 'antd';
import React, { useState } from 'react';
import { clearNode, deployNode } from '@/services/swagger/machine';

interface DeployModalProps {
  open: boolean;
  machine?: API.Machine;
  onClose: () => void;
}

interface ExecutionResult {
  output: string;
  exit_code: number;
}

const DeployModal: React.FC<DeployModalProps> = ({
  open,
  machine,
  onClose,
}) => {
  const { message: messageApi } = App.useApp();
  const [deployLoading, setDeployLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [resultType, setResultType] = useState<'deploy' | 'clear' | null>(null);

  const handleDeploy = async () => {
    if (!machine?.id) {
      messageApi.error('Invalid machine');
      return;
    }

    setDeployLoading(true);
    try {
      const res = await deployNode({ id: machine.id });
      if (res?.code === 0 && res?.data) {
        setResult(res.data);
        setResultType('deploy');
        messageApi.success('节点部署完成');
      } else {
        messageApi.error(res?.msg || '部署失败');
      }
    } catch (error: any) {
      messageApi.error(error?.message || '部署出错');
    } finally {
      setDeployLoading(false);
    }
  };

  const handleClear = async () => {
    if (!machine?.id) {
      messageApi.error('Invalid machine');
      return;
    }

    setClearLoading(true);
    try {
      const res = await clearNode({ id: machine.id });
      if (res?.code === 0 && res?.data) {
        setResult(res.data);
        setResultType('clear');
        messageApi.success('节点清除完成');
      } else {
        messageApi.error(res?.msg || '清除失败');
      }
    } catch (error: any) {
      messageApi.error(error?.message || '清除出错');
    } finally {
      setClearLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setResultType(null);
    onClose();
  };

  return (
    <Modal
      title={`部署节点 - ${machine?.name || 'Unknown'}`}
      open={open}
      onCancel={handleClose}
      width={800}
      footer={[
        <Button key="close" onClick={handleClose}>
          关闭
        </Button>,
        <Button
          key="deploy"
          type="primary"
          loading={deployLoading}
          onClick={handleDeploy}
          disabled={result !== null}
        >
          部署节点
        </Button>,
        <Button
          key="clear"
          danger
          loading={clearLoading}
          onClick={handleClear}
          disabled={result !== null}
        >
          清除节点
        </Button>,
      ]}
    >
      <div style={{ minHeight: '200px' }}>
        {!result ? (
          <Spin spinning={deployLoading || clearLoading} tip="正在执行...">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px',
              }}
            >
              <Empty description="选择操作开始" />
              <div
                style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}
              >
                点击下方按钮执行相应操作
              </div>
            </div>
          </Spin>
        ) : (
          <div>
            <Result
              status={result.exit_code === 0 ? 'success' : 'error'}
              title={result.exit_code === 0 ? '执行成功' : '执行失败'}
              subTitle={`退出码: ${result.exit_code}`}
              extra={
                <Button type="primary" onClick={() => setResult(null)}>
                  执行新操作
                </Button>
              }
            />
            <Divider />
            <div style={{ marginTop: '16px' }}>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                执行输出：
              </div>
              <pre
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '4px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: '12px',
                  lineHeight: '1.5',
                }}
              >
                {result.output || '(无输出)'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DeployModal;
