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
            height: 'calc(100vh - 150px)', // Fixed height based on viewport
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 16 }}>
            <ProjectList
              selectedProject={selectedProject}
              onSelect={setSelectedProject}
            />
          </div>
        </Col>

        {/* Right Column: Project Detail & Resources */}
        <Col
          flex="auto"
          style={{
            minWidth: 0,
            paddingLeft: 24,
            borderLeft: '1px solid #e8e8e8', // Visual separator
            minHeight: 'calc(100vh - 150px)', // Ensure border spans full height
            background: 'linear-gradient(90deg, rgba(250,250,250,1) 0%, rgba(255,255,255,0) 15px)', // Subtle gradient shadow
          }}
        >
          <div style={{ paddingRight: 8 }}>
            <ProjectDetail project={selectedProject} onProjectUpdate={(updated) => setSelectedProject(updated)} />
          </div>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default ProjectPage;
