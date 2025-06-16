import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface AudioMessage {
  id: string;
  type: 'user' | 'assistant';
  audioBlob?: Blob;
  audioUrl?: string;
  timestamp: string;
  isPlaying?: boolean;
}

export const useElevenLabsAudio = () => {
  const [audioMessages, setAudioMessages] = useState<AudioMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const ELEVENLABS_API_KEY = 'sk_3fc258809d4f1d87b425c7923a55ff0a2be0272a085de8f9';
  const AGENT_ID = 'agent_01jxwps2rffj1tnfjqnzxdvktd';

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          toast.warning("Nenhum áudio foi gravado.");
          return;
        }
        
        let audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // --- START FIX FOR BUFFER SIZE ERROR ---
        if (audioBlob.size % 2 !== 0) {
          const padding = new Uint8Array([0]);
          audioBlob = new Blob([audioBlob, padding], { type: 'audio/webm' });
        }
        // --- END FIX FOR BUFFER SIZE ERROR ---

        processAudioWithElevenLabs(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao acessar microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processAudioWithElevenLabs = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Salvar áudio do usuário no cache
      const userAudioUrl = URL.createObjectURL(audioBlob);
      const userMessage: AudioMessage = {
        id: crypto.randomUUID(),
        type: 'user',
        audioBlob,
        audioUrl: userAudioUrl,
        timestamp: new Date().toISOString()
      };
      
      setAudioMessages(prev => [...prev, userMessage]);
      
      console.log('=== INÍCIO DO ENVIO PARA ELEVENLABS ===');
      console.log('Agent ID:', AGENT_ID);
      console.log('Audio blob size:', audioBlob.size);
      
      const audioResponse = await sendToElevenLabsAgent(audioBlob);
      
      if (audioResponse) {
        console.log('ElevenLabs audioResponse received, size:', audioResponse.size);
        const assistantAudioUrl = URL.createObjectURL(audioResponse);
        const assistantMessage: AudioMessage = {
          id: crypto.randomUUID(),
          type: 'assistant',
          audioBlob: audioResponse,
          audioUrl: assistantAudioUrl,
          timestamp: new Date().toISOString()
        };
        
        setAudioMessages(prev => [...prev, assistantMessage]);
        
        // Reproduzir automaticamente a resposta
        setTimeout(() => playAudio(assistantMessage), 500);
      } else {
        console.warn('ElevenLabs audioResponse is null or empty.');
        toast.error('Não foi possível obter resposta de áudio do ElevenLabs.');
      }
      
    } catch (error: any) {
      console.error('=== ERRO NO PROCESSAMENTO ELEVENLABS ===');
      console.error('Erro:', error);
      toast.error(`Erro ao processar áudio: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendToElevenLabsAgent = async (audioBlob: Blob): Promise<Blob | null> => {
    try {
      console.log('Obtendo URL assinada para o agente...');
      
      // Primeiro, obter a URL assinada para o agente
      const signedUrlResponse = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`, {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        }
      });
      
      console.log('Resposta da URL assinada - Status:', signedUrlResponse.status);
      
      if (!signedUrlResponse.ok) {
        const errorText = await signedUrlResponse.text();
        console.error('Erro ao obter URL assinada:', errorText);
        throw new Error(`Erro ao obter URL assinada: ${signedUrlResponse.status} - ${errorText}`);
      }
      
      const { signed_url } = await signedUrlResponse.json();
      console.log('URL assinada obtida com sucesso');
      
      // Conectar via WebSocket com o agente
      return new Promise((resolve, reject) => {
        console.log('Iniciando conexão WebSocket...');
        const ws = new WebSocket(signed_url);
        let audioResponse: Blob | null = null;
        const audioChunks: Uint8Array[] = [];
        
        ws.onopen = () => {
          console.log('✅ Conectado ao agente ElevenLabs');
          
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const uint8Array = new Uint8Array(arrayBuffer);
            
            console.log('Enviando áudio em chunks, tamanho total:', uint8Array.length);
            
            // --- START FIX FOR AUDIO STREAMING ---
            const chunkSize = 4096;
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
              const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
              
              let binary = '';
              const len = chunk.byteLength;
              for (let j = 0; j < len; j++) {
                  binary += String.fromCharCode(chunk[j]);
              }
              const base64Chunk = btoa(binary);
              
              ws.send(JSON.stringify({
                user_audio_chunk: base64Chunk
              }));
            }
            // --- END FIX FOR AUDIO STREAMING ---
            
            console.log('Finalizando envio de áudio...');
            ws.send(JSON.stringify({
              user_audio_chunk: ""
            }));
          };
          reader.readAsArrayBuffer(audioBlob);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 Mensagem recebida do ElevenLabs:', data.audio_event?.event_id || 'message');
            
            if (data.audio_event && data.audio_event.audio_base_64) {
              const binaryString = atob(data.audio_event.audio_base_64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              audioChunks.push(bytes);
            }
            
            if (data.audio_event && data.audio_event.event_id === 'audio_stream_end') {
              console.log('🎵 ElevenLabs: audio_stream_end - Finalizando áudio');
              const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
              const combinedAudio = new Uint8Array(totalLength);
              let offset = 0;
              for (const chunk of audioChunks) {
                combinedAudio.set(chunk, offset);
                offset += chunk.length;
              }
              
              audioResponse = new Blob([combinedAudio], { type: 'audio/mpeg' });
              console.log('✅ Áudio combinado criado, tamanho:', audioResponse.size);
              ws.close();
            }
          } catch (error) {
            console.error('❌ Erro ao processar mensagem WebSocket:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('🔌 Conexão WebSocket fechada');
          resolve(audioResponse);
        };
        
        ws.onerror = (error) => {
          console.error('❌ Erro WebSocket:', error);
          reject(new Error('Erro na conexão WebSocket'));
        };
        
        // Timeout de 30 segundos
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            console.log('⏱️ Timeout - Fechando conexão');
            ws.close();
            reject(new Error('Timeout na conexão com o agente'));
          }
        }, 30000);
      });
      
    } catch (error) {
      console.error('❌ Erro ao conectar com agente ElevenLabs:', error);
      return null;
    }
  };

  const playAudio = async (message: AudioMessage) => {
    if (!message.audioUrl) {
      console.warn('Attempted to play audio with no audioUrl:', message);
      return;
    }
    
    try {
      // Parar qualquer áudio em reprodução
      audioElementsRef.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      
      let audio = audioElementsRef.current.get(message.id);
      
      if (!audio) {
        audio = new Audio(message.audioUrl);
        audioElementsRef.current.set(message.id, audio);
        
        audio.onended = () => {
          console.log('Audio playback ended for message:', message.id);
          setAudioMessages(prev => 
            prev.map(msg => 
              msg.id === message.id ? { ...msg, isPlaying: false } : msg
            )
          );
        };
        
        audio.onerror = (e) => {
          console.error("Erro ao carregar ou tocar o áudio:", e);
          if (audio) {
            console.error('Audio element error code:', audio.error?.code);
            console.error('Audio element error message:', audio.error?.message);
          }
          toast.error("Erro ao carregar o áudio.");
          setAudioMessages(prev => 
            prev.map(msg => 
              msg.id === message.id ? { ...msg, isPlaying: false } : msg
            )
          );
        };
      }
      
      setAudioMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? { ...msg, isPlaying: true } : { ...msg, isPlaying: false }
        )
      );
      
      await audio.play();
      console.log('Attempting to play audio for message:', message.id);
      
    } catch (error) {
      console.error("Erro ao tocar áudio (catch block):", error);
      toast.error("Não foi possível tocar o áudio.");
    }
  };

  const clearAudioMessages = () => {
    // Limpar URLs dos objetos para liberar memória
    audioMessages.forEach(message => {
      if (message.audioUrl) {
        URL.revokeObjectURL(message.audioUrl);
      }
    });
    
    // Parar e limpar elementos de áudio
    audioElementsRef.current.forEach((audio) => {
      audio.pause();
      if (audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
      }
    });
    audioElementsRef.current.clear();
    
    setAudioMessages([]);
  };

  return {
    audioMessages,
    isRecording,
    isProcessing,
    recordingTime,
    startRecording,
    stopRecording,
    playAudio,
    clearAudioMessages
  };
};
