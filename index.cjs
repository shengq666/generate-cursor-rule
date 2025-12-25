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

/** 检测 uni-app 项目 */
function detectUniApp(deps) {
  // 检测 uni-app 相关依赖
  const hasUniApp = 
    deps['@dcloudio/uni-app'] ||
    deps['@dcloudio/uni-h5'] ||
    deps['@dcloudio/uni-mp-weixin'] ||
    deps['@dcloudio/uni-mp-alipay'] ||
    deps['@dcloudio/uni-mp-baidu'] ||
    deps['@dcloudio/uni-mp-toutiao'] ||
    deps['@dcloudio/uni-mp-qq'] ||
    deps['@dcloudio/uni-mp-xhs'] ||
    deps['@dcloudio/vue-cli-plugin-uni'] ||
    deps['@dcloudio/vite-plugin-uni']

  if (!hasUniApp) return null

  // 获取 Vue 版本（uni-app 基于 Vue）
  const vueVersion = deps.vue || deps['@dcloudio/uni-mp-vue']
  const major = vueVersion ? getMajor(vueVersion) : 2 // 默认 Vue 2

  return {
    isUniApp: true,
    vueMajor: major,
  }
}

/** 从 package.json scripts 中识别 uni-app 目标平台 */
function detectUniAppPlatform(pkg) {
  if (!pkg.scripts) return null

  const scripts = Object.values(pkg.scripts).join(' ')
  
  // 平台映射
  const platformMap = {
    'mp-weixin': '微信小程序',
    'mp-alipay': '支付宝小程序',
    'mp-baidu': '百度小程序',
    'mp-toutiao': '字节跳动小程序',
    'mp-qq': 'QQ小程序',
    'mp-xhs': '小红书小程序',
    'h5': 'H5',
    'app': 'App',
    'app-plus': 'App',
    'quickapp': '快应用',
  }

  // 从 scripts 中提取平台信息
  for (const [key, name] of Object.entries(platformMap)) {
    if (scripts.includes(key) || scripts.includes(`UNI_PLATFORM=${key}`)) {
      return { platform: key, platformName: name }
    }
  }

  return null
}

function detectContext(deps, pkg) {
  const isTS = deps.typescript || fs.existsSync('tsconfig.json')
  
  // 优先检测 uni-app
  const uniAppInfo = detectUniApp(deps)
  if (uniAppInfo) {
    const platformInfo = detectUniAppPlatform(pkg)
    return {
      framework: 'uni-app',
      major: uniAppInfo.vueMajor,
      language: isTS ? 'TypeScript' : 'JavaScript',
      platform: platformInfo?.platform || null,
      platformName: platformInfo?.platformName || null,
    }
  }

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
  if (deps.pinia) return `pinia${getMajor(deps.pinia)}`
  if (deps.vuex) return `vuex${getMajor(deps.vuex)}`
  if (deps.redux) return `redux${getMajor(deps.redux)}`
  if (deps.zustand) return `zustand${getMajor(deps.zustand)}`
  return null
}

/** HTTP 请求方案 */
function detectHttpClient(deps, ctx) {
  // uni-app 项目优先使用 uni.request
  if (ctx && ctx.framework === 'uni-app') {
    // 如果明确使用了 axios，则使用 axios，否则使用 uni.request
    if (deps.axios) return 'axios'
    return 'uni-request'
  }
  
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
  if (ctx.framework === 'uni-app') {
    parts.push(`uni-app(vue${ctx.major})`)
    // 添加目标平台信息
    if (ctx.platform) {
      parts.push(`platform:${ctx.platform}`)
    }
  } else if (ctx.framework === 'vue') {
    parts.push(`vue${ctx.major}`)
  } else if (ctx.framework === 'react') {
    parts.push(`react${ctx.major}`)
  }

  // UI（uni-app 项目通常使用 uni-ui 或 uView，但也可以使用其他 UI 库）
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
  const http = detectHttpClient(deps, ctx)
  if (http) parts.push(http)

  return parts.join(' + ')
}

/* ============================================================
 * Cursor Rules 内容
 * ========================================================== */

function buildL0() {
  return `
# 🚨 L0 · 核心行为约束

## 🎯 沟通模式
- 直接给出解决方案，代码优先，解释在后
- 先给方案，再问是否需要解释

## ⚡ 效率准则
- 一次性输出完整、可直接运行的代码
- 禁止：伪代码、TODO、"// ... 省略"、占位符、不完整示例
- 代码必须可直接运行，无编译错误

## 🛡️ 质量底线
- 生产级别质量，代码会被长期维护
`.trim()
}

function buildL1Common(ctx) {
  const isTS = ctx.language === 'TypeScript'
  return `
# 💎 L1 · 工程质量红线

## 🟥 架构级红线
- 严格遵守技术栈指纹，禁止引入不在指纹中的**架构级技术方案**（UI框架、状态管理、构建工具、CSS预处理器等）
- **允许引入工具库**（如日期处理、工具函数、特定功能库等），但需评估必要性、维护性和与现有技术栈的兼容性
- 禁止混用不兼容方案（如 Vue2 + Vue3 语法）
- 新代码必须与现有架构保持一致

## 🔧 代码正确性
- 显式处理异常与边界情况，异步操作必须有 try-catch 或 .catch()
- API 调用必须包含错误处理和加载状态
- 敏感操作必须有确认机制

## 📏 可维护性标准
- 结构分层清晰，副作用集中，避免过度抽象
- 单一职责、清晰命名、低耦合
- **限制**：函数≤150行，组件≤300行，文件≤500行，嵌套≤3层，参数≤5个，分支≤5个

## 📝 ${isTS ? 'TypeScript' : 'JavaScript'} 规范  
${
  isTS
    ? `- 禁止使用 \`any\`（除非第三方库类型缺失或历史代码兼容）
- 所有公共 API 必须有类型定义
- 优先使用 \`interface\`，使用泛型，枚举用 \`const enum\`
- 使用类型保护而非类型断言
`
    : `- 复杂函数使用 JSDoc 注释
- 使用 ES6+ 语法，优先 async/await
`
}

`.trim()
}

function buildFrameworkRules(ctx) {
  if (ctx.framework === 'uni-app') {
    const platformInfo = ctx.platformName 
      ? `- 目标平台: ${ctx.platformName} (${ctx.platform})`
      : '- 目标平台: 未识别（检查 package.json scripts）'
    
    const vueRules = ctx.major >= 3 
      ? `- Vue 3: 使用 \`<script setup>\`，优先 Composable，禁止 this`
      : `- Vue 2: 使用 Options API`

    return `
# 🧩 Uni-App 专属约束
${platformInfo}
- 基于 Vue ${ctx.major}，遵循 uni-app 规范
${vueRules}
- 必须使用 uni.* API（uni.request、uni.navigateTo 等），禁止浏览器原生 API
- 优先使用 uni-app 内置组件（view、text、image 等）
- 注意平台差异，使用条件编译 \`// #ifdef MP-WEIXIN\`
- 路由使用 uni.navigateTo/redirectTo/switchTab，不使用 vue-router
- 生命周期使用 onLoad/onShow 等，而非 Vue 生命周期
`.trim()
  }

  if (ctx.framework === 'vue' && ctx.major === 2) {
    return `
# 🧩 Vue 2 专属约束
- 遵循 Vue 2 最佳实践，必须使用 Options API
`.trim()
  }

  if (ctx.framework === 'vue' && ctx.major >= 3) {
    return `
# 🧩 Vue 3 专属约束
- 遵循 Vue 3 最佳实践，禁止 Vue 2 特性
- 必须使用 \`<script setup>\`，优先 Composable，禁止 this
`.trim()
  }

  if (ctx.framework === 'react') {
    return `
# ⚛️ React 专属约束
- 遵循 React 最佳实践，必须使用 Function Component + Hooks
- 优先使用 Hooks 封装业务逻辑，禁止 Class Component
`.trim()
  }

  return ''
}

function buildL3() {
  return `
# 🎨 L3 · 代码风格与偏好
- 非必要不引入新依赖，避免过度封装（KISS）
- 优先使用纯函数组件，关注点分离（逻辑/视图/样式）
- 避免重复代码、合理使用缓存、优化性能
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
  'uni-app': {
    2: 'https://uniapp.dcloud.net.cn/',
    3: 'https://uniapp.dcloud.net.cn/',
  },
  react: {
    16: 'https://react.dev/reference/react',
    17: 'https://react.dev/reference/react',
    18: 'https://react.dev/reference/react',
    19: 'https://react.dev/reference/react',
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
  'uni-request': {
    1: 'https://uniapp.dcloud.net.cn/api/request/request.html',
  },
  vuex: {
    3: 'https://v3.vuex.vuejs.org/zh/',
    4: 'https://vuex.vuejs.org/zh/',
  },
  pinia: {
    2: 'https://pinia.vuejs.org/zh/',
  },
  redux: {
    4: 'https://redux.js.org/',
    5: 'https://redux.js.org/',
  },
  zustand: {
    4: 'https://zustand-demo.pmnd.rs/',
  },
}

function parseLibAndVersion(part) {
  // 处理 uni-app(vue2) 格式
  const uniAppMatch = part.match(/^uni-app\(vue(\d+)\)$/)
  if (uniAppMatch) {
    return {
      name: 'uni-app',
      major: Number(uniAppMatch[1]),
    }
  }

  // 处理 platform:xxx 格式（跳过，不生成文档链接）
  if (part.startsWith('platform:')) {
    return null
  }

  // 处理无版本号的库（如 uni-request），使用默认版本 1
  if (part === 'uni-request') {
    return {
      name: 'uni-request',
      major: 1,
    }
  }

  // 处理标准格式：libname2
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
# 🛡️ L4 · 文档与防幻觉

## 🚨 幻觉高风险声明
- UI 组件库、构建工具是 AI 幻觉最高发区域
- 必须严格按主版本文档生成代码，禁止跨版本、跨框架"凭经验写代码"

## 📚 官方文档（唯一可信来源）
${docs || '- 未识别到可用官方文档'}

## ⛔ 强制约束
- API 使用优先参考以上官方文档，未出现在文档中的 API 需谨慎验证
- 官方文档不足时，可参考博客、Issue、社区讨论，但必须：
  - 验证与项目技术栈版本匹配
  - 确认方案与官方文档不冲突
  - 避免使用过时或不匹配的解决方案
- 记忆与文档冲突时，以文档为准；文档与技术栈冲突时，以技术栈指纹为准
`.trim()
}

function buildOpenSourceReference() {
  return `
# 🌱 L5 · 开源代码参考

## 🎯 目标
在不引入新依赖、不跨版本、不破坏架构的前提下，可参考开源项目的代码风格、模块划分、可维护性设计。

## ✅ 允许参考
- 模块拆分、函数职责、命名习惯、错误处理模式
- Hooks/Composables 设计思想、工具函数的纯度与复用

## ⛔ 禁止参考
- 未在技术栈指纹中的库/框架、跨主版本 API、未在 L4 文档中的接口
- 直接复制粘贴完整实现

## 📌 使用约束
- 所有 API 必须通过 L4 文档校验，代码风格符合 L3 规范
- 开源实现与项目规范冲突时，以项目规范为准

> 仅允许"借鉴设计思想"，禁止"照搬实现细节"
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

  const ctx = detectContext(deps, pkg)
  const fingerprint = buildTechFingerprint(ctx, deps)

  const rules = `
# Role
你是一名资深前端工程师，是我的同事。

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
