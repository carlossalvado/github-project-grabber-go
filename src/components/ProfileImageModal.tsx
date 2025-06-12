
import React from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  agentName: string;
}

const ProfileImageModal: React.FC<ProfileImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  agentName
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-screen bg-black/95 border-none p-0 flex items-center justify-center">
        {/* Close Button */}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full h-10 w-10"
            onClick={onClose}
          >
            <X size={24} />
          </Button>
        </DialogClose>

        {/* Agent Name */}
        <div className="absolute top-4 left-4 z-50">
          <h2 className="text-white text-lg font-medium">{agentName}</h2>
        </div>

        {/* Image Container */}
        <div className="flex items-center justify-center w-full h-full p-8">
          <img
            src={imageUrl}
            alt={agentName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Background overlay for closing */}
        <div 
          className="absolute inset-0 bg-transparent cursor-pointer" 
          onClick={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProfileImageModal;
