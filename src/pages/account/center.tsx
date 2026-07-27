import { PageContainer, ProForm, ProFormText } from '@ant-design/pro-components';
import { App, Card, Form, Space, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { history, useModel } from '@umijs/max';
import { getUserProfile, updateUserProfile } from '@/services/auth/api';
import {
  clearOperationSession,
  updateCachedOperationUserInfo,
} from '@/services/auth/session';

const { Text } = Typography;
const hasWhitespace = (value?: string) => /\s/.test(value || '');

const AccountCenterPage: React.FC = () => {
  const { message } = App.useApp();
  const { initialState, setInitialState } = useModel('@@initialState');
  const [form] = Form.useForm<API.UserProfileUpdateParams>();
  const [profile, setProfile] = useState<API.UserProfile>();
  const [loading, setLoading] = useState(false);
  const cachedEmail = initialState?.currentUser?.email;
  const cachedNickname = initialState?.currentUser?.nickname;

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await getUserProfile();
      if (res.code !== 0) {
        message.error(res.msg || '获取个人信息失败');
        return;
      }
      setProfile(res.data);
      form.setFieldsValue({
        email: res.data.email,
        nickname: res.data.nickname || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      email: cachedEmail,
      nickname: cachedNickname || undefined,
    });
    void loadProfile();
  }, []);

  return (
    <PageContainer title="个人中心">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card loading={loading} size="small">
          <Space direction="vertical" size={6}>
            <Space size={8} wrap>
              <Text strong>{profile?.displayName || initialState?.currentUser?.name || '-'}</Text>
              {profile?.isAdmin ? <Tag color="gold">管理员</Tag> : null}
            </Space>
            <Text type="secondary">{profile?.email || initialState?.currentUser?.email || '-'}</Text>
          </Space>
        </Card>

        <Card title="个人信息" size="small">
          <ProForm<API.UserProfileUpdateParams>
            form={form}
            initialValues={{
              email: cachedEmail,
              nickname: cachedNickname || undefined,
            }}
            layout="vertical"
            submitter={{
              searchConfig: {
                submitText: '保存',
                resetText: '重置',
              },
            }}
            onReset={() => {
              form.setFieldsValue({
                email: profile?.email,
                nickname: profile?.nickname || undefined,
                password: undefined,
              });
            }}
            onFinish={async (values) => {
              const passwordChanged = !!values.password;
              const res = await updateUserProfile({
                email: values.email.trim(),
                nickname: values.nickname?.trim() || null,
                password: values.password || undefined,
              });
              if (res.code !== 0) {
                message.error(res.msg || '保存失败');
                return false;
              }

              setProfile(res.data);
              form.setFieldsValue({
                email: res.data.email,
                nickname: res.data.nickname || undefined,
                password: undefined,
              });
              updateCachedOperationUserInfo({
                email: res.data.email,
                nickname: res.data.nickname ?? null,
              });
              if (passwordChanged) {
                clearOperationSession();
                setInitialState((state) => ({
                  ...state,
                  currentUser: undefined,
                }));
                message.success('密码已更新，请重新登录');
                history.replace('/user/login?mode=operation');
                return true;
              }
              setInitialState((state) => ({
                ...state,
                currentUser: state?.currentUser
                  ? {
                      ...state.currentUser,
                      email: res.data.email,
                      nickname: res.data.nickname ?? null,
                      name: res.data.displayName || res.data.email,
                    }
                  : state?.currentUser,
              }));
              message.success('个人信息已更新');
              return true;
            }}
          >
            <ProFormText
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '邮箱格式不正确' },
              ]}
              width="md"
            />
            <ProFormText name="nickname" label="昵称" width="md" placeholder="无昵称时显示邮箱" />
            <ProFormText.Password
              name="password"
              label="密码"
              width="md"
              placeholder="不填则不修改"
              rules={[
                { min: 8, message: '密码至少8位' },
                {
                  validator: async (_, value) => {
                    if (!value || !hasWhitespace(value)) return;
                    throw new Error('密码不能包含空格、换行等空白字符');
                  },
                },
              ]}
            />
          </ProForm>
        </Card>
      </Space>
    </PageContainer>
  );
};

export default AccountCenterPage;
