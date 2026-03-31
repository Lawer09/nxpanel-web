import { CheckCircleOutlined, MailOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './result.less';

interface UserInfo {
  email?: string;
  is_admin?: boolean;
  token?: string;
}

const RegisterResultPage: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // 获取用户信息
    const userInfoStr = localStorage.getItem('user_info');
    if (!userInfoStr) {
      // 如果没有注册信息，重定向到注册页面
      history.push('/user/register');
      return;
    }

    try {
      const info = JSON.parse(userInfoStr);
      setUserInfo(info);
    } catch (_e) {
      history.push('/user/register');
    }

    // 倒计时跳转
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          history.push('/');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGoHome = () => {
    history.push('/');
  };

  const handleGoLogin = () => {
    history.push('/user/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Result
          status="success"
          title="注册成功！"
          subTitle="感谢您的注册，您的账户已成功创建。"
          extra={[
            <Button
              type="primary"
              key="home"
              size="large"
              onClick={handleGoHome}
            >
              进入首页
            </Button>,
            <Button key="login" size="large" onClick={handleGoLogin}>
              返回登录
            </Button>,
          ]}
        />

        {userInfo && (
          <Card className={styles.infoCard}>
            <div className={styles.infoContent}>
              <div className={styles.infoItem}>
                <MailOutlined className={styles.infoIcon} />
                <div className={styles.infoText}>
                  <span className={styles.infoLabel}>注册邮箱</span>
                  <span className={styles.infoValue}>{userInfo.email}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <CheckCircleOutlined className={styles.infoIcon} />
                <div className={styles.infoText}>
                  <span className={styles.infoLabel}>账户状态</span>
                  <span className={styles.infoValue}>
                    {userInfo.is_admin ? '管理员' : '普通用户'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.countdownInfo}>
              <p>
                系统将在 <span className={styles.countdown}>{countdown}</span>{' '}
                秒后自动跳转到首页
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RegisterResultPage;
