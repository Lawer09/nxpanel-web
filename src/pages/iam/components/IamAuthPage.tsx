import DevAuthGate from '@/pages/dev/components/DevAuthGate';
import type React from 'react';

type IamAuthPageProps = {
  children: React.ReactNode;
};

const IamAuthPage: React.FC<IamAuthPageProps> = ({ children }) => (
  <DevAuthGate>{children}</DevAuthGate>
);

export default IamAuthPage;
