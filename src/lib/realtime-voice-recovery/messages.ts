import type { VoiceRecoveryReason, VoiceTimeoutType } from "./schema.ts";

const messages: Record<VoiceTimeoutType | VoiceRecoveryReason, string> = {
  microphone_permission_timeout: "麦克风授权超时，可以先切换到文本练习继续。",
  qwen_connect_timeout: "实时语音连接超时，可以先使用文本练习继续。",
  qwen_connect_failed: "实时语音连接失败，可以先使用文本练习继续。",
  no_user_speech_timeout: "暂时没有检测到有效语音，可以重新录音或使用文本练习。",
  no_assistant_response_timeout: "老师回复超时，可以先使用文本练习继续。",
  assistant_response_timeout: "老师回复超时，可以先使用文本练习继续。",
  sse_idle_timeout: "语音事件连接暂时没有响应，可以先使用文本练习继续。",
  sse_disconnected: "语音事件连接已断开，系统会尝试恢复；也可以先使用文本练习。",
  audio_send_timeout: "语音发送超时，可以重新录音或使用文本练习。",
  summary_timeout: "课后总结生成超时，本次练习记录仍会保留。",
  no_transcript_after_audio: "没有识别到有效语音内容，可以重新录音或使用文本练习。",
  event_parse_failed: "语音事件解析异常，当前转写会尽量保留。",
  summary_failed: "课后总结暂时失败，可以稍后重试。",
  unsupported_audio_format: "当前浏览器录音格式暂不能直连实时模型，请先使用文本练习。",
};

export function getVoiceRecoveryMessage(reason: VoiceTimeoutType | VoiceRecoveryReason): string {
  return messages[reason];
}
