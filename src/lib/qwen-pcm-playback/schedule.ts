export type PcmPlaybackSchedule = {
  startTime: number;
  endTime: number;
};

export function schedulePcmPlayback(input: {
  currentTime: number;
  nextStartTime: number;
  sampleCount: number;
  sampleRate: number;
}): PcmPlaybackSchedule {
  const startTime = Math.max(input.currentTime, input.nextStartTime);
  return {
    startTime,
    endTime: startTime + input.sampleCount / input.sampleRate,
  };
}
