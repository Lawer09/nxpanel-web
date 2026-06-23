import { Result } from 'antd';
import React from 'react';

const NoMenu: React.FC = () => (
  <Result
    status="403"
    title="暂无可用菜单"
    subTitle="请联系管理员配置权限"
  />
);

export default NoMenu;
