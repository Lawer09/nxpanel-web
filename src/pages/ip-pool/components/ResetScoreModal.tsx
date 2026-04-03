import { ModalForm, ProFormDigit } from '@ant-design/pro-components';
import { message } from 'antd';
import React from 'react';
import { resetIpPoolScore } from '@/services/infra/api';

type ResetScoreModalProps = {
  open: boolean;
  current?: API.IpPoolItem;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const ResetScoreModal: React.FC<ResetScoreModalProps> = ({
  open,
  current,
  onOpenChange,
  onSuccess,
}) => {
  return (
    <ModalForm<{ score: number }>
      title="重置评分"
      open={open}
      initialValues={{ score: current?.score || 0 }}
      modalProps={{
        destroyOnHidden: true,
      }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        if (!current?.id) {
          return false;
        }
        const res = await resetIpPoolScore({
          id: current.id,
          score: Number(values.score),
        });
        if (res.code !== 0) {
          message.error(res.msg || '评分重置失败');
          return false;
        }
        message.success('评分已重置');
        onSuccess();
        return true;
      }}
    >
      <ProFormDigit
        name="score"
        label="新评分"
        min={0}
        max={100}
        rules={[{ required: true, message: '请输入评分' }]}
      />
    </ModalForm>
  );
};

export default ResetScoreModal;
