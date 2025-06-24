import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarUpdate: (avatarUrl: string) => void;
  userName?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarUpdate,
  userName
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, file, { upsert: true });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      onAvatarUpdate(publicUrl);
      toast.success('Avatar atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload do avatar:', error);
      toast.error('Erro ao atualizar avatar');
    } finally {
      setUploading(false);
      setPreviewUrl(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      uploadAvatar(file);
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      uploadAvatar(file);
    }
  };

  const closeModal = () => {
    setPreviewUrl(null);
    if (onAvatarUpdate) {
      // Fechar modal chamando a função de callback sem parâmetros
      // Isso indica que o modal deve ser fechado
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Atualizar Avatar</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeModal}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center mb-6">
          <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden">
            {previewUrl || currentAvatarUrl ? (
              <img 
                src={previewUrl || currentAvatarUrl || ''} 
                alt="Avatar Preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl text-white font-bold">
                {userName ? userName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {uploading && (
            <div className="mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Fazendo upload...</p>
            </div>
          )}
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Câmera
          </Button>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Galeria
          </Button>
        </div>

        {/* Input para câmera */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleCameraCapture}
          className="hidden"
        />

        {/* Input para galeria */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default AvatarUpload;