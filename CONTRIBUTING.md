# 贡献指南 / Contributing Guide

感谢您对 Astro-Theme-Shyne 的兴趣！我们欢迎任何形式的贡献，包括但不限于 bug 修复、功能增强、文档改进、翻译等。

---

## 行为准则 / Code of Conduct

请阅读并遵守我们的 [行为准则](CODE_OF_CONDUCT.md)。我们致力于为本项目营造一个友好、包容的社区环境。

---

## 如何贡献 / How to Contribute

### 报告 Bug / Reporting Bugs

如果您发现了 bug，请通过 GitHub Issues 报告。请包含以下信息：

1. **Bug 描述** - 清晰描述问题
2. **复现步骤** - 详细的步骤以复现问题
3. **预期行为** - 您期望的行为
4. **实际行为** - 实际发生的行为
5. **截图/日志** - 如果有的话，提供相关截图或错误日志
6. **环境信息** - 浏览器、操作系统、Node.js 版本等

### 功能建议 / Feature Requests

我们欢迎新功能的建议！请通过 GitHub Issues 提交，并包含：

1. **功能描述** - 清晰描述您希望添加的功能
2. **使用场景** - 这个功能解决什么问题？
3. **替代方案** - 您是否有其他的解决方案？

### 提交代码 / Submitting Code

#### 开发环境准备

```bash
# 1. Fork 本仓库
# 2. 克隆到本地
git clone https://github.com/YOUR-USERNAME/Astro-Theme-Shyne.git
cd Astro-Theme-Shyne

# 3. 安装依赖
pnpm install

# 4. 创建特性分支
git checkout -b feature/your-feature-name
```

#### 开发流程

```bash
# 启动开发服务器
pnpm dev

# 运行类型检查
pnpm astro check

# 构建测试
pnpm build
```

#### 代码规范

- 使用 **TypeScript** 进行开发
- 遵循项目现有的代码风格
- 使用 **Prettier** 格式化代码：
  ```bash
  pnpm prettier
  ```
- 确保通过 TypeScript 类型检查

#### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范提交信息：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Type 类型：**

| Type       | Description                        |
| :--------- | :--------------------------------- |
| `feat`     | 新功能                             |
| `fix`      | Bug 修复                           |
| `docs`     | 文档更新                           |
| `style`    | 代码格式调整（不影响功能）         |
| `refactor` | 代码重构（既不是新功能也不是修复） |
| `perf`     | 性能优化                           |
| `test`     | 测试相关                           |
| `chore`    | 构建过程或辅助工具变动             |

**示例：**

```bash
git commit -m "feat(photos): add lightbox preview for gallery"
git commit -m "fix(search): resolve issue with special characters"
git commit -m "docs(readme): update installation instructions"
```

### Pull Request 流程

1. 确保代码符合规范并通过测试
2. 更新相关文档（如有必要）
3. 提交 Pull Request 到 `main` 分支
4. 填写 PR 模板中的所有必填项
5. 等待代码审查

---

## 署名与许可证合规 / Attribution and License Compliance

为遵循开源社区通用实践并保持许可链路清晰，请注意：

1. 本项目基于 MIT 许可证发布，分发时必须保留原始许可证与版权声明。
2. 若你的衍生项目基于本仓库，建议在 README、Credits 页面或网站页脚提供可见署名。
3. 提交 PR 时，如引入第三方代码或资源，请在描述中注明来源与许可证。

推荐署名示例 / Suggested credit line:

```text
Based on Astro Theme Shyne by FuTseYi:
https://github.com/FuTseYi/Astro-Theme-Shyne
```

---

## 项目结构 / Project Structure

```
Astro-Theme-Shyne/
├── src/
│   ├── components/     # UI 组件
│   │   ├── base/       # 基础组件
│   │   ├── posts/      # 博客相关组件
│   │   ├── projects/   # 项目相关组件
│   │   ├── photos/    # 相册相关组件 ✨
│   │   └── ui/         # shadcn 风格 UI 组件
│   ├── content/        # 内容集合
│   │   ├── blog/       # 博客文章
│   │   ├── projects/   # 项目作品
│   │   ├── experience/ # 经历时间线
│   │   └── photos/     # 相册时间线
│   ├── layouts/        # 页面布局
│   ├── lib/            # 工具函数与数据处理
│   ├── pages/          # 路由页面
│   ├── plugins/        # 自定义 remark/rehype 插件
│   └── styles/         # 全局样式
├── public/             # 静态资源
├── scripts/            # 辅助脚本
└── package.json
```

---

## 组件开发指南 / Component Development Guide

### 创建新组件

1. **Astro 组件**：放在 `src/components/` 对应目录下
2. **React 组件**：放在 `src/components/` 并使用 `.tsx` 扩展名
3. **UI 组件**：参考 `src/components/ui/` 下的 shadcn 风格组件模式

### 使用 shadcn 风格

项目使用 `class-variance-authority` 和 `tailwind-merge` 管理组件变体：

```typescript
import { cva, type VariantProps } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={twMerge(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

---

## 文档 / Documentation

- [README.md](README.md) - 项目概览与快速开始
- [CHANGELOG.md](CHANGELOG.md) - 变更日志
- [在线文档](https://shyne.xieyi.org) - 实时演示站点

---

## 许可证 / License

贡献本项目即表示您同意您的代码将按 [MIT 许可证](LICENSE) 发布。

---

感谢您的贡献！🎉
