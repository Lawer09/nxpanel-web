import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, App } from 'antd';
import React from 'react';
import { sendUserMail } from '@/services/swagger/user';

type SendMailModalProps = {
  open: boolean;
  filter?: API.UserFilter[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const SendMailModal: React.FC<SendMailModalProps> = ({
  open,
  filter,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();

  return (
    <ModalForm
      title="批量发送邮件"
      open={open}
      modalProps={{ destroyOnHidden: true, width: 560 }}
      onOpenChange={onOpenChange}
      submitter={{ searchConfig: { submitText: '发送' } }}
      onFinish={async (values) => {
        const res = await sendUserMail({
          subject: values.subject,
          content: values.content,
          filter: filter,
        });
        if (res.code !== 0) {
          messageApi.error(res.msg || '发送失败');
          return false;
        }
        messageApi.success('邮件已加入发送队列');
        onSuccess();
        return true;
      }}
    >
      {filter && filter.length > 0 ? (
        <Alert
          type="info"
          showIcon
          message={`将向当前筛选的用户发送邮件（${filter.length} 个筛选条件）`}
          style={{ marginBottom: 16 }}
        />
      ) : (
        <Alert
          type="warning"
          showIcon
          message="未设置筛选条件，将向所有用户发送邮件，请谨慎操作！"
          style={{ marginBottom: 16 }}
        />
      )}
      <ProFormText
        name="subject"
        label="邮件主题"
        rules={[{ required: true, message: '请输入邮件主题' }]}
      />
      <ProFormTextArea
        name="content"
        label="邮件内容"
        rules={[{ required: true, message: '请输入邮件内容' }]}
        fieldProps={{ rows: 6 }}
      />
    </ModalForm>
  );
};

export default SendMailModal;
