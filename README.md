# 胡闹厨房小程序

一个适合情侣或两人共同使用的微信小程序：记录常做菜谱、挑选食材、同步点菜车，并可通过后端接口发送推送通知。

> 本仓库是脱敏公开版本，不包含真实 AppID、服务器地址、PushPlus Token、微信用户 ID 或其他私密配置。

## 功能概览

- 首页：微信授权登录入口、点菜入口、挑选食材入口。
- 菜单：按分类浏览菜谱，加入点菜车。
- 点菜车：保存已点菜品，提交时可选择是否发送推送通知。
- 食材：选择常用食材，提交时可选择是否发送推送通知。
- 组合：根据已选食材推荐一菜、两菜、三菜，可选择是否配汤。
- 减脂：选择碳水、蛋白质、蔬菜等内容，生成一份简单减脂餐搭配。
- 管理：隐藏解锁后可维护菜单列表和食材列表。
- 设置：修改昵称头像、绑定另一位用户、测试推送通知。

## 目录结构

```text
.
|-- app.js / app.json / app.wxss
|-- assets/tabbar/              # 本地标签栏图标
|-- custom-tab-bar/             # 自定义底部标签栏
|-- pages/                      # 小程序页面
|-- utils/                      # API 配置和本地 mock 数据
`-- server/                     # 可选后端服务
```

## 本地开发

1. 使用微信开发者工具导入本目录。
2. 在 `project.config.json` 中填入你自己的小程序 AppID，或使用测试号。
3. 如需连接后端，在 `utils/config.js` 中配置你自己的 HTTPS API 地址：

```js
module.exports = {
  BASE_URL: 'https://your-domain.example.com/couple-cook-api',
  WS_URL: '',
  POLL_INTERVAL: 3000
}
```

4. 重新编译并预览。

## 后端说明

后端位于 `server/app.py`，使用 Python 标准库实现，便于在 VPS 上轻量部署。

示例环境变量见：

```text
server/.env.example
```

需要自行配置：

- `WECHAT_APPID` / `WECHAT_SECRET`：用于真实微信登录换取 openid。
- `PUSHPLUS_TOKENS`：用于推送通知。
- `DATA_DIR`：用于指定后端数据目录。

> 小程序体验版 / 正式版请使用可信 CA 证书签发的 HTTPS 域名，并在微信公众平台配置合法 request 域名。

## 脱敏说明

公开版本已移除或占位：

- 真实小程序 AppID；
- 真实服务器 IP / 域名；
- PushPlus Token；
- 微信用户 ID / openid；
- 本地开发者私有配置；
- 运行时数据库文件。

## License

仅供学习和二次开发参考。
