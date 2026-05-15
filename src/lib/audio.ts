export class AudioRecorder {
  audioContext: AudioContext | null = null;
  stream: MediaStream | null = null;
  processor: ScriptProcessorNode | null = null;
  source: MediaStreamAudioSourceNode | null = null;
  onData: (base64: string, volume: number) => void;

  constructor(onData: (base64: string, volume: number) => void) {
    this.onData = onData;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        },
      });
    } catch (error) {
      console.error("Microphone permission denied:", error);
      throw new Error("Microphone permission denied. Please grant access in your browser settings.");
    }
    console.log("Stream obtained:", this.stream);
    console.log("Audio tracks:", this.stream.getAudioTracks());
    
    this.audioContext = new AudioContext({ sampleRate: 16000, latencyHint: 'interactive' });
    await this.audioContext.resume();
    this.source = this.audioContext.createMediaStreamSource(this.stream);

    // Apply high-pass filter to remove low-end rumble (e.g., < 85Hz)
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 85;

    // Apply dynamic compressor to level audio
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = -20; // Allow more signal, less aggressive
    compressor.knee.value = 40;
    compressor.ratio.value = 4; // Much less aggressive ratio for voice
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    
    // Use smaller buffer for lower latency
    this.processor = this.audioContext.createScriptProcessor(1024, 1, 1);
    console.log("ScriptProcessor created");

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // DEBUG: Verify it is firing
      console.log("onaudioprocess firing", inputData.length);
      
      const pcm16 = new Int16Array(inputData.length);
      
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        sum += s * s;
      }
      
      const rms = Math.sqrt(sum / inputData.length);
      // Increased sensitivity/volume boost
      const volume = Math.min(1, rms * 15);
      
      // Convert Int16Array to base64 efficiently
      const bytes = new Uint8Array(pcm16.buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      
      this.onData(base64, volume);
    };

    this.source.connect(filter);
    filter.connect(compressor);
    compressor.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    // Don't connect to destination to avoid feedback loop - actually, ScriptProcessorNode usually needs to be connected to destination to process in many browsers.
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
    }
    if (this.source) {
      this.source.disconnect();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export class AudioStreamer {
  audioContext: AudioContext;
  nextPlayTime: number = 0;

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
  }

  addPCM16(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    if (this.nextPlayTime < this.audioContext.currentTime) {
      this.nextPlayTime = this.audioContext.currentTime + 0.05;
    }

    source.start(this.nextPlayTime);
    this.nextPlayTime += audioBuffer.duration;
  }

  stop() {
    if (this.audioContext.state === 'running') {
      this.audioContext.close();
    }
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    this.nextPlayTime = 0;
  }
}
