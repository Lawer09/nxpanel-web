import React from 'react';
import PageTitleActions from './PageTitleActions';
import FilterPanel from './FilterPanel';
import KpiCardGrid from './KpiCardGrid';
import AnalysisSection from './AnalysisSection';
import DetailSection from './DetailSection';
import PlatformManageModal from './PlatformManageModal';
import AccountManageModal from './AccountManageModal';
import SyncTaskModal from './SyncTaskModal';
import ManualSyncDialog from './ManualSyncDialog';
import SyncErrorDialog from './SyncErrorDialog';

const TrafficPlatformContent: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <PageTitleActions />
      <FilterPanel />
      <KpiCardGrid />
      <AnalysisSection />
      <DetailSection />
      
      <PlatformManageModal />
      <AccountManageModal />
      <SyncTaskModal />
      <ManualSyncDialog />
      <SyncErrorDialog />
    </div>
  );
};

export default TrafficPlatformContent;
