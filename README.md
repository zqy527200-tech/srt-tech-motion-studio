# 科技动画工作台（SRT + Remotion）

这是一个可部署到 Vercel 的网页原型，适合 Windows 用户。网页当前在浏览器内解析 SRT、按关键词规则生成科技动画分镜，并使用 Remotion Player 预览。

## 最省事的在线部署方式（不需要安装编程软件）

### 第 1 步：准备 GitHub 账号
1. 打开 https://github.com/ 并注册/登录。
2. 右上角 `+` → `New repository`。
3. 仓库名称填 `srt-tech-motion-studio`，选择 `Public` 或 `Private` 均可，然后点 `Create repository`。

### 第 2 步：把项目文件上传到 GitHub
1. 解压下载的 ZIP 文件。
2. 进入里面的 `remotion-srt-studio` 文件夹，确认能看到 `package.json`、`index.html`、`src`、`vite.config.ts`、`vercel.json`。
3. 在新建的 GitHub 仓库页面，点 `uploading an existing file`。
4. 把项目文件和 `src` 文件夹内的内容上传（不要只上传 ZIP 压缩包）。如果网页不方便一次上传文件夹，可用 GitHub Desktop；但通常可以先尝试网页上传。
5. 点 `Commit changes` 保存。

### 第 3 步：部署到 Vercel
1. 打开 https://vercel.com/ ，选择用 GitHub 登录。
2. 点 `Add New…` → `Project`。
3. 找到 `srt-tech-motion-studio`，点 `Import`。
4. Framework Preset 选择 `Vite`（如果自动识别到就保持默认）。
5. Build Command 应为 `npm run build`，Output Directory 应为 `dist`。
6. 点 `Deploy`，等待完成后，Vercel 会给出一个 `https://……vercel.app` 网址。把它收藏起来，以后就能直接打开。

## 当前版本的能力与限制

- 支持上传 `.srt` / `.txt` 或粘贴字幕文本。
- 按时间码解析字幕，并用本地关键词规则匹配流程、芯片、数据流、科技网络模板。
- 可编辑关键词、说明和模板；支持竖屏 9:16 预览；可导出分镜 JSON。
- 字幕目前在浏览器本地处理，不会自动上传到 AI 服务。
- **重要：当前在线版本还没有服务器端 MP4 导出，也没有真正的 AI 语义分镜。** Remotion Player 负责浏览器预览；网页内一键导出视频需要另外搭建渲染后端/队列。部署到 Vercel 只是让网页在线可访问，不会自动提供服务器视频渲染能力。
- 透明背景开关仅用于预览；透明视频导出还需要后续单独实现。

## 本地开发（可选）
需要安装 Node.js LTS，然后在项目目录运行：

```bash
npm install
npm run dev
```
