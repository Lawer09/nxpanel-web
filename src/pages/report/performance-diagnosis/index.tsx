import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation } from '@umijs/max';
import { Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import NodeProbeAnalysisPage from '../node-probe-analysis';
import PerfGroupAnalysisPage from '../perf-group-analysis';

type DiagnosisTabKey = 'perf-group' | 'node-probe';

const isDiagnosisTabKey = (v: string | null): v is DiagnosisTabKey =>
  v === 'perf-group' || v === 'node-probe';

const PerformanceDiagnosisPage: React.FC = () => {
  const location = useLocation();

  const tabFromUrl = useMemo<DiagnosisTabKey>(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    return isDiagnosisTabKey(tab) ? tab : 'perf-group';
  }, [location.search]);

  const [activeTab, setActiveTab] = useState<DiagnosisTabKey>(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  return (
    <PageContainer>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          const next = key as DiagnosisTabKey;
          setActiveTab(next);
          history.replace(`${location.pathname}?tab=${next}`);
        }}
        items={[
          { key: 'perf-group', label: '性能维度', children: <PerfGroupAnalysisPage embedded /> },
          { key: 'node-probe', label: '节点状态排查', children: <NodeProbeAnalysisPage embedded /> },
        ]}
      />
    </PageContainer>
  );
};

export default PerformanceDiagnosisPage;
