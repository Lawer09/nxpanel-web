import React from 'react';
import ProTable from '@ant-design/pro-table';

const MachineManagementPage = () => {
    const columns = [
        {
            title: 'Machine Name',
            dataIndex: 'name',
            valueType: 'text',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            valueType: 'text',
        },
        {
            title: 'Last Maintenance',
            dataIndex: 'lastMaintenance',
            valueType: 'date',
        },
        {
            title: 'Actions',
            valueType: 'option',
            render: (text, record) => [
                <a key="edit" href={`/machine/edit/${record.key}`}>Edit</a>,
                <a key="delete" href={`/machine/delete/${record.key}`}>Delete</a>,
            ],
        },
    ];

    return (
        <ProTable
            columns={columns}
            request={async () => {
                return {
                    data: [],
                    success: true,
                };
            }}
            rowKey="key"
            pagination={{ pageSize: 10 }}
            search={{
                filterType: 'light',
            }}
            toolBarRender={() => [
                <a key="add" href='/machine/add'>Add Machine</a>,
            ]}
        />
    );
};

export default MachineManagementPage;
