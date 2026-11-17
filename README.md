# AI 周报 · GitHub Pages

目标公开地址 https://ai.shenlii.cn，独立仓库，不修改 shenlii.cn 个人网站。此包本身不代表已发布；以部署和 DNS 验证结果为准。

## 内容与发布

GitHub Pages 只托管 site/ 中的 HTML、周报 JSON 和 CNAME。访客不请求境外业务后端，不需要服务令牌。现有周一09:00的 AI 任务仍负责收集和生成中文周报，使用原来的套餐额度。GitHub Actions 每小时第17分钟读取已发布的公开只读数据；同步不调用 AI，不消耗 AI token。Actions 的排队和平台调度可能有延迟。

工作流先校验完整数据并同步，再部署 Pages。源接口失效、返回回退快照或数据不完整时，工作流失败，保留线上已部署版本，不部署残缺数据。当前仍保留 Vercel 作为后台发布结果的只读同步入口，暂不删除现有服务。此版改善访客请求路径，不保证大陆各网络都可达。

## 首次开通

1. 创建新的公开 GitHub 仓库 ai-weekly-cn，将本目录内容推送到 main。
2. 仓库 Settings > Pages > Source 选择 GitHub Actions。
3. Pages 中将 Custom domain 设置为 ai.shenlii.cn。不要修改现有个人站仓库的 Pages 设置。
4. 在现有 Cloudflare DNS 中新增 ai 的 CNAME，指向 qiufen-1.github.io，首次使用 DNS only。保持原主域名、www 和 NS 不变。只有确认新仓库启用 Pages 后再新增 DNS，避免悬空记录。
5. 等待域名检测和 HTTPS 证书签发，启用 Enforce HTTPS，再验证公开页面、数据、历史列表和 Actions。

## 本地验证

node --test scripts/test.mjs
node scripts/sync.mjs

无须配置任何 OpenAI API Key、GitHub PAT 或 Sites 后台令牌。工作流使用 GitHub 自带短期 GITHUB_TOKEN，只请求 Pages 发布权限。
