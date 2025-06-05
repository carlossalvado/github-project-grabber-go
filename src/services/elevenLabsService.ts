
export interface ElevenLabsResponse {
  text?: string;
  audioContent?: string;
  error?: string;
}

class ElevenLabsService {
  private apiKey = 'sk_9eb765fea090202fcc226bffc261d4b04b01c97013f4fcc3';
  private baseUrl = 'https://api.elevenlabs.io/v1';

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      const response = await fetch(`${this.baseUrl}/speech-to-text`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.error('Erro na transcrição:', error);
      throw new Error('Falha na transcrição do áudio');
    }
  }

  async generateSpeech(text: string, voiceId: string = 'XB0fDUnXU5powFXDhCwa'): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Speech generation failed: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Erro na geração de áudio:', error);
      throw new Error('Falha na geração do áudio');
    }
  }

  createAudioUrl(audioBlob: Blob): string {
    return URL.createObjectURL(audioBlob);
  }

  revokeAudioUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const elevenLabsService = new ElevenLabsService();
