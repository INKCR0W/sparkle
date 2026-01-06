# Sparkle 代码审查任务清单

---

## 🔴 P1 - 紧急安全问题

### fix/security-critical
关键安全漏洞修复（命令注入、沙箱逃逸、路径遍历）

- [P1] `src/main/core/factory.ts:262-306` - runOverrideScript 中 vm 沙箱存在安全风险，可逃逸访问主进程；fetch 直接暴露可能导致 SSRF
- [P1] `src/main/core/manager.ts:131-141` - startCore 中 child.on('close') 回调可能导致无限重启循环和竞态条件
- [P1] `src/main/resolve/backup.ts:59` - webdavRestore 存在 Zip Slip 漏洞
- [P1] `src/main/resolve/theme.ts:59-62, 64-66` - readTheme/writeTheme 路径遍历漏洞
- [P1] `src/main/sys/misc.ts:127-145` - resetAppConfig 命令注入风险
- [P1] `src/main/utils/appName.ts:44-56` - getLocalizedAppName 中 JXA 脚本存在命令注入风险，appPath 未转义直接拼接到脚本中

---

## 🟠 P2 - 重要问题

### fix/main-config-error-handling
Main 进程配置模块错误处理修复

- [P2] `src/main/config/app.ts:72-82` - getAppConfig 读取备份文件时缺少错误处理
- [P2] `src/main/config/app.ts:44-56` - decryptConfig 解密失败时静默清空字段值，应保留原始值或记录警告
- [P2] `src/main/config/controledMihomo.ts:11-18` - getControledMihomoConfig 缺少文件读取错误处理
- [P2] `src/main/config/override.ts:14-20` - getOverrideConfig 缺少文件读取错误处理
- [P2] `src/main/config/override.ts:43-50` - addOverrideItem 中 updateOverrideItem 调用缺少 await，造成竞态条件
- [P2] `src/main/config/profile.ts:28-34` - getProfileConfig 缺少文件读取错误处理
- [P2] `src/main/config/profile.ts:262-269` - parseFilename 可能返回 undefined 而非 string

---

### fix/main-core-lifecycle
Main 进程核心模块生命周期和错误处理修复

- [P2] `src/main/core/factory.ts:295-300` - runOverrideScript 缺少脚本执行超时控制
- [P2] `src/main/core/factory.ts:28-56` - generateProfile 缺少错误处理，异常会导致模块级变量状态不一致
- [P2] `src/main/core/factory.ts:247-261` - overrideProfile 中 getOverride 失败会中断整个覆写流程
- [P2] `src/main/core/manager.ts:143-207` - startCore 返回嵌套 Promise 结构复杂，可能导致未处理的 rejection
- [P2] `src/main/core/manager.ts:247-302` - stopChildProcess 中定时器可能导致内存泄漏
- [P2] `src/main/core/manager.ts:430-448` - setPublicDNS 和 recoverDNS 中递归定时器可能导致无限循环
- [P2] `src/main/core/manager.ts:462-487` - startNetworkDetection 中 startCore 调用缺少错误处理
- [P2] `src/main/core/manager.ts:404-416` - getDefaultService 缺少平台检查，在 Windows/Linux 上会失败
- [P2] `src/main/core/profileUpdater.ts:38-47, 60-68, 83-93` - 使用 setTimeout 而非 setInterval 导致定时更新只执行一次；async 函数错误无法被正确捕获

---

### fix/main-websocket-api
Main 进程 WebSocket 和 API 连接问题修复

- [P2] `src/main/core/mihomoApi.ts:217-220, 250-253, 283-286, 316-319` - WebSocket 重连无延迟导致快速重试
- [P2] `src/main/core/mihomoApi.ts:203, 236, 269, 302` - WebSocket 连接可能泄漏，创建新连接前未关闭旧连接
- [P2] `src/main/core/mihomoApi.ts:107, 113` - mihomoGroups 中 all 数组可能包含 undefined 元素
- [P2] `src/main/core/subStoreApi.ts:7-8, 14-15` - subStorePort 可能为 undefined，导致无效 URL

---

### fix/main-resolve-security
Main 进程 Resolve 模块安全和错误处理修复

- [P2] `src/main/resolve/backup.ts:58, 93` - filename 参数路径遍历漏洞
- [P2] `src/main/resolve/backup.ts:25-31` - addLocalFile/addLocalFolder 缺少错误处理
- [P2] `src/main/resolve/backup.ts:17-21, 47-51, 64-68, 82-86` - webdavUrl 未验证
- [P2] `src/main/resolve/theme.ts:46-47` - fetchThemes Zip Slip 漏洞
- [P2] `src/main/resolve/theme.ts:15-16, 36-46` - resolveThemes/fetchThemes 错误处理
- [P2] `src/main/resolve/gistApi.ts:55` - gist id URL 注入风险
- [P2] `src/main/resolve/gistApi.ts:76-77, 90-91` - token 空值校验不一致
- [P2] `src/main/resolve/gistApi.ts:11-27, 29-51, 53-73` - 网络请求缺少错误处理
- [P2] `src/main/resolve/autoUpdater.ts:119-123` - .exe 安装后缺少 app.quit() 调用
- [P2] `src/main/resolve/autoUpdater.ts:83-84` - digest 格式解析缺少校验
- [P2] `src/main/resolve/autoUpdater.ts:137` - macOS shell 命令路径转义不完整

---

### fix/main-resolve-lifecycle
Main 进程 Resolve 模块生命周期和 IPC 修复

- [P2] `src/main/resolve/server.ts:63-67, 80-84, 127-131` - 服务器关闭竞态条件
- [P2] `src/main/resolve/server.ts:109-117` - Worker 缺少 error/exit 事件监听
- [P2] `src/main/resolve/floatingWindow.ts:64-68` - IPC 监听器泄漏
- [P2] `src/main/resolve/trafficMonitor.ts:35-38` - stopMonitor 后变量未重置
- [P2] `src/main/resolve/trafficMonitor.ts:23-30` - spawn 缺少 error 事件监听
- [P2] `src/main/resolve/shortcut.ts:72-73` - triggerTunShortcut 事件类型不一致
- [P2] `src/main/resolve/tray.ts:432-434, 449-451` - IPC 监听器泄漏
- [P2] `src/main/resolve/tray.ts:97-100` - loadURL/loadFile 错误处理
- [P2] `src/main/resolve/tray.ts:145-149` - group.all 可能包含 undefined
- [P2] `src/main/resolve/menu.ts:173` - mainWindow 空值检查

---

### fix/main-index-ipc
Main 进程入口文件 IPC 和杂项修复

- [P2] `src/main/index.ts:104-115` - customRelaunch 函数在 Linux 上 shell 命令拼接存在问题，特殊字符会被错误解析
- [P2] `src/main/index.ts:252` - createWindowPromise 变量遮蔽导致模块级变量永远不会被正确设置

---

### fix/main-service-security
Main 进程 Service 模块安全性修复

- [P2] `src/main/service/api.ts:21-27` - 请求签名重放攻击风险
- [P2] `src/main/service/manager.ts:19-26, 32-35` - 密钥存储安全性
- [P2] `src/main/service/manager.ts:10-38` - initKeyManager 并发控制
- [P2] `src/main/service/manager.ts:168-170` - serviceStatus stderr 检查逻辑

---

### fix/main-sys-shell-security
Main 进程 Sys 模块 Shell 命令和定时器修复

- [P2] `src/main/sys/misc.ts:133-143` - Linux 脚本单引号转义
- [P2] `src/main/sys/misc.ts:47-55` - setupFirewall PowerShell 路径转义
- [P2] `src/main/sys/ssid.ts:56-59` - SSID 检查定时器无清理机制
- [P2] `src/main/sys/sysproxy.ts:14-22` - triggerSysProxy 定时器泄漏和状态不一致
- [P2] `src/main/sys/autoRun.ts:115` - Linux rm 文件不存在异常
- [P2] `src/main/sys/autoRun.ts:63-67` - macOS checkAutoRun 错误处理

---

### fix/main-utils
Main 进程 Utils 工具模块修复

- [P2] `src/main/utils/icon.ts:192-199` - Windows 图标提取中 mklink 命令未等待完成，可能导致竞态条件
- [P2] `src/main/utils/icon.ts:192` - exec 调用缺少错误处理和回调
- [P2] `src/main/utils/encrypt.ts:26-28` - decryptString 对无效加密格式抛出异常，但 encryptString 返回原文本，行为不一致
- [P2] `src/main/utils/init.ts:108-113` - cleanup 中日志文件日期解析可能失败导致 NaN 比较
- [P2] `src/main/utils/userAgent.ts:12-13` - AbortController 创建但未实际使用，timeout 无效

---

### fix/renderer-ipc-listener-cleanup
Renderer 进程 IPC 监听器清理问题统一修复

- [P2] `src/renderer/src/pages/profiles.tsx:152-175` - useEffect 中事件监听器清理不正确，removeEventListener 传入空函数无效
- [P2] `src/renderer/src/pages/override.tsx:82-115` - 同上问题
- [P2] `src/renderer/src/pages/connections.tsx:147-200` - IPC 监听器使用 removeAllListeners 而非移除特定监听器
- [P2] `src/renderer/src/components/sider/conn-card.tsx:63-89` - removeAllListeners 可能影响其他组件
- [P2] `src/renderer/src/components/sider/mihomo-core-card.tsx:47-60` - 同上问题
- [P2] `src/renderer/src/components/resources/proxy-provider.tsx:47-52` - 同上问题
- [P2] `src/renderer/src/components/resources/rule-provider.tsx:44-49` - 同上问题
- [P2] `src/renderer/src/components/settings/actions.tsx:30-39` - 与 updater-button.tsx 存在冲突
- [P2] `src/renderer/src/components/updater/updater-button.tsx:22-32` - 与 settings/actions.tsx 存在冲突

---

### fix/renderer-async-error-handling
Renderer 进程异步操作错误处理修复

- [P2] `src/renderer/src/pages/profiles.tsx:119-127` - handleImport 函数缺少 try-catch，addProfileItem 失败时 importing 状态不会重置
- [P2] `src/renderer/src/pages/proxies.tsx:178-189` - getImageDataURL 的 Promise 没有错误处理
- [P2] `src/renderer/src/components/profiles/edit-file-modal.tsx:43-47` - getContent 异步函数缺少 try-catch
- [P2] `src/renderer/src/components/profiles/profile-item.tsx:186-190` - addProfileItem 调用缺少 try-catch，更新失败时 updating 状态不会重置
- [P2] `src/renderer/src/components/sider/tun-switcher.tsx:35-44` - restartCore() 调用没有 try-catch

---

### fix/renderer-input-validation
Renderer 进程数值输入验证统一修复（parseInt NaN 问题）

- [P2] `src/renderer/src/pages/tun.tsx:145-149` - MTU 输入框 parseInt 可能返回 NaN
- [P2] `src/renderer/src/pages/mihomo.tsx:287-289` - maxLogDays 输入框 parseInt 可能返回 NaN
- [P2] `src/renderer/src/components/proxies/proxy-setting-modal.tsx:139-143, 148-152` - delayTestConcurrency/delayTestTimeout 输入框 NaN 问题
- [P2] `src/renderer/src/components/profiles/edit-info-modal.tsx:143-149` - 更新间隔输入框 NaN 问题
- [P2] `src/renderer/src/components/resources/geo-data.tsx:119-124` - geoUpdateInterval 输入框 NaN 问题
- [P2] `src/renderer/src/components/mihomo/port-setting.tsx:72-76, 88-92, 104-108, 120-124, 136-140` - 多个端口输入框 parseInt || 0 可能导致意外禁用端口

---

### fix/renderer-state-sync
Renderer 进程状态同步问题修复

- [P2] `src/renderer/src/pages/proxies.tsx:42-43` - isOpen 和 delaying 状态数组长度与 groups 不同步
- [P2] `src/renderer/src/pages/sniffer.tsx:62-75` - onSave 中保存的配置缺少 skipDstAddress 和 skipSrcAddress 字段
- [P2] `src/renderer/src/pages/proxies.tsx:46-47` - group.all.filter 中 proxy 可能为 undefined
- [P2] `src/renderer/src/pages/substore.tsx:24-26` - subStorePort 和 subStoreFrontendPort 可能返回 undefined

---

### fix/renderer-memory-leak
Renderer 进程内存泄漏修复

- [P2] `src/renderer/src/components/base/base-editor.tsx:95-100, 102-114` - Monaco model 没有在组件卸载时销毁，editorWillUnmount 回调为空函数

---

### fix/scripts-error-handling
Scripts 构建脚本错误处理和安全性修复

- [P2] `scripts/checksum.mjs:5` - readdirSync('dist') 缺少错误处理
- [P2] `scripts/prepare.mjs:218-222` - downloadFile 函数没有检查 HTTP 响应状态码
- [P2] `scripts/prepare.mjs:145-148, 159-161, 175-177, 195-196` - AdmZip extractAllTo 存在 Zip Slip 漏洞
- [P2] `scripts/telegram.mjs:4-6` - 文件读取缺少 try-catch 错误处理
- [P2] `scripts/telegram.mjs:42` - process.env.TELEGRAM_BOT_TOKEN 未验证是否存在

---

## 🟡 P3 - 低优先级

### fix/main-minor-issues
Main 进程低优先级问题修复

- [P3] `src/main/config/override.ts:52-58` - removeOverrideItem 删除文件前未检查 item 是否存在
- [P3] `src/main/config/profile.ts:48-59` - changeCurrentProfile 在 restartCore 失败后 finally 块会保存错误配置
- [P3] `src/main/config/profile.ts:296-307` - setFileStr 允许写入任意绝对路径存在安全风险
- [P3] `src/main/index.ts:159-173` - showQuitConfirmDialog 中 IPC 监听器可能未被清理
- [P3] `src/main/index.ts:340-365, 376-400` - showProfileInstallConfirm 和 showOverrideInstallConfirm 存在相同问题
- [P3] `src/main/index.ts:367-374` - parseFilename 对边界情况处理不完善
- [P3] `src/main/core/factory.ts:237-245` - prepareProfileWorkDir 中 Promise.all 错误处理不完善
- [P3] `src/main/core/factory.ts:136-155` - configureLanSettings 中直接修改 lan-allowed-ips 数组可能影响原始配置
- [P3] `src/main/core/factory.ts:213-214` - cleanDnsConfig 中硬编码删除 fallback 配置缺少注释说明
- [P3] `src/main/core/manager.ts:327` - manualGrantCorePermition 函数名拼写错误 (Permition → Permission)
- [P3] `src/main/core/manager.ts:308-325` - checkProfile 错误信息处理不完整
- [P3] `src/main/core/manager.ts:230` - child 被设置为 undefined 的类型不安全
- [P3] `src/main/core/mihomoApi.ts:222-226, 255-259, 288-292, 321-325` - WebSocket onerror 回调没有记录错误信息
- [P3] `src/main/core/profileUpdater.ts:23` - currentItem 变量声明但未使用
- [P3] `src/main/core/subStoreApi.ts:7-8, 14-15` - customSubStoreUrl 为空字符串时的处理
- [P3] `src/main/core/subStoreApi.ts:9, 16` - 响应结构校验缺失
- [P3] `src/main/resolve/backup.ts:43, 58, 75, 93` - 路径拼接双斜杠问题
- [P3] `src/main/resolve/backup.ts:75` - listWebdavBackups 目录不存在时异常处理
- [P3] `src/main/resolve/theme.ts:52-56` - importThemes copyFile 错误处理
- [P3] `src/main/resolve/theme.ts:69-77` - applyTheme 错误处理不一致
- [P3] `src/main/resolve/floatingWindow.ts:100-101` - close() 和 destroy() 冗余调用
- [P3] `src/main/resolve/floatingWindow.ts:91-94` - setTimeout 内 async 函数错误处理
- [P3] `src/main/resolve/gistApi.ts:79-86` - 高并发下可能创建重复 gist
- [P3] `src/main/resolve/gistApi.ts:18-24, 43-49, 65-71` - 代理端口 0 时的处理
- [P3] `src/main/resolve/server.ts:64-66, 81-83, 128-130` - 关闭后变量未重置
- [P3] `src/main/resolve/server.ts:101-102` - createWriteStream 错误处理
- [P3] `src/main/resolve/shortcut.ts:81-111` - 模式切换缺少 groupsUpdated 事件和 try-catch
- [P3] `src/main/resolve/trafficMonitor.ts:11-19` - pid 文件内容校验
- [P3] `src/main/resolve/trafficMonitor.ts:28-30` - spawn 失败时无错误提示
- [P3] `src/main/resolve/tray.ts:103-105` - 窗口显示时机问题
- [P3] `src/main/resolve/tray.ts:163-175, 340-346` - 异步操作错误处理
- [P3] `src/main/resolve/tray.ts:467` - bypass undefined 处理
- [P3] `src/main/resolve/autoUpdater.ts:117` - disableSysProxy 调用后安装失败代理状态不会恢复
- [P3] `src/main/resolve/autoUpdater.ts:119-123, 127-134` - spawn 进程错误未处理
- [P3] `src/main/service/api.ts:20-28` - keyManager 未初始化时请求处理
- [P3] `src/main/service/manager.ts:95` - initService 固定延迟不可靠
- [P3] `src/main/sys/ssid.ts:37-50` - checkSSID 错误静默忽略
- [P3] `src/main/sys/sysproxy.ts:11, 24-52` - defaultBypass 未初始化
- [P3] `src/main/sys/autoRun.ts:67, 91, 109` - macOS 应用名称解析问题
- [P3] `src/main/utils/dirs.ts:65-66` - mihomoIpcPath 中 checkCorePermissionSync 可能抛出异常
- [P3] `src/main/utils/icon.ts:206-208` - tempLinkPath 清理在 try 块外，可能未执行
- [P3] `src/main/utils/init.ts:56-60` - initConfig 中多个 writeFile 并行执行，但缺少目录存在性检查
- [P3] `src/main/utils/yaml.ts:3-8` - parseYaml 返回空对象而非 null/undefined，可能隐藏解析错误

---

### fix/renderer-minor-issues
Renderer 进程低优先级问题修复

- [P3] `src/renderer/src/pages/logs.tsx:26-32` - 全局 IPC 监听器在模块级别注册，组件卸载后仍然存在
- [P3] `src/renderer/src/pages/mihomo.tsx:95-99` - handleCoreUpgrade 中 setTimeout 内的 PubSub.publish 没有错误处理
- [P3] `src/renderer/src/pages/connections.tsx:56-57` - iconRequestQueue 和 appNameRequestQueue 可能累积过多请求
- [P3] `src/renderer/src/pages/connections.tsx:145` - group.all 可能包含 undefined 元素
- [P3] `src/renderer/src/pages/sniffer.tsx:79-88` - handleSniffPortChange 中端口字符串分割后未验证是否为有效端口号
- [P3] `src/renderer/src/components/base/base-confirm.tsx:41-44, 55-60` - async 调用没有 try-catch 错误处理
- [P3] `src/renderer/src/components/base/interface-select.tsx:12-17` - useEffect 中异步函数没有错误处理，exclude 依赖项缺失
- [P3] `src/renderer/src/components/sider/conn-card.tsx:79-85` - drawSvg 函数中的错误被静默忽略
- [P3] `src/renderer/src/components/sider/mihomo-core-card.tsx:109-119` - finally 块中的 mutate() 调用没有错误处理
- [P3] `src/renderer/src/components/sider/sysproxy-switcher.tsx:44-53` - patchAppConfig 失败时 IPC send 仍会执行
- [P3] `src/renderer/src/components/profiles/edit-file-modal.tsx:103-106` - 保存按钮的 onPress 异步操作缺少错误处理
- [P3] `src/renderer/src/components/override/exec-log-modal.tsx:36-42` - logs.map 中 Fragment 没有 key 属性
- [P3] `src/renderer/src/components/mihomo/advanced-settings.tsx:88-95, 104-111` - parseInt || 0 当输入为空字符串时会变成 0
- [P3] `src/renderer/src/components/settings/advanced-settings.tsx:73-79, 152-155` - parseInt 对 NaN 的处理可能导致意外行为
- [P3] `src/renderer/src/components/settings/appearance-confis.tsx:62-68` - timeout 可能在组件卸载后执行

---

### fix/scripts-minor-issues
Scripts 构建脚本低优先级问题修复

- [P3] `scripts/prepare.mjs:183` - catch 块中 fs.rmSync 可能删除不存在的文件
- [P3] `scripts/prepare.mjs:159, 175` - execSync 路径未转义，包含特殊字符时会失败
- [P3] `scripts/updater.mjs:4-6` - 文件读取缺少 try-catch 错误处理
- [P3] `scripts/checksum.mjs:6-12` - 当 process.argv.slice(2) 为空时缺少提示信息

---

## 📊 统计

| 优先级 | 分支数 | 问题数 |
|--------|--------|--------|
| P1 紧急 | 1 | 6 |
| P2 重要 | 14 | ~70 |
| P3 低优 | 3 | ~50 |
| **总计** | **18** | **~126** |
