import {useState} from 'react';
import {Card, Row, Col, Form} from 'antd';
import config from 'src/commons/config-hoc';
import {ModalContent, FormItem, Content} from '@ra-lib/components';
import {useDebounceValidator} from '@ra-lib/hooks';
import MenuTableSelect from 'src/pages/menus/MenuTableSelect';
import {IS_MOBILE, IS_MAIN_APP} from 'src/config';
import options, {useOptions} from 'src/options';

export default config({
    modal: {
        title: props => props.isEdit ? '编辑角色' : '创建角色',
        width: '70%',
        top: 50,
    },
})(function Edit(props) {
    const {record, isEdit, onOk} = props;
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [systemOptions] = useOptions(options.system);

    // 获取详情 data为表单回显数据
    props.ajax.useGet(`/roles/${record?.id}`, null, [], {
        setLoading,
        mountFire: isEdit, // 组件didMount时，只有编辑时才触发请求
        formatResult: res => {
            if (!res) return;
            const values = {
                ...res,
            };
            form.setFieldsValue(values);
        },
    });
    // 添加请求
    const {run: saveRole} = props.ajax.usePost('/roles', null, {setLoading, successTip: '创建成功！'});
    // 更新请求
    const {run: updateRole} = props.ajax.usePut('/roles', null, {setLoading, successTip: '修改成功！'});
    const {run: fetchRoleByName} = props.ajax.useGet('/roleByName');

    async function handleSubmit(values) {
        const params = {
            ...values,
        };

        if (isEdit) {
            await updateRole(params);
        } else {
            await saveRole(params);
        }

        onOk();
    }

    const checkName = useDebounceValidator(async (rule, value) => {
        if (!value) return;

        const systemId = form.getFieldValue('systemId');
        const role = await fetchRoleByName({name: value, systemId});
        if (!role) return;

        const id = form.getFieldValue('id');
        if (isEdit && role.id !== id && role.name === value) throw Error('角色名不能重复！');
        if (!isEdit && role.name === value) throw Error('角色名不能重复！');
    });

    const layout = {labelCol: {flex: '100px'}};
    const colLayout = {
        xs: {span: 24},
        sm: {span: 12},
    };
    return (
        <ModalContent
            loading={loading}
            okText="保存"
            onOk={() => form.submit()}
            cancelText="重置"
            onCancel={() => form.resetFields()}
        >
            <Form
                form={form}
                name="roleEdit"
                onFinish={handleSubmit}
                initialValues={{enable: true}}
            >
                {isEdit ? <FormItem hidden name="id"/> : null}

                <Row gutter={8}>
                    <Col {...colLayout} style={{marginBottom: IS_MOBILE ? 16 : 0}}>
                        <Card title="基础信息">
                            <Content fitHeight={!IS_MOBILE} otherHeight={160}>
                                {IS_MAIN_APP ? (
                                    <FormItem
                                        {...layout}
                                        label="归属系统"
                                        name="systemId"
                                        required
                                        options={systemOptions}
                                        onChange={() => {
                                            form.setFieldsValue({menuIds: []});
                                        }}
                                    />
                                ) : null}
                                <FormItem
                                    {...layout}
                                    label="角色名称"
                                    name="name"
                                    required
                                    noSpace
                                    maxLength={50}
                                    rules={[
                                        {validator: checkName},
                                    ]}
                                />
                                <FormItem
                                    {...layout}
                                    type={'switch'}
                                    label="启用"
                                    name="enable"
                                    checkedChildren="启"
                                    unCheckedChildren="禁"
                                    required
                                />
                                <FormItem
                                    {...layout}
                                    type="textarea"
                                    label="备注"
                                    name="remark"
                                    maxLength={250}
                                />
                            </Content>
                        </Card>
                    </Col>
                    <Col {...colLayout}>
                        <Card title="权限配置" bodyStyle={{padding: 0}}>
                            <FormItem shouldUpdate noStyle>
                                {({getFieldValue}) => {
                                    const systemId = getFieldValue('systemId');
                                    return (
                                        <FormItem
                                            {...layout}
                                            name="menuIds"
                                        >
                                            <MenuTableSelect
                                                topId={IS_MAIN_APP ? systemId : undefined}
                                                fitHeight
                                                otherHeight={200}
                                            />
                                        </FormItem>
                                    );
                                }}
                            </FormItem>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </ModalContent>
    );
});
