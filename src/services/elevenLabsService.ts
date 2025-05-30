
import { supabase } from '@/integrations/supabase/client';

export interface ElevenLabsResponse {
  text?: string;
  audioContent?: string;
  error?: string;
}

class ElevenLabsService {
  private agentId = 'agent_01jwfmbhwtfm9aanc0r7sbqzdf';
  
  private async getSignedUrl(): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-get-signed-url', {
        body: { agentId: this.agentId }
      });

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Erro ao obter URL assinada:', error);
      throw new Error('Falha ao conectar com ElevenLabs');
    }
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-transcribe', {
        body: { 
          audio: await this.blobToBase64(audioBlob)
        }
      });

      if (error) throw error;
      return data.text || '';
    } catch (error) {
      console.error('Erro na transcrição:', error);
      throw new Error('Falha na transcrição do áudio');
    }
  }

  async generateSpeech(text: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-text-to-speech', {
        body: { 
          text,
          voiceId: 'XB0fDUnXU5powFXDhCwa' // Charlotte voice
        }
      });

      if (error) throw error;
      return data.audioContent;
    } catch (error) {
      console.error('Erro na geração de áudio:', error);
      throw new Error('Falha na geração do áudio');
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  base64ToAudioUrl(base64Audio: string): string {
    const byteCharacters = atob(base64Audio);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  }
}

export const elevenLabsService = new ElevenLabsService();
