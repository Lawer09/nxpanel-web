## 邀请礼品卡路由变更后 HMR 缓存导致报错

### 出现场景

将邀请礼品卡菜单从顶层移至业务管理组后，打开邀请礼品卡页面报 `ReferenceError: Drawer is not defined`。

### 问题原因

旧版本 IssueLogDrawer 组件使用 `Drawer`，修改为 `Modal` 后，HMR（热模块替换）缓存了旧的编译产物，导致运行时引用了已从 import 中移除的 `Drawer`。该错误仅在开发环境 HMR 模式下出现。

### 解决方式

全量刷新页面（非 HMR 热更新），清除旧的编译缓存即可。关闭页面重新打开开发服务器也可解决。

### 影响范围

- `src/pages/invite-gift-card/components/IssueLogDrawer.tsx`

## Modal destroyOnClose 过时

### 出现场景

使用 Modal 的 `destroyOnClose` 属性时控制台出现 deprecation 警告。

### 问题原因

Ant Design 5.x 已将 `destroyOnClose` 重命名为 `destroyOnHidden`。

### 解决方式

将 `destroyOnClose` 替换为 `destroyOnHidden`。

### 影响范围

- `src/pages/invite-gift-card/components/IssueLogDrawer.tsx`
