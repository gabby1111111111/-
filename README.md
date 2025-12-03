# Social Media Architect (社媒架构师) 🚀

**Social Media Architect** 是一款基于 **Google Gemini 2.5** 的智能社媒账号诊断与策略生成工具。它专为小红书 (Xiaohongshu/RedNote) 和抖音创作者设计，通过深度分析账号数据、内容风格与视觉表现，提供可落地的增长策略。

**Social Media Architect** is an AI-powered analytics dashboard designed for content creators. By leveraging Google Gemini models, it analyzes content history, engagement metrics, and visual style to provide a strategic roadmap for growth.

![Tech](https://img.shields.io/badge/AI-Gemini%202.5-orange)
![Stack](https://img.shields.io/badge/React-TypeScript-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 核心功能 (Key Features)

- **🧬 创作者 DNA 解析 (Creator DNA Analysis)**
  - 自动识别账号的独特人设标签、圈层属性（如“跨次元赛博恋爱学家”）。
  - Identifies unique content persona and niche tags.

- **🧭 双轨制“北极星”策略 (Dual-Track "North Star" Strategy)**
  - **方向 A (顺势而为)**：基于当前数据表现最好的内容进行深化。
  - **方向 B (目标转型)**：结合用户输入的**“未来意愿/目标”**，规划转型路径。
  - Generates two distinct strategic directions: one data-driven, one goal-oriented.

- **📊 深度可视化分析 (Visual Analytics)**
  - **赛道潜力雷达**：5维成长指标评分（人设、粘性、变现、垂直度、审美）。
  - **乐观模型 SWOT**：基于内容潜力的优势与机会分析，引用具体笔记作为证据。
  - **粉丝画像**：年龄分布、兴趣构成与痛点分析。

- **📝 实操爆款模版 (Actionable Content Strategy)**
  - AI 生成符合人设的“爆款标题公式”与“文案结构”。
  - AI Content Generator: Viral title templates and structures based on your DNA.

- **🔌 多源数据导入 (Flexible Data Import)**
  - 支持 **Spider_XHS** 爬虫数据批量导入。
  - 支持 Excel 表格、JSON 文件及截图分析。

## 🛠️ 技术栈 (Tech Stack)

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI Core**: Google Gemini API (`gemini-2.5-flash`) via `@google/genai`
- **Visualization**: Recharts
- **Data Handling**: XLSX (SheetJS)

## 🚀 快速开始 (Getting Started)

### Prerequisites (前置要求)
- Node.js 环境
- 一个有效的 **Google Gemini API Key**

### Installation (安装)

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/social-media-architect.git
   cd social-media-architect
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置 API Key**
   Ensure your environment has the `API_KEY` variable set.

4. **启动项目**
   ```bash
   npm start
   ```

## 📖 使用指南 (Usage Guide)

### 1. 数据获取
推荐配合 **Spider_XHS** 爬虫工具获取数据：
- 在应用内点击“如何获取数据？”(How to get data?) 查看详细指南。
- 获取 `info.json` 格式的笔记数据。

### 2. 导入数据
- **批量文件夹**：选择包含 JSON 文件的文件夹。
- **Excel 导入**：上传导出的数据表格。
- **截图分析**：上传主页或笔记截图进行视觉分析。

### 3. 开始分析
- **输入目标**：在输入框填写你未来的想发展的方向（例如：“我想转型做知识博主”）。
- 点击 **“生成策略报告”**。

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.