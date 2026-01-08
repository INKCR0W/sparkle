# 更新日志

### 新功能

- feat(core): 添加自定义内核路径支持
- feat(updater): 测试版更新支持显示跨版本完整更新日志
- feat(sysproxy): 添加系统代理设置输入验证
- feat(proxies): 记住代理组展开状态和搜索值

### Bug 修复

- fix(tray): Windows 托盘图标创建增加重试机制
- fix(service): fix #3
- fix(editor): 修复 diff editor 切换时的崩溃问题
- fix(template): 修复默认配置值与前端不一致的问题
- fix(editor): null reference in diffEditorWillUnmount
- fix(updater): 修改软件内更新使用的 headers
- fix(sys): 尝试缓解退出时系统代理未正确关闭的问题

### 性能优化

- perf(api): 优化 mihomoGroups 遍历并添加 WebSocket 指数退避重连
- perf(connections): 修复依赖循环并优化图标加载性能
- perf(renderer): SWR 全局配置与 IPC 监听器清理优化
- perf(main): SubStore 服务按需启动以优化启动速度

### 重构

- refactor(renderer): 提取系统内核路径缓存到独立模块并支持预加载