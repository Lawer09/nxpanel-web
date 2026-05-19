import React from 'react';
import { DashboardProvider } from './DashboardContext';
import TrafficPlatformContent from './components/TrafficPlatformContent';

const TrafficDashboardPage: React.FC = () => {
  return (
    <DashboardProvider>
      <TrafficPlatformContent />
    </DashboardProvider>
  );
};

export default TrafficDashboardPage;
