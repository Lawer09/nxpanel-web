### 过时方法
destroyOnClose 过时， 使用 destroyOnHidden 代替
bodyStyle 过时，使用 styles.body代替

### ModalForm / ProForm 内不能使用 React Fragment 作为直接子元素
ModalForm 内部会尝试向第一个子元素传递 `autoFocus` 属性，而 React Fragment 不支持 `autoFocus`，会导致控制台警告：
```
Invalid prop `autoFocus` supplied to `React.Fragment`.
```
**解决方式**：将 Fragment `<>` 替换为 `<div>` 包裹。例如：
```tsx
// ❌ 错误
<ModalForm>
  <>
    <ProFormText ... />
  </>
</ModalForm>

// ✅ 正确
<ModalForm>
  <div>
    <ProFormText ... />
  </div>
</ModalForm>
```

