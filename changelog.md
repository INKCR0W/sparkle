# 更新日志

## 新功能

- feat(i18n): 添加 i18n 支持
- feat(connections): 添加暂停/恢复连接更新功能
- feat(tun): 优化 TUN 模式切换用户体验

## 修复

- fix(websocket): 修复 WebSocket 重试定时器内存泄漏
- fix(core): 修复核心重启竞态条件
- fix(sysproxy): 修复系统代理设置竞态条件
- fix(profile): 修复 profile 切换队列竞态条件
- fix(input): 修复 IME 输入法字符重复问题
- fix(tray): 修复托盘图标 SVG 文本显示问题
- fix(tun): 改进 TUN 启动失败处理
- fix(config): 修复端口值 NaN 处理问题
- fix(monitor): 在 stopMonitor 中移除所有监听器
- fix(ipc): 为监听器添加超时清理机制
- fix(core): 在 stopCore 中清理网络相关定时器
- fix(profile): 添加 profileUpdater 全局清理函数
- fix(substore): 改进 Worker 线程错误处理和流清理
- fix(server): 改进 HTTP 服务器优雅关闭
- fix(i18n): 在 before-quit 中提前停止缓存清理
- fix(init): 改进文件初始化错误处理
- fix(config): 添加数组安全检查
- fix(nsis): 仅在首次安装时创建桌面快捷方式
- fix(tun): macOS 平台显示严格路由选项
- fix(connections): 使用 Ionicons 5 暂停图标
