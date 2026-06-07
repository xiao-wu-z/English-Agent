export const PREFERRED_MEDIA_RECORDER_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4",
] as const;

export type MediaRecorderMimeSelection =
  | {
      supported: true;
      mimeType: string;
    }
  | {
      supported: false;
      message: string;
    };

export function selectSupportedMediaRecorderMimeType(
  isTypeSupported: (mimeType: string) => boolean,
): MediaRecorderMimeSelection {
  for (const mimeType of PREFERRED_MEDIA_RECORDER_MIME_TYPES) {
    if (isTypeSupported(mimeType)) {
      return {
        supported: true,
        mimeType,
      };
    }
  }
  return {
    supported: false,
    message: "当前浏览器暂不支持可用的语音格式，请继续使用文本练习。",
  };
}
