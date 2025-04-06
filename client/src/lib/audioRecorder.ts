// Import lamejs for MP3 encoding
import lamejs from 'lamejs';

export interface RecordingSession {
  mediaRecorder: MediaRecorder;
  audioChunks: Blob[];
  stream: MediaStream;
  analyser: AnalyserNode;
  startTime: number;
  pausedDuration: number;
  isPaused: boolean;
  isRecording: boolean;
}

export const startRecording = async (
  onDataAvailable: (event: BlobEvent) => void,
  onVisualizationData?: (dataArray: Uint8Array) => void
): Promise<RecordingSession> => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const audioChunks: Blob[] = [];

  // Set up audio context for visualization
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  // Set up visualization data handling
  if (onVisualizationData) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateVisualization = () => {
      if (mediaRecorder.state === 'recording') {
        analyser.getByteFrequencyData(dataArray);
        onVisualizationData(dataArray);
        requestAnimationFrame(updateVisualization);
      }
    };
    
    updateVisualization();
  }

  // Set up media recorder event handlers
  mediaRecorder.ondataavailable = onDataAvailable;
  mediaRecorder.onstop = () => {
    stream.getTracks().forEach(track => track.stop());
  };
  
  mediaRecorder.start(100);
  
  return {
    mediaRecorder,
    audioChunks,
    stream,
    analyser,
    startTime: Date.now(),
    pausedDuration: 0,
    isPaused: false,
    isRecording: true
  };
};

export const pauseRecording = (session: RecordingSession): RecordingSession => {
  if (session.mediaRecorder.state === 'recording') {
    session.mediaRecorder.pause();
    session.isPaused = true;
    return {
      ...session,
      isPaused: true
    };
  }
  return session;
};

export const resumeRecording = (session: RecordingSession): RecordingSession => {
  if (session.mediaRecorder.state === 'paused') {
    session.mediaRecorder.resume();
    return {
      ...session,
      isPaused: false,
      pausedDuration: session.pausedDuration + (Date.now() - session.startTime)
    };
  }
  return session;
};

export const stopRecording = (session: RecordingSession): void => {
  if (session.mediaRecorder.state !== 'inactive') {
    session.mediaRecorder.stop();
    session.stream.getTracks().forEach(track => track.stop());
  }
};

export const getRecordingTime = (session: RecordingSession): string => {
  if (!session) return '00:00:00';
  
  const currentTime = session.isPaused ? session.startTime : Date.now();
  const elapsedTime = Math.floor((currentTime - session.startTime - session.pausedDuration) / 1000);
  
  const hours = Math.floor(elapsedTime / 3600);
  const minutes = Math.floor((elapsedTime % 3600) / 60);
  const seconds = elapsedTime % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
};

export const createAudioBlobFromChunks = (chunks: Blob[]): Blob => {
  // Create the initial audio blob (typically in webm format)
  return new Blob(chunks, { type: 'audio/webm' });
};

// Function to convert audio blob to MP3 format for smaller file size
export const convertToMP3 = async (audioBlob: Blob): Promise<Blob> => {
  try {
    console.log('Starting audio conversion to MP3');
    // First convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    console.log(`Audio buffer size: ${arrayBuffer.byteLength} bytes`);
    
    // Create an audio context for decoding
    const audioContext = new AudioContext();
    
    // Decode the audio data
    console.log('Decoding audio data...');
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log(`Decoded audio: ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate}Hz, ${audioBuffer.length} samples`);
    
    // Get audio data as Float32Array
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;
    
    // Parameters for MP3 encoding
    const sampleRate = audioBuffer.sampleRate;
    const bitRate = 96; // Lower bitrate for smaller files (96kbps)
    console.log(`Initializing MP3 encoder: ${audioBuffer.numberOfChannels} channels, ${sampleRate}Hz, ${bitRate}kbps`);
    const mp3encoder = new lamejs.Mp3Encoder(audioBuffer.numberOfChannels, sampleRate, bitRate);
    
    const mp3Data: Int8Array[] = [];
    const sampleBlockSize = 1152; // Use a multiple of 576 for better compatibility
    
    // Process the audio data in chunks
    console.log(`Processing audio data in chunks of ${sampleBlockSize} samples`);
    const totalChunks = Math.ceil(leftChannel.length / sampleBlockSize);
    console.log(`Total chunks to process: ${totalChunks}`);
    
    for (let i = 0; i < leftChannel.length; i += sampleBlockSize) {
      // Create sample buffers
      const leftSamples = new Int16Array(sampleBlockSize);
      const rightSamples = new Int16Array(sampleBlockSize);
      
      // Fill sample buffers
      for (let j = 0; j < sampleBlockSize; j++) {
        const idx = i + j;
        if (idx < leftChannel.length) {
          // Convert float audio data to int16
          leftSamples[j] = Math.max(-32768, Math.min(32767, leftChannel[idx] * 32768));
          rightSamples[j] = Math.max(-32768, Math.min(32767, rightChannel[idx] * 32768));
        }
      }
      
      // Encode samples to MP3
      const mp3buf = audioBuffer.numberOfChannels === 1
        ? mp3encoder.encodeBuffer(leftSamples)
        : mp3encoder.encodeBuffer(leftSamples, rightSamples);
      
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
      
      // Log progress for every 10% of chunks processed
      if (i % (sampleBlockSize * Math.floor(totalChunks / 10)) === 0) {
        const progress = Math.floor((i / leftChannel.length) * 100);
        console.log(`Encoding progress: ${progress}%`);
      }
    }
    
    // Finalize the encoding
    console.log('Finalizing MP3 encoding...');
    const finalMp3Buf = mp3encoder.flush();
    if (finalMp3Buf.length > 0) {
      mp3Data.push(finalMp3Buf);
    }
    
    // Calculate total length of all mp3 chunks
    let totalLength = 0;
    mp3Data.forEach(data => totalLength += data.length);
    console.log(`Total MP3 data length: ${totalLength} bytes`);
    
    // Create a single buffer with all mp3 data
    const mp3Buffer = new Uint8Array(totalLength);
    let offset = 0;
    mp3Data.forEach(data => {
      mp3Buffer.set(data, offset);
      offset += data.length;
    });
    
    // Create and return the MP3 blob
    const mp3Blob = new Blob([mp3Buffer], { type: 'audio/mp3' });
    console.log(`MP3 conversion complete. Final size: ${mp3Blob.size} bytes`);
    return mp3Blob;
  } catch (error) {
    console.error('Error converting to MP3:', error);
    // Return the original blob if conversion fails
    return audioBlob;
  }
};

export const uploadAudio = async (audioBlob: Blob, metadata: any = {}, customHeaders: HeadersInit = {}): Promise<string> => {
  try {
    console.log(`Preparing audio file of type ${audioBlob.type}, size ${audioBlob.size} bytes for database storage`);
    
    // Extract the lecture metadata if available
    const { title, courseId, teacherId } = metadata;
    
    // Generate a unique identifier for the audio file
    const timestamp = new Date().getTime();
    const fileIdentifier = `lecture_${title ? title.replace(/\s+/g, '_') : 'untitled'}_${timestamp}`;
    
    console.log('Converting audio to base64 for Neon database storage...');
    const base64Audio = await blobToBase64(audioBlob);
    console.log(`Base64 conversion complete, length: ${base64Audio ? base64Audio.length : 0} characters`);
    
    // Generate a URL for referencing this audio file in the UI (virtual URL)
    const virtualAudioUrl = `/api/audio/${fileIdentifier}`;
    
    // Prepare headers - combine default headers with any custom headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders, // Add any custom headers passed to the function
    };
    
    console.log('Sending audio and metadata to API...');
    
    // Send audio data and metadata to the server API
    const response = await fetch('/api/upload-audio', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        audioUrl: virtualAudioUrl,
        audioContent: base64Audio,
        audioType: audioBlob.type || 'audio/mp3',
        lectureId: metadata.lectureId ? parseInt(metadata.lectureId.toString()) : undefined,
        title: metadata.title,
        courseId: metadata.courseId ? parseInt(metadata.courseId.toString()) : undefined,
        teacherId: metadata.teacherId ? parseInt(metadata.teacherId.toString()) : undefined
      }),
    });
    
    console.log(`API response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.message || errorData.error || '';
      } catch (e) {
        // If response can't be parsed as JSON, use text instead
        errorDetails = await response.text();
      }
      
      throw new Error(`Failed to store audio in database: ${response.status} ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ''}`);
    }
    
    const data = await response.json();
    console.log(`Upload process complete, virtual URL: ${data.audioUrl || virtualAudioUrl}`);
    return data.audioUrl || virtualAudioUrl;
  } catch (error) {
    console.error('Error in uploadAudio function:', error);
    throw error; // Re-throw to be handled by the component
  }
};

// Helper function to convert a Blob to a base64 string
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // The result includes the data URL prefix (e.g., "data:audio/webm;base64,"),
      // so we split and take the second part to get just the base64 data
      const base64Data = reader.result as string;
      const base64String = base64Data.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
