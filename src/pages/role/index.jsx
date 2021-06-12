import {useState} from 'react';
import config from 'src/commons/config-hoc';
import {Button, Form, Space} from 'antd';
import {
    PageContent,
    QueryBar,
    FormItem,
    Table,
    Pagination,
    Operator,
    ToolBar,
} from '@ra-lib/components';
import EditModal from './EditModal';
import styles from './style.less';
import {IS_MOBILE, IS_MAIN_APP} from 'src/config';
import options from 'src/options';

export default config({
    path: '/roles',
})(function Role(props) {
    const [loading, setLoading] = useState(false);
    const [pageNum, setPageNum] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [conditions, setConditions] = useState({});
    const [record, setRecord] = useState(null);
    const [visible, setVisible] = useState(false);
    const [form] = Form.useForm();

    const params = {
        ...conditions,
        pageNum,
        pageSize,
    };

    // 获取列表
    const {
        data: {
            dataSource,
            total,
        } = {},
    } = props.ajax.useGet('/roles', params, [conditions, pageNum, pageSize], {
        setLoading,
        // mountFire: false, // 初始化不查询
        formatResult: res => {
            return {
                // 只有自定义角色显示
                dataSource: (res?.list || []).filter(item => item.type === 3),
                total: res?.total || 0,
            };
        },
    });

    // 删除
    const {run: deleteRole} = props.ajax.useDel('/roles/:id', null, {setLoading, successTip: '删除成功！'});

    let columns = [
        {title: '角色名称', dataIndex: 'name'},
        {title: '启用', dataIndex: 'enable', render: value => options.enable.getTag(!!value)},
        {title: '备注', dataIndex: 'remark'},
        {
            title: '操作', dataIndex: 'operator', width: 100,
            render: (text, record) => {
                const {id, name} = record;
                const items = [
                    {
                        label: '编辑',
                        onClick: () => setRecord(record) || setVisible(true),
                    },
                    {
                        label: '删除',
                        color: 'red',
                        confirm: {
                            title: `您确定删除「${name}」吗？`,
                            onConfirm: () => handleDelete(id),
                        },
                    },
                ];
                return <Operator items={items}/>;
            },
        },
    ];
    if (IS_MAIN_APP) {
        columns = [
            {title: '归属系统', dataIndex: 'systemName'},
            ...columns,
        ];
    }

    async function handleDelete(id) {
        await deleteRole(id);

        // 触发查询
        setConditions({...conditions});
    }

    const layout = {
        wrapperCol: {style: {width: 200}},
    };

    return (
        <PageContent fitHeight className={styles.root} loading={loading}>
            <QueryBar>
                <Form
                    name="role"
                    layout="inline"
                    form={form}
                    onFinish={values => {
                        setPageNum(1);
                        setConditions(values);
                    }}
                >
                    <FormItem
                        {...layout}
                        label="角色名称"
                        name="name"
                    />
                    <FormItem>
                        <Space>
                            <Button type="primary" htmlType="submit">查询</Button>
                            <Button htmlType="reset">重置</Button>
                        </Space>
                    </FormItem>
                </Form>
            </QueryBar>
            <ToolBar>
                <Button type="primary" onClick={() => setRecord(null) || setVisible(true)}>添加</Button>
            </ToolBar>
            <Table
                fitHeight={!IS_MOBILE}
                scroll={IS_MOBILE ? {x: 1000} : undefined}
                dataSource={dataSource}
                columns={columns}
                rowKey="id"
                pagination={false}
            />
            <Pagination
                total={total}
                pageNum={pageNum}
                pageSize={pageSize}
                onPageNumChange={setPageNum}
                onPageSizeChange={pageSize => setPageNum(1) || setPageSize(pageSize)}
            />
            <EditModal
                fullScreen={IS_MOBILE}
                width={IS_MOBILE ? '100%' : '70%'}
                visible={visible}
                isEdit={!!record}
                record={record}
                onOk={() => setVisible(false) || setConditions({...conditions})}
                onCancel={() => setVisible(false)}
            />
        </PageContent>
    );
});
