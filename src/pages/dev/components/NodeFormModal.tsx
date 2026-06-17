import { App, Modal } from 'antd';
import React, { useRef } from 'react';
import { createNode, updateNode } from '@/services/node-control/api';
import SnapshotConfigEditor, { type SnapshotConfigEditorRef } from './SnapshotConfigEditor';

const NodeFormModal: React.FC<{
  open: boolean;
  node?: API.ControlNode | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}> = ({ open, node, onOpenChange, onSuccess }) => {
  const { message } = App.useApp();
  const editorRef = useRef<SnapshotConfigEditorRef>(null);

  return (
    <Modal
      title={node ? `Edit Node ${node.id}` : 'Create Node'}
      open={open}
      width={1040}
      destroyOnHidden
      onCancel={() => onOpenChange(false)}
      onOk={async () => {
        try {
          const payload = await editorRef.current?.commit();
          if (!payload) {
            message.error('Node config is missing.');
            return;
          }

          const response = node
            ? await updateNode(node.id, payload)
            : await createNode(payload);
          if (response.code !== 0) {
            message.error(response.message || (node ? 'Node update failed.' : 'Node create failed.'));
            return;
          }

          message.success(node ? 'Node updated.' : 'Node created.');
          onOpenChange(false);
          onSuccess();
        } catch (error: any) {
          message.error(error?.message || 'Node save failed.');
          return;
        }
      }}
    >
      <SnapshotConfigEditor ref={editorRef} node={node} />
    </Modal>
  );
};

export default NodeFormModal;
