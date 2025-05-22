
import { FC } from 'react';

export interface GiftSelectionProps {
  onClose: () => void;
  onSelectGift: (giftId: string, giftName: string, giftPrice: number) => void;
}

declare const GiftSelection: FC<GiftSelectionProps>;
export default GiftSelection;
