# Code Review Report

## Summary

Overall: patch is correct

这个 patch 是一个功能移除变更，完整地删除了"自定义内核"（custom core）功能。代码变更在各个层面（类型定义、主进程、渲染进程、IPC 通信）保持了一致性，没有遗留未清理的引用或死代码。

## Findings

No issues found.
