class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0 || !input[0] || input[0].length === 0) {
      return true;
    }
    const channels = input.map((channel) => channel.slice(0));
    this.port.postMessage({
      type: "audio-frame",
      sampleRate,
      channels,
    });
    return true;
  }
}

registerProcessor("pcm-capture-processor", PcmCaptureProcessor);
