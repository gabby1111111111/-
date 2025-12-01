# 🚀 Social Media Architect | AI 驱动的小红书/抖音账号深度诊断工具

> **"赛博诊脉，数据飞升。"** —— 专为内容创作者打造的 AI 军师。

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Gemini 3](https://img.shields.io/badge/AI-Gemini%203-orange?logo=google)](https://deepmind.google/technologies/gemini/)
[![Tailwind CSS](https://img.shields.io/badge/Style-Tailwind-cyan?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**Social Media Architect** 是一款基于 **Google Gemini 3** 大模型开发的智能社媒运营辅助工具。它不仅仅是一个数据看板，更是一位拥有顶尖运营思维的 AI 顾问。

通过分析您的账号数据（支持爬虫数据导入），它能精准提取您的 **"创作者 DNA"**，计算真实的互动指标，生成 SWOT 战略报告，并为您量身定制**可直接复制的爆款文案模版**。

![App Screenshot](./screenshot.png) *(建议上传一张运行截图放在这里)*

---

## ✨ 核心功能 (Features)

### 1. 🧬 创作者 DNA 解析 (Creator DNA)
告别泛泛而谈的标签。AI 会深度阅读您的数百篇笔记，提炼出独属于您的**复杂人设成分**（例如：“跨次元赛博恋爱学家”、“硬核战锤梦女”），帮您找准差异化赛道。

### 2. 📊 硬核数据看板 (Hard Stats)
拒绝虚荣指标。工具内置统计引擎，自动清洗并计算：
*   **真实爆款率** (Top 10% 笔记占比)
*   **平均互动量** (点赞+收藏)
*   **高光时刻** (数据最好的笔记及其类型)

### 3. 📝 实操爆款模版 (Copy & Paste Strategy)
AI 不止给建议，直接给**成品**。根据您的账号调性，生成：
*   **标题公式**：填空即可用的吸睛标题。
*   **文案骨架**：经过验证的爆款写作结构（情绪铺垫 -> 反转 -> 互动钩子）。
*   **AI 灵感生成器**：输入一个模糊的想法，AI 立刻为您生成 3 个定制标题。

### 4. 📈 战略审计 (SWOT & Radar)
*   **SWOT 分析**：一针见血地指出您的优势、劣势、机会点。
*   **赛道潜力雷达**：从内容垂直度、视觉审美、变现潜力等 5 个维度进行量化评分。

### 5. 🛠️ 无缝数据导入
*   **Spider_XHS 完美适配**：直接支持导入 `Spider_XHS` 爬虫工具生成的 JSON 数据文件夹。
*   **批量清洗**：自动过滤 `token`、`id` 等敏感和无用数据，保护隐私同时提高 AI 分析准确度。

---

## 🛠️ 技术栈 (Tech Stack)

*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Tailwind CSS
*   **AI Model**: Google Gemini 2.5 Flash / Pro (via `@google/genai` SDK)
*   **Visualization**: Recharts (雷达图)
*   **Icons**: Lucide React

---

## 🚀 快速开始 (Quick Start)

### 前置要求
*   Node.js (v18+)
*   一个有效的 Google Gemini API Key ([申请地址](https://aistudio.google.com/app/apikey))

### 1. 克隆项目
```bash
git clone https://github.com/your-username/social-media-architect.git
cd social-media-architect
2. 安装依赖
code
Bash
npm install
3. 配置环境变量
在根目录创建一个 .env 文件，并填入您的 API Key：
code
Env
API_KEY=your_google_gemini_api_key_here
(注意：请确保您的 API Key 有权限访问 Gemini 模型)
4. 启动项目
code
Bash
npm start
# 或者
npm run dev
浏览器打开 http://localhost:5173 (或终端显示的地址) 即可使用。
📖 数据获取指南 (配合 Spider_XHS)
本工具最强大的用法是配合开源爬虫 Spider_XHS 使用，以获取您账号的全量数据。
下载爬虫：前往 Spider_XHS 下载源码。
获取 Cookie：
登录小红书网页版。
F12 打开控制台 -> Network -> 刷新 -> 找到请求头中的 cookie。
运行爬取：
修改 main.py 中的目标主页链接。
运行 python main.py。
导入本工具：
点击本工具界面上的 "批量导入文件夹"。
选择爬虫生成的 datas 文件夹。
系统会自动读取所有子文件夹中的 info.json 并进行分析。
🤝 贡献 (Contributing)
欢迎提交 Issue 或 Pull Request！
如果您有更好的 Prompt 策略或新的功能想法（比如增加对 B站/知乎 的支持），请随时告诉我。
📄 开源协议 (License)
MIT License © 2024 Your Name
