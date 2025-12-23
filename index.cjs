/**
 * genCursorRules.js
 *
 * 单文件 Cursor Rules 生成器（架构级技术栈指纹）
 * - Vue2 / Vue3 / React 自动识别
 * - UI / Bundler / CSS / State / HTTP 全部按“架构级”识别
 * - UI & Bundler 均区分主版本
 */

const fs = require('fs')
const path = require('path')

/* ============================================================
 * 基础工具
 * ========================================================== */

function readJSON(file) {
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

function getMajor(version) {
  if (!version) return 0
  return Number(version.replace(/[^0-9.]/g, '').split('.')[0] || 0)
}

/* ============================================================
 * 项目上下文识别
 * ========================================================== */

function detectContext(deps) {
  const isTS = deps.typescript || fs.existsSync('tsconfig.json')

  if (deps.vue) {
    return {
      framework: 'vue',
      major: getMajor(deps.vue),
      language: isTS ? 'TypeScript' : 'JavaScript',
    }
  }

  if (deps.react) {
    return {
      framework: 'react',
      major: getMajor(deps.react),
      language: isTS ? 'TypeScript' : 'JavaScript',
    }
  }

  return {
    framework: 'unknown',
    major: 0,
    language: isTS ? 'TypeScript' : 'JavaScript',
  }
}

/* ============================================================
 * 架构级能力识别
 * ========================================================== */

/** UI 框架（区分主版本） */
function detectUILib(deps) {
  if (deps['element-plus']) {
    return `element-plus${getMajor(deps['element-plus']) || ''}`
  }
  if (deps['element-ui']) {
    return `element-ui${getMajor(deps['element-ui']) || ''}`
  }
  if (deps['ant-design-vue']) {
    return `ant-design-vue${getMajor(deps['ant-design-vue']) || ''}`
  }
  if (deps.antd) {
    return `antd${getMajor(deps.antd) || ''}`
  }
  if (deps.vant) {
    return `vant${getMajor(deps.vant) || ''}`
  }
  return null
}

/** 构建工具（必须区分主版本，含隐式场景） */
function detectBundler(deps) {
  // 显式 vite
  if (deps.vite) {
    return `vite${getMajor(deps.vite)}`
  }

  // 显式 webpack
  if (deps.webpack) {
    return `webpack${getMajor(deps.webpack)}`
  }

  // Vue CLI（webpack 4 / 5）
  if (deps['@vue/cli-service']) {
    const major = getMajor(deps['@vue/cli-service'])
    // vue-cli 4 -> webpack4, vue-cli 5 -> webpack5
    return major >= 5 ? 'webpack5' : 'webpack4'
  }

  // CRA（react-scripts 5 -> webpack5）
  if (deps['react-scripts']) {
    const major = getMajor(deps['react-scripts'])
    return major >= 5 ? 'webpack5' : 'webpack4'
  }

  return null
}

/** CSS 解决方案 */
function detectCssSolution(deps) {
  if (deps.tailwindcss) return 'tailwind'
  if (deps.less) return 'less'
  if (deps.sass || deps['node-sass']) return 'sass'
  if (deps.stylus) return 'stylus'
  return 'css'
}

/** 状态 / 数据持久化 */
function detectStateSolution(deps) {
  if (deps.pinia) return 'pinia'
  if (deps.vuex) return 'vuex'
  if (deps.redux) return 'redux'
  if (deps.zustand) return 'zustand'
  return null
}

/** HTTP 请求方案 */
function detectHttpClient(deps) {
  if (deps.axios) return 'axios'
  if (deps['@tanstack/query']) return 'react-query'
  return 'fetch'
}

/* ============================================================
 * 技术栈指纹（架构级）
 * ========================================================== */

function buildTechFingerprint(ctx, deps) {
  const parts = []

  // 主框架
  if (ctx.framework === 'vue') {
    parts.push(`vue${ctx.major}`)
  } else if (ctx.framework === 'react') {
    parts.push('react')
  }

  // UI
  const ui = detectUILib(deps)
  if (ui) parts.push(ui)

  // Bundler（关键）
  const bundler = detectBundler(deps)
  if (bundler) parts.push(bundler)

  // CSS
  const css = detectCssSolution(deps)
  if (css) parts.push(css)

  // State
  const state = detectStateSolution(deps)
  if (state) parts.push(state)

  // HTTP
  const http = detectHttpClient(deps)
  if (http) parts.push(http)

  return parts.join(' + ')
}

/* ============================================================
 * Cursor Rules 内容
 * ========================================================== */

function buildL0() {
  return `
# 🚨 L0 · 核心行为约束（最高优先级）

## 🎯 沟通模式
- 你是我的一线开发同事，不是导师也不是助理
- **对话模式**：直接给出解决方案，不要教学式讲解
- **输出格式**：代码优先，解释在后（如有必要）
- **问题解决**：先给解决方案，再问是否需要解释

## ⚡ 效率准则
- 默认一次性输出完整、可直接运行的代码片段
- 拒绝：
  - 伪代码（除非明确要求）
  - TODO
  - "// ... 省略"
  - "这里写逻辑" 这种占位符
  - 不完整的示例代码
- 代码必须可直接复制粘贴运行，且无编译错误

## 🛡️ 质量底线
- 所有代码必须是生产级别质量、默认代码会被长期维护
`.trim()
}

function buildL1Common(ctx) {
  const isTS = ctx.language === 'TypeScript'
  return `
# 💎 L1 · 工程质量红线（通用）

## 🟥 架构级红线
- 严格遵守技术栈指纹，禁止引入不在指纹中的 UI / 构建工具 / 状态方案
- **禁止混用**不兼容的技术方案（如 Vue2 + Vue3 语法）
- 新代码必须与现有项目架构保持一致性

## 🔧 代码正确性
- 显式处理异常与边界情况、所有异步操作必须有 try-catch 或 .catch()
- API 调用必须包含错误处理和加载状态
- 敏感操作必须有确认机制

## 📏 可维护性标准
- 结构分层清晰，副作用集中
- 避免过度抽象与炫技
- 单一职责、清晰命名、低耦合
- **长度限制**：
  - 函数：不超过 150 行
  - 组件：不超过 300 行（若复杂可放宽）
  - 文件：不超过 500 行（若复杂可放宽）
- **复杂度限制**：
  - 嵌套不超过 3 层
  - 函数参数不超过 5 个
  - 条件分支不超过 5 个

## 📝 ${isTS ? 'TypeScript' : 'JavaScript'} 规范  
${
  isTS
    ? `### TypeScript 严格规范
- 禁止使用 \`any\` 类型（除非第三方库类型缺失或历史代码需要兼容）
- 所有公共 API 必须有类型定义
- 优先使用 \`interface\` 而不是 \`type\`
- 使用泛型提高代码复用性
- 枚举值必须使用 \`const enum\`
- 使用类型保护而不是类型断言
`
    : `
- 复杂函数必须使用 JSDoc 注释
- 使用 ES6+ 语法
- 优先使用 async await 而不是回调
`
}

`.trim()
}

function buildFrameworkRules(ctx) {
  if (ctx.framework === 'vue' && ctx.major === 2) {
    return `
# 🧩 Vue 2 专属约束
- 遵循 Vue 2 最佳实践
- 必须使用 Options API

`.trim()
  }

  if (ctx.framework === 'vue' && ctx.major >= 3) {
    return `
# 🧩 Vue 3 专属约束
- 遵循 Vue 3 最佳实践
- 禁止使用 Vue 2 专属特性
- **语法规范**: 必须使用 \`<script setup lang="ts">\`。
- **逻辑复用**: 优先提取为 Composable (\`useXxx.ts\`)。
- 禁止使用 this.xxx
`.trim()
  }

  if (ctx.framework === 'react') {
    return `
# ⚛️ React 专属约束
- 遵循 React 最佳实践
- 必须使用 Function Component + Hooks
- 优先使用 Hooks 封装业务逻辑
- 禁止使用 Class Component
`.trim()
  }

  return ''
}

function buildL3() {
  return `
# 🎨 L3 · 代码风格与偏好（建议性）
- 非必要不引入新依赖
- 遵循《代码整洁之道》
- 避免过度封装（KISS）
- 优先使用纯函数组件
- 关注点分离：逻辑/视图/样式
- 使用自定义 Hook/composable 封装逻辑
- 使用最佳实践：避免重复代码、合理使用缓存、优化性能
- 与现有代码风格保持一致

`.trim()
}

/* ============================================================
 * 官方文档注册表（版本感知，防 AI 幻觉）
 * ========================================================== */

const DOC_REGISTRY = {
  vue: {
    2: 'https://v2.cn.vuejs.org/v2/guide/',
    3: 'https://cn.vuejs.org/guide/introduction.html',
  },
  react: {
    18: 'https://react.dev/reference/react',
  },
  antd: {
    4: 'https://4x.ant.design/components/overview-cn/',
    5: 'https://ant.design/components/overview-cn/',
  },
  'ant-design-vue': {
    1: 'https://1x.antdv.com/docs/vue/introduce-cn/',
    2: 'https://2x.antdv.com/docs/vue/introduce-cn/',
    3: 'https://www.antdv.com/components/overview-cn',
  },
  'element-ui': {
    2: 'https://element.eleme.io/#/zh-CN/component/quickstart',
  },
  'element-plus': {
    2: 'https://element-plus.org/zh-CN/component/overview.html',
  },
  vant: {
    2: 'https://vant-ui.github.io/vant/v2/#/zh-CN/',
    3: 'https://vant-ui.github.io/vant/v3/#/zh-CN/',
    4: 'https://vant-ui.github.io/vant/#/zh-CN/',
  },
  webpack: {
    4: 'https://v4.webpack.js.org/concepts/',
    5: 'https://webpack.js.org/concepts/',
  },
  vite: {
    4: 'https://vitejs.dev/guide/',
    5: 'https://vitejs.dev/guide/',
  },
  axios: {
    1: 'https://axios-http.com/docs/intro',
  },
}

function parseLibAndVersion(part) {
  const match = part.match(/^([a-zA-Z-]+)(\d+)$/)
  if (!match) return null

  return {
    name: match[1],
    major: Number(match[2]),
  }
}

function buildDocListFromFingerprint(fingerprint) {
  const parts = fingerprint.split(' + ')
  const lines = []

  parts.forEach((part) => {
    const parsed = parseLibAndVersion(part)
    if (!parsed) return

    const { name, major } = parsed
    const entry = DOC_REGISTRY[name]
    if (!entry) return

    if (entry[major]) {
      lines.push(`- ${name}@${major}: ${entry[major]}`)
    }
  })

  return lines.join('\n')
}
function buildAntiHallucination(fingerprint) {
  const docs = buildDocListFromFingerprint(fingerprint)

  return `
# 🛡️ L4 · 文档与防幻觉（Anti-Hallucination）

## 🚨 幻觉高风险声明
- UI 组件库、构建工具是 AI 幻觉最高发区域
- **必须严格按主版本文档生成代码**
- 禁止跨版本、跨框架“凭经验写代码”

## 📚 官方文档（版本感知，唯一可信来源）
${docs || '- 未识别到可用官方文档'}

## ⛔ 强制约束
- 若 API 未出现在以上文档中，视为不可用
- 禁止使用博客、Issue、旧项目代码作为依据
- 当记忆与文档冲突时，以文档为准
- 当文档与项目技术栈冲突时，以「技术栈指纹」为准
`.trim()
}

function buildOpenSourceReference() {
  return `
# 🌱 L5 · 开源代码参考（Controlled Inspiration）

## 🎯 目标
在**不引入新依赖、不跨版本、不破坏项目架构**的前提下，可参考社区高质量开源项目的**代码风格、模块划分、可维护性设计**，以提升生成代码的工程质量。

## ✅ 允许参考的内容
- 模块拆分方式
- 函数职责边界
- 命名习惯与可读性
- 错误处理模式
- Hooks / Composables 的设计思想
- 工具函数的纯度与复用方式

## ⛔ 禁止参考的内容
- 未在项目技术栈指纹中的库或框架
- 跨主版本的 API 写法
- 未在 L4 官方文档中出现的接口
- 直接复制粘贴完整实现

## 📌 使用约束（非常重要）
- 所有 API 使用必须通过 **L4 文档校验**
- 所有代码风格必须符合 **L3 工程规范**
- 当开源实现与项目规范冲突时：
  **以项目规范为准，而非开源代码**

## ⭐ 推荐参考的开源项目（思想层面）
- Vue 官方示例与 RFC（结构设计）
- Vant / Ant Design / Element 官方源码（组件实现思想与组织方式）
- VueUse / ahooks（Hooks / Composables 设计）
- Axios / TanStack（边界处理与健壮性）

> 仅允许“借鉴设计思想”，禁止“照搬实现细节”
`.trim()
}

/* ============================================================
 * 主流程
 * ========================================================== */

function generate() {
  const pkg = readJSON(path.resolve('package.json'))
  if (!pkg) {
    console.error('❌ 未找到 package.json')
    process.exit(1)
  }

  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  }

  const ctx = detectContext(deps)
  const fingerprint = buildTechFingerprint(ctx, deps)

  const rules = `
# Role
你是一名资深前端工程师，是我的同事，而不是老师。

${buildL0()}

${buildL1Common(ctx)}

${buildFrameworkRules(ctx)}

# 🧩 L2 · 项目上下文
- 技术栈指纹：${fingerprint}

${buildL3()}

${buildAntiHallucination(fingerprint)}

${buildOpenSourceReference()}

`.trim()

  fs.writeFileSync('.cursorrules', rules, 'utf-8')

  console.log('✅ .cursorrules 已生成')
  console.log('   技术栈指纹：', fingerprint)
}

generate()
