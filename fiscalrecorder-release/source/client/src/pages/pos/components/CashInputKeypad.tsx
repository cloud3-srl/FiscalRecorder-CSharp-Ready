import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, CornerDownLeft, Plus } from 'lucide-react';

interface CashInputKeypadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number) => void;
  triggerElement?: React.ReactNode; // Elemento che triggera il popover
}

export default function CashInputKeypad({ open, onOpenChange, onSubmit, triggerElement }: CashInputKeypadProps) {
  const [value, setValue] = useState('');

  const handleKeyPress = (key: string) => {
    if (key === 'ENTER') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        onSubmit(numValue);
        setValue('');
        onOpenChange(false);
      }
    } else if (key === 'C') {
      setValue('');
    } else if (key === 'X') {
      setValue(val => val.slice(0, -1));
    } else if (key === '+') {
      // Potrebbe essere usato per aggiungere un altro importo o per pagamenti parziali
      // Per ora, lo ignoriamo o lo trattiamo come un tasto non valido per l'input diretto
      console.log("Tasto '+' premuto, non implementato per input diretto contanti.");
    } else if (value.length < 10) { // Limita la lunghezza dell'input
      setValue(val => val + key);
    }
  };

  const keypadLayout = [
    '7', '8', '9', 'X',
    '4', '5', '6', 'C',
    '1', '2', '3', '+',
    '0', '00', '.', 'ENTER',
  ];

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {triggerElement && <PopoverTrigger asChild>{triggerElement}</PopoverTrigger>}
      <PopoverContent className="w-auto p-2 bg-slate-700 border-slate-600" side="bottom" align="center">
        <div className="flex flex-col space-y-2">
          <Input
            type="text"
            value={value || "0"}
            readOnly
            className="h-10 text-right text-xl font-mono bg-slate-800 text-white border-slate-600"
          />
          <div className="grid grid-cols-4 gap-1">
            {keypadLayout.map(key => (
              <Button
                key={key}
                variant="default"
                className={`h-12 text-lg 
                  ${key === 'ENTER' ? 'col-span-1 bg-blue-500 hover:bg-blue-600 text-white' : ''}
                  ${['C', 'X', '+'].includes(key) ? 'bg-slate-500 hover:bg-slate-600 text-white' : ''}
                  ${!['ENTER', 'C', 'X', '+'].includes(key) ? 'bg-slate-600 hover:bg-slate-500 text-white' : ''}
                `}
                onClick={() => handleKeyPress(key)}
              >
                {key === 'X' ? <X className="h-5 w-5" /> : key === 'ENTER' ? <CornerDownLeft className="h-5 w-5" /> : key}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
