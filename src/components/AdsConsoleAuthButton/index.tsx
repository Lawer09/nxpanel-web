import { useModel } from '@umijs/max';
import type { ButtonProps, TooltipProps } from 'antd';
import { Button, Tooltip } from 'antd';
import React from 'react';

type AdsConsoleAuthButtonProps = ButtonProps & {
  code: string;
  children?: React.ReactNode;
  tooltip?: React.ReactNode;
  tooltipProps?: Omit<TooltipProps, 'title'>;
};

const AdsConsoleAuthButton: React.FC<AdsConsoleAuthButtonProps> = ({
  code,
  children,
  tooltip,
  tooltipProps,
  ...rest
}) => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser as AdsConsole.CurrentUser | undefined;
  const permissions = currentUser?.permissions || [];
  const roles = currentUser?.roles || [];
  const hasPermission =
    currentUser?.isSuperAdmin ||
    roles.includes('SUPER_ADMIN') ||
    roles.includes('ACCOUNT_MANAGER') ||
    permissions.includes(code);

  if (!hasPermission) return null;

  const button = <Button {...rest}>{children}</Button>;

  if (!tooltip) {
    return button;
  }

  return (
    <Tooltip title={tooltip} {...tooltipProps}>
      {button}
    </Tooltip>
  );
};

export default AdsConsoleAuthButton;
