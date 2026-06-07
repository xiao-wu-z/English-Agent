## Why

语音链路打通后，不能只展示 Qwen 对话文本。产品目标是英语语音陪练，语音 transcript 也应进入现有 skills 流程，产出练习引导、轻纠错、评测和课后总结数据。

## What

- 将 Qwen user transcript 接入 practice session turn。
- 将 assistant transcript 或 skill-generated reply 统一记录为 assistant turn。
- 触发 correction skill 生成实时轻纠错。
- 结束语音 session 时触发 assessment 和 summary skills。
- 将 voice session 数据写入 local history 的安全文本字段。
- badcase 只记录 safe summary。

## Impact

- 让语音练习共享文本练习的 skill runtime、三层 prompt 和数据规范。
- 不保存 raw audio。
- 不暴露 hidden reasoning。
