import ajax from 'src/commons/ajax';
import {
    getLoginUser,
    isLoginPage,
    formatMenus,
} from '@ra-lib/admin';

/**
 * 获取菜单
 * @returns {Promise<*[]|*>}
 */
async function getMenuData() {
    // 登录页面，不加载
    if (isLoginPage()) return [];

    // 获取服务端数据，并做缓存，防止多次调用接口
    return getMenuData.__CACHE = getMenuData.__CACHE
        || ajax.get('/userMenus', {userId: getLoginUser()?.id})
            .then(res => res.map(item => ({...item, order: item.order || item.ord || item.sort})));

    // 前端硬编码菜单
    // return [
    //     {id: 1, title: '系统管理', order: 900, type: 1},
    //     {id: 2, parentId: 1, title: '用户管理', path: '/users', order: 900, type: 1},
    //     {id: 3, parentId: 1, title: '角色管理', path: '/roles', order: 900, type: 1},
    //     {id: 4, parentId: 1, title: '菜单管理', path: '/menus', order: 900, type: 1},
    // ];
}

/**
 * 获取系统菜单
 * @returns {Promise<T[]>}
 */
export async function getMenus() {
    // mock时，做个延迟处理，否则菜单请求无法走mock
    if (process.env.REACT_APP_MOCK) await new Promise(resolve => setTimeout(resolve));

    const serverMenus = await getMenuData();
    const menus = serverMenus.filter(item => !item.type || item.type === 1)
        .map(item => {
            return {
                ...item,
                id: `${item.id}`,
                parentId: `${item.parentId}`,
            };
        });

    return formatMenus(menus);
}

/**
 * 获取用户收藏菜单
 * @returns {Promise<*>}
 */
export async function getCollectedMenus() {
    // 登录页面，不加载
    if (isLoginPage()) return [];

    const loginUser = getLoginUser();
    const data = await ajax.get('/userCollectMenus', {userId: loginUser?.id});
    // const data = [];

    const menus = data
        .filter(item => item.type === 1)
        .map(item => ({...item, isCollectedMenu: true}));

    return formatMenus(menus);
}

/**
 * 保存用户收藏菜单
 * @param menuId
 * @param collected
 * @returns {Promise<void>}
 */
export async function saveCollectedMenu({menuId, collected}) {
    await ajax.post('/userCollectMenus', {userId: getLoginUser()?.id, menuId, collected});
}

/**
 * 获取用户权限码
 * @returns {Promise<*[string]>}
 */
export async function getPermissions() {
    const serverMenus = await getMenuData();
    return serverMenus.filter(item => item.type === 2)
        .map(item => item.code);
}

/**
 * 获取子应用配置
 * @returns {Promise<*[{title, name, entry}]>}
 */
export async function getSubApps() {
    // 从菜单数据中获取需要注册的乾坤子项目
    const menuTreeData = await getMenus() || [];
    let result = [];
    const loop = nodes => nodes.forEach(node => {
        const {_target, children} = node;
        if (_target === 'qiankun') {
            const {title, name, entry} = node;
            result.push({
                title,
                name,
                entry,
            });
        }
        if (children?.length) loop(children);
    });
    loop(menuTreeData);

    return result;
}
