
/**
 * @deprecated Este serviço do lado do cliente está obsoleto. 
 * Use a função de nuvem 'elevenlabs-text-to-speech' do Supabase para maior segurança e para evitar expor chaves de API.
 */

export interface ElevenLabsResponse {
  text?: string;
  audioContent?: string;
  error?: string;
}

class ElevenLabsService {
  constructor() {
    console.warn("DEPRECATED: O ElevenLabsService do lado do cliente não deve ser usado. Use as funções de nuvem do Supabase.");
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    throw new Error("Função obsoleta. Use uma função de nuvem do Supabase para transcrição.");
  }

  async generateSpeech(text: string, voiceId: string = 'XB0fDUnXU5powFXDhCwa'): Promise<Blob> {
    throw new Error("Função obsoleta. Use a função de nuvem 'elevenlabs-text-to-speech' do Supabase.");
  }

  createAudioUrl(audioBlob: Blob): string {
    throw new Error("Função obsoleta.");
  }

  revokeAudioUrl(url: string): void {
    throw new Error("Função obsoleta.");
  }
}

export const elevenLabsService = new ElevenLabsService();
