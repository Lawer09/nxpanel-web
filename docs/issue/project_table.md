## CSV 导入映射步骤感知缺失

### 出现场景

项目管理页使用 CSV 导入时，上传文件后会立刻进入预览态，用户容易误以为没有“字段选择与字段对应”这一步。

### 问题原因

导入弹窗原本把上传和字段映射都放在同一个步骤里，但上传成功后直接切到下一步，导致映射能力虽然存在，流程感知却被跳过。

### 解决方式

将导入流程拆分为四个显式步骤：上传 CSV、字段映射、导入预览、导入结果；上传成功后固定进入字段映射步骤，并保留自动预匹配和手动修正能力。

### 影响范围

项目管理页 CSV 导入弹窗。

### 相关文件

- `src/pages/project-table/components/ProjectBatchImportModal.tsx`

## CSV 导入缺少项目代号行误拦截

### 出现场景

项目管理页导入 CSV 时，只要存在任意一行缺少 `projectCode`，整次导入都会被前端阻塞。

### 问题原因

原实现将“缺少项目代号”视为全局致命错误，而不是单行无效数据，导致其它有效行也无法提交。

### 解决方式

保留 `projectCode` 作为必需映射字段，但将缺少项目代号的具体数据行改为预览中标记“跳过：缺少项目代号”，提交时自动从 payload 中排除；只有全部行都无效时才阻止提交。

### 影响范围

项目管理页 CSV 导入弹窗。

### 相关文件

- `src/pages/project-table/components/ProjectBatchImportModal.tsx`

## CSV 多行字段被错误拆行

### 出现场景

项目管理页导入由 Excel/WPS 导出的 CSV 时，像 `Admob广告ID` 这类单元格内包含多行文本的数据，会在预览里出现伪记录，甚至把 `原生：ca-app-pub-...` 一类内容误识别成 `projectCode`。

### 问题原因

CSV 中引号包裹的字段允许包含换行和逗号，Excel/WPS 能正常显示，但前端若使用“先按换行拆记录，再按逗号拆字段”的简化解析方式，就会把引号内换行误拆成新记录。

### 解决方式

项目管理 CSV 导入改为使用标准 CSV 解析库处理完整文本流，正确支持引号内换行、引号内逗号、双引号转义和 BOM，避免多行字段错位。

### 影响范围

项目管理页 CSV 导入弹窗。其它仍在使用简化 CSV 解析的导入弹窗存在同类技术风险，但本次未一并改动。

### 相关文件

- `src/pages/project-table/components/ProjectBatchImportModal.tsx`

## 无表头项目块粘贴导入识别规则

### 出现场景

项目管理页除了上传 CSV 外，还需要支持直接粘贴一整段无表头、按行排列的项目块信息，例如包含项目代号、负责人、域名状态、Admob 配置、Yandex 信息和 Firebase JSON 的混合文本。

### 问题原因

这类数据没有表头，也没有稳定列顺序，无法复用 CSV 的字段映射逻辑；如果直接按固定顺序入库，极易把阶段信息、未识别文本或多行配置错误写入正式字段。

### 解决方式

在导入弹窗中新增“粘贴文本”模式，固定以 `projectCode` 行作为记录边界锚点，再按字段特征自动识别 `ownerName`、`adspowerEnv`、`developerGmail`、`packageName`、`admobAppId`、`admobAdIds`、`storePageUrl` 等高置信度字段；`白包在线 / 完整包在线 / 白包开发中 / UI完毕 / 下架` 统一并入 `remark`，不污染现有 `status / adStatus` 口径。

### 影响范围

项目管理页导入弹窗的粘贴文本模式。

### 相关文件

- `src/pages/project-table/components/ProjectBatchImportModal.tsx`
- `src/pages/project-table/pasteImport.ts`

## 粘贴导入异常内容保守跳过

### 出现场景

粘贴的项目块中可能包含无法识别的大段文本、字段冲突，或缺少 `projectCode` 的不完整记录。

### 问题原因

无表头项目块的字段边界依赖启发式规则识别，置信度低于 CSV 表头映射；若前端对低置信度内容也强行落库，会把非结构化文本写进错误字段。

### 解决方式

粘贴导入采用“自动识别 + 异常跳过”的保守策略：缺少 `projectCode` 的记录标记为“跳过”，存在字段冲突或未识别内容的记录标记为“异常”，预览中保留状态提示，但提交到 `batch-save` 时仅发送“有效”记录。

### 影响范围

项目管理页导入弹窗的粘贴文本预览与提交逻辑。

### 相关文件

- `src/pages/project-table/components/ProjectBatchImportModal.tsx`
- `src/pages/project-table/pasteImport.ts`

## 粘贴导入项目代号误判

### 出现场景

项目管理页使用粘贴文本导入时，像 `cd91303bd4aee6a86f30f47c714c6bd9` 这类 Facebook token / hash 文本，曾被误识别为新记录起点，导致后续字段错位。

### 问题原因

项目代号起始行的识别规则过宽，只要是普通字母数字串就可能被当成 `projectCode`，无法和哈希串、token 串区分。

### 解决方式

将粘贴导入的项目代号规则收紧为白名单：仅接受 `Demumu` 特例，或 `一个大写字母 + 数字 + 可选一个大写字母` 的格式，例如 `A001`、`A042`、`A12B`。不符合该规则的长串文本一律不作为记录边界。

### 影响范围

项目管理页粘贴文本导入的记录切分逻辑。

### 相关文件

- `src/pages/project-table/pasteImport.ts`

## 粘贴导入异常原因展示过于模糊

### 出现场景

项目管理页使用粘贴文本导入时，预览中如果某条记录被标记为“异常：字段冲突”，用户只能看到笼统状态，无法直接判断究竟是哪个字段冲突。

### 问题原因

预览状态只显示异常大类，没有把解析器返回的具体错误明细透出，也没有把内部字段名翻译为导入界面的中文字段名。

### 解决方式

在粘贴导入预览表中新增“异常说明”列，并为异常状态 tag 增加 tooltip，直接展示解析器返回的错误明细；对 `字段冲突：facebookAppToken` 这类内部字段标识，前端按导入字段定义翻译为中文名称后再展示。对于字段冲突，还会同时展示“已有值 / 新值”，便于直接判断哪一段文本触发了冲突。为了避免这两列长期占据过多横向空间，状态和异常说明均改为单行缩略展示，悬浮后再查看完整内容。

### 影响范围

项目管理页粘贴文本导入的预览表展示。

### 相关文件

- `src/pages/project-table/components/ProjectBatchImportModal.tsx`

## 粘贴导入 URL 字段识别不稳定

### 出现场景

项目管理页使用粘贴文本导入时，像 `https://play.google.com/store/apps/details?...`、`privacy_policy.html`、`terms_of_use.html` 这类链接，若仅按宽泛关键字识别，容易与普通域名 URL 混淆。

### 问题原因

原解析规则对 URL 字段更多依赖 `privacy / terms` 这类模糊关键字，未把商店页、隐私协议、服务条款三类链接作为独立识别规则处理。

### 解决方式

将粘贴导入的 URL 识别规则细化为三条严格匹配：
- 包含 `play.google.com/store/apps/details` 的链接识别为 `商店页链接`
- 包含 `privacy_policy.html` 的链接识别为 `隐私协议 URL`
- 包含 `terms_of_use.html` 的链接识别为 `服务条款 URL`

同时保留已有的 `privacy.html / terms.html` 兼容；若未命中这些规则，则不会错误回退成上述字段，而是继续走普通 URL 识别。

### 影响范围

项目管理页粘贴文本导入的 URL 字段自动识别。

### 相关文件

- `src/pages/project-table/pasteImport.ts`

## 粘贴导入 Yandex 账号与广告位混淆

### 出现场景

项目管理页使用粘贴文本导入时，Yandex 相关文本同时包含账号、未接入状态和广告位 ID，容易在自动识别时落错字段。

### 问题原因

原规则对 `Yandex` 前缀判断过宽，可能把带 `Yandex` 前缀的广告位文本误判为账号信息。

### 解决方式

将 Yandex 规则收紧为：
- `lincoliver@yandex.com` 这类邮箱识别为 `Yandex账号`
- `未分配账号` 识别为 `Yandex账号`
- 带 `Yandex` 前缀的状态或广告位文本统一识别为 `Yandex广告ID`
- 其中符合 `R-M-xxx-x` 格式的广告位文本继续归并进同一字段

### 影响范围

项目管理页粘贴文本导入的 Yandex 字段自动识别。

### 相关文件

- `src/pages/project-table/pasteImport.ts`
