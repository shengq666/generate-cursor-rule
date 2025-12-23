
## **Overview**

这是一个用于根据前端项目的 `package.json` 自动生成工程级 Cursor Rules 配置的简单脚本。它会读取项目依赖并推断技术栈指纹（框架、UI 库、构建工具、样式方案、状态管理与 HTTP 客户端），然后输出一份基于该指纹的 `.cursorrules` 文件。

## **Quick Start**

- **Prerequisite**: 安装 `Node.js`。
- **脚本文件**: 请参考 [index.cjs](index.cjs)。
- **输入文件**: 脚本基于项目根目录的 [package.json](package.json)（同时会检测 `tsconfig.json` 来判断是否为 TypeScript）。

## **Usage**

在目标项目根目录执行（推荐）：

```bash
cd /path/to/your/project
node /path/to/generate-cursor-rule/index.cjs
```

或者将 `index.cjs` 复制到项目根后直接运行：

```bash
node index.cjs
```

运行成功后，脚本会在当前工作目录生成文件 [.cursorrules](.cursorrules) 并在终端输出识别到的“技术栈指纹”。

示例输出：

```
✅ .cursorrules 已生成
	技术栈指纹： vue3 + element-plus3 + vite4 + tailwind + pinia + axios
```

## **What it detects**

- **框架**：Vue2 / Vue3 / React（并区分主版本）
- **UI 库**：Element、Element Plus、Antd、Vant 等（区分主版本）
- **构建工具**：Vite / Webpack（包括隐式场景如 Vue CLI、CRA）
- **样式**：Tailwind、Less、Sass、Stylus 或 普通 CSS
- **状态管理**：Pinia / Vuex / Redux / Zustand
- **HTTP 客户端**：Axios / fetch / react-query

脚本通过合并 `dependencies` 与 `devDependencies` 来识别依赖，且会检查 `tsconfig.json` 以判断是否使用 TypeScript。

## **Output**

- 文件：生成 `.cursorrules`，内容包含多层级（L0-L5）的 Cursor Rules 文档（包含工程质量规范、框架专属约束、文档参考等）。
- 目的：为自动化工具或代码生成器提供与项目一致的行为约束与风格基线。

## **Troubleshooting**

- 如果看到 `❌ 未找到 package.json`：请确认当前工作目录包含有效的 [package.json](package.json)，或在运行前切换到目标项目根目录。
- 若识别不完整：检查依赖是否存在于 `dependencies` 或 `devDependencies`，或手动补充目标项目的依赖信息。

## **Contributing / Notes**

- 该脚本为单文件实现，便于移植到目标仓库。
- 想在 CI 中使用：将脚本放入仓库并在 CI 步骤中执行（确保 Node 环境存在）。

## **License**
本项目采用 MIT 许可证。
