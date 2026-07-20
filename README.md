# fraq-plugin-ostracism

陶片放逐（禁言）你的群友。

## 安装与配置

将插件添加到 `fraq.yml` 的 `plugins` 字段下：

```yaml
plugins:
  ostracism:
    # 投票阈值，达到该票数后将禁言用户，默认值为 3
    voteThreshold: 3
    # 投票超时时间（分钟），超过该时间后将结束投票，默认值为 5
    muteTimeoutMinute: 5
    # 一个函数，接收投票数作为参数，返回禁言时长（秒）
    # 默认值为 `(voteCount) => (voteCount - 2) * 10 * 60`，即 `(投票数 - 2) * 10 分钟`
    # 例如，在默认配置下，如果 4 票通过，则禁言时长为 20 分钟。
    # 该配置只能在 TypeScript 中使用，fraq.yml 中无法配置 JS 函数
    # muteDurationSecond: (voteCount) => (voteCount - 2) * 10 * 60
```

## Usage

```
陶片禁言 @群友
```

随后机器人会在群里发起一个禁言提案，`muteTimeoutMinute` 分钟内如果有 `voteThreshold` 票或以上的赞成票，该用户将被禁言。投票方式为在原消息下回应表情【续标识】。
