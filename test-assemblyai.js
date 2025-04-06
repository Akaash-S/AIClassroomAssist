// Simple test script to verify AssemblyAI integration
const { transcribeAudio } = require('./server/services/assemblyai');

// Test with a base64 audio string (shortened for example)
const testBase64Audio = "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAHTENFgBcHWkwt3JvbGRQlnGU9zI..."
  + "..."; // This would be a real base64 audio string

// Test the transcription function
async function testAssemblyAITranscription() {
  try {
    console.log('Starting AssemblyAI transcription test...');
    const transcript = await transcribeAudio(testBase64Audio);
    console.log('Transcription successful:', transcript);
    return transcript;
  } catch (error) {
    console.error('AssemblyAI transcription test failed:', error);
  }
}

// Don't run this directly as we don't have a valid base64 string
// Simpler test just to check module loads correctly
console.log('AssemblyAI module loaded successfully');
console.log('API key found:', Boolean(process.env.ASSEMBLYAI_API_KEY));
console.log('To run a complete test, use a valid audio file or base64 string');

// Export for use in other tests
module.exports = { testAssemblyAITranscription };