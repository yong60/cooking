# Couple Cook API

这是“胡闹厨房”小程序的可选后端服务，用于保存用户状态、点菜车、食材选择、管理菜谱/食材，以及调用 PushPlus 发送通知。

## 启动

```bash
cd server
cp .env.example .env
python3 app.py
```

默认端口：`31080`。

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `PORT` | 服务端口，默认 `31080` |
| `WECHAT_APPID` | 你自己的小程序 AppID，可选 |
| `WECHAT_SECRET` | 你自己的小程序 Secret，可选 |
| `PUSHPLUS_TOKENS` | PushPlus Token，多个可用逗号或分号分隔 |
| `DATA_DIR` | 运行时数据目录，默认 `server/data` |

## 部署提示

- 请不要提交 `.env`、运行时数据库、真实 token 或真实用户 ID。
- 小程序体验版 / 正式版建议通过 HTTPS 域名访问后端。
- HTTPS 证书建议使用可信 CA 证书，不建议在体验版 / 正式版依赖自签名证书。
