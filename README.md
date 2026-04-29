# Ancient Lens

Ancient Lens 是一个基于 Next.js 的 Dota 2 复盘聊天前端。前端负责对话 UI、历史记录和请求转发；分析模型、OpenAI 配置与业务推理由后端服务决定。

## 功能

- Dota 2 复盘与游戏问题聊天工作台
- 比赛 ID / 自然语言问题自动识别
- 快捷提问会提交给后端，不使用前端预设回复
- `/api/analyze` 前端代理，转发到后端分析服务
- 录像解析任务状态查询代理
- Vitest + React Testing Library 基础测试

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 环境变量

前端只需要知道后端地址：

```bash
DOTA2_BACKEND_URL=http://127.0.0.1:8000
```

未配置时默认使用 `http://127.0.0.1:8000`。

不要在前端配置 `OPENAI_API_KEY` 或 `OPENAI_MODEL`。模型选择和 OpenAI 凭据由后端服务统一管理。

## 验证

```bash
npm test
npm run lint
npm run build
```
