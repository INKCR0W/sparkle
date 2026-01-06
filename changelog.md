# 更新日志

## v1.6.17

### 安全修复 (P1)

- 修复 vm 沙箱安全风险，防止逃逸访问主进程
- 修复 fetch 直接暴露可能导致的 SSRF 问题
- 修复 startCore 中可能导致无限重启循环和竞态条件
- 修复 webdavRestore 中的 Zip Slip 漏洞
- 修复 readTheme/writeTheme 路径遍历漏洞
- 修复 resetAppConfig 命令注入风险
- 修复 getLocalizedAppName 中 JXA 脚本命令注入风险

### 重要修复 (P2)

#### 配置模块
- 修复 getAppConfig 读取备份文件时缺少错误处理
- 修复 decryptConfig 解密失败时静默清空字段值
- 修复 getControledMihomoConfig 缺少文件读取错误处理
- 修复 getOverrideConfig 缺少文件读取错误处理
- 修复 addOverrideItem 中 updateOverrideItem 调用缺少 await
- 修复 getProfileConfig 缺少文件读取错误处理
- 修复 parseFilename 可能返回 undefined

#### 核心模块
- 修复 runOverrideScript 缺少脚本执行超时控制
- 修复 generateProfile 缺少错误处理
- 修复 overrideProfile 中 getOverride 失败会中断整个覆写流程
- 修复 startCore 返回嵌套 Promise 结构复杂
- 修复 stopChildProcess 中定时器可能导致内存泄漏
- 修复 setPublicDNS 和 recoverDNS 中递归定时器可能导致无限循环
- 修复 startNetworkDetection 中 startCore 调用缺少错误处理
- 修复 getDefaultService 缺少平台检查
- 修复 profileUpdater 使用 setTimeout 而非 setInterval 导致定时更新只执行一次

#### WebSocket 和 API
- 修复 WebSocket 重连无延迟导致快速重试
- 修复 WebSocket 连接可能泄漏
- 修复 mihomoGroups 中 all 数组可能包含 undefined 元素
- 修复 subStorePort 可能为 undefined 导致无效 URL

#### Resolve 模块
- 修复 filename 参数路径遍历漏洞
- 修复 addLocalFile/addLocalFolder 缺少错误处理
- 修复 webdavUrl 未验证
- 修复 fetchThemes Zip Slip 漏洞
- 修复 resolveThemes/fetchThemes 错误处理
- 修复 gist id URL 注入风险
- 修复 token 空值校验不一致
- 修复网络请求缺少错误处理
- 修复 .exe 安装后缺少 app.quit() 调用
- 修复 digest 格式解析缺少校验
- 修复 macOS shell 命令路径转义不完整
- 修复服务器关闭竞态条件
- 修复 Worker 缺少 error/exit 事件监听
- 修复 IPC 监听器泄漏
- 修复 stopMonitor 后变量未重置
- 修复 spawn 缺少 error 事件监听
- 修复 triggerTunShortcut 事件类型不一致
- 修复 loadURL/loadFile 错误处理
- 修复 group.all 可能包含 undefined
- 修复 mainWindow 空值检查

#### 入口文件
- 修复 customRelaunch 函数在 Linux 上 shell 命令拼接问题
- 修复 createWindowPromise 变量遮蔽

#### Service 模块
- 修复请求签名重放攻击风险
- 修复密钥存储安全性
- 修复 initKeyManager 并发控制
- 修复 serviceStatus stderr 检查逻辑

#### Sys 模块
- 修复 Linux 脚本单引号转义
- 修复 setupFirewall PowerShell 路径转义
- 修复 SSID 检查定时器无清理机制
- 修复 triggerSysProxy 定时器泄漏和状态不一致
- 修复 Linux rm 文件不存在异常
- 修复 macOS checkAutoRun 错误处理

#### Utils 模块
- 修复 Windows 图标提取中 mklink 命令未等待完成
- 修复 exec 调用缺少错误处理和回调
- 修复 decryptString 对无效加密格式抛出异常行为不一致
- 修复 cleanup 中日志文件日期解析可能失败
- 修复 AbortController 创建但未实际使用

#### Renderer 进程
- 修复 IPC 监听器清理不正确
- 修复 removeAllListeners 可能影响其他组件
- 修复 handleImport 函数缺少 try-catch
- 修复 getImageDataURL 的 Promise 没有错误处理
- 修复 getContent 异步函数缺少 try-catch
- 修复 addProfileItem 调用缺少 try-catch
- 修复 restartCore() 调用没有 try-catch
- 修复 MTU 输入框 parseInt 可能返回 NaN
- 修复多个端口输入框 parseInt || 0 可能导致意外禁用端口
- 修复 isOpen 和 delaying 状态数组长度与 groups 不同步
- 修复 onSave 中保存的配置缺少字段
- 修复 group.all.filter 中 proxy 可能为 undefined
- 修复 subStorePort 和 subStoreFrontendPort 可能返回 undefined
- 修复 Monaco model 没有在组件卸载时销毁

### 低优先级修复 (P3)

#### Main 进程
- 修复配置模块删除文件前未检查 item 是否存在
- 修复 IPC 监听器可能未被清理
- 修复 Promise.all 错误处理不完善
- 修复函数名拼写错误 (Permition → Permission)
- 修复 WebSocket onerror 回调没有记录错误信息
- 修复路径拼接双斜杠问题
- 修复 copyFile 错误处理
- 修复 close() 和 destroy() 冗余调用
- 修复 setTimeout 内 async 函数错误处理
- 修复代理端口 0 时的处理
- 修复关闭后变量未重置
- 修复 pid 文件内容校验
- 修复 spawn 失败时无错误提示
- 修复异步操作错误处理
- 修复 bypass undefined 处理
- 修复 spawn 进程错误未处理
- 修复 keyManager 未初始化时请求处理
- 修复 initService 固定延迟不可靠
- 修复 checkSSID 错误静默忽略
- 修复 defaultBypass 未初始化
- 修复 macOS 应用名称解析问题
- 修复 checkCorePermissionSync 可能抛出异常
- 修复 tempLinkPath 清理可能未执行
- 修复 initConfig 中目录存在性检查
- 修复 parseYaml 返回空对象可能隐藏解析错误

#### Renderer 进程
- 修复 handleCoreUpgrade 中 setTimeout 内的 PubSub.publish 没有错误处理
- 修复 iconRequestQueue 和 appNameRequestQueue 可能累积过多请求
- 修复 handleSniffPortChange 中端口字符串分割后未验证是否为有效端口号
- 修复 async 调用没有 try-catch 错误处理
- 修复 useEffect 中异步函数没有错误处理和依赖项缺失
- 修复 drawSvg 函数中的错误被静默忽略
- 修复 finally 块中的 mutate() 调用没有错误处理
- 修复 patchAppConfig 失败时 IPC send 仍会执行
- 修复 logs.map 中 Fragment 没有 key 属性
- 修复 parseInt || 0 当输入为空字符串时会变成 0
- 修复 parseInt 对 NaN 的处理可能导致意外行为
- 修复 timeout 可能在组件卸载后执行
