import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Row, Col } from 'antd';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import type { ProjectItem } from '@/services/project/types';

const ProjectPage: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  return (
    <PageContainer header={{ title: '项目管理' }}>
      <Row gutter={24} wrap={false} style={{ alignItems: 'flex-start' }}>
        {/* Left Column: Project List */}
        <Col
          flex="420px"
          style={{
            minWidth: 420,
            position: 'sticky',
            top: 24, // Keep it pinned near the top of the viewport when scrolling
            height: 'calc(100vh - 120px)', // Fixed height based on viewport
          }}
        >
          <ProjectList
            selectedProject={selectedProject}
            onSelect={setSelectedProject}
          />
        </Col>

        {/* Right Column: Project Detail & Resources */}
        <Col
          flex="auto"
          style={{
            minWidth: 0,
            paddingLeft: 32,
            minHeight: 'calc(100vh - 120px)',
          }}
        >
          <ProjectDetail project={selectedProject} onProjectUpdate={(updated) => setSelectedProject(updated)} />
        </Col>
      </Row>
    </PageContainer>
  );
};

export default ProjectPage;
