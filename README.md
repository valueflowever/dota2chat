# Ancient Lens

一个基于 Next.js 的 Dota 2 Agent 录像分析服务原型，面向单排玩家、团队教练和内容创作者。

## 功能

- 多角色复盘工作台
- Dota 2 专用提示词生成
- `/api/analyze` 分析接口
- OpenAI 实时模式与本地演示模式双通路
- 时间线驱动的结果展示
- Vitest + React Testing Library 基础测试

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 环境变量

可选：

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.2
```

未配置 `OPENAI_API_KEY` 时，应用会自动使用本地演示模式。

## 验证

```bash
npm test
npm run lint
npm run build
```
