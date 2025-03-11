import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onDiscount?: (amount: number) => void;
}

export default function NumericKeypad({ value, onChange, onDiscount }: NumericKeypadProps) {
  const discountButtons = ['1', '5', '10', '20', '50', '100'];

  const buttons = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '0', '00', 'C'
  ];

  const handleClick = (button: string) => {
    if (button === 'C') {
      onChange('');
    } else if (button === '00') {
      if (value === '') return;
      onChange(value + '00');
    } else if (button === '.' && value.includes('.')) {
      return;
    } else {
      onChange(value + button);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-right text-2xl"
        placeholder="0.00"
      />

      <div className="grid grid-cols-6 gap-1">
        {discountButtons.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            onClick={() => onDiscount?.(parseFloat(amount))}
            className="h-8 text-xs"
            title={`Sconto €${amount}`}
          >
            €{amount}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1">
        {buttons.map((button) => (
          <Button
            key={button}
            variant={button === 'C' ? "destructive" : "default"}
            onClick={() => handleClick(button)}
            className="h-12 text-xl"
            title={button === 'C' ? 'Cancella' : button}
          >
            {button}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1">
        <Button 
          variant="outline" 
          className="h-12"
          onClick={() => onChange(value)}
        >
          Subtotale
        </Button>
        <Button 
          variant="default" 
          className="h-12 bg-green-600 hover:bg-green-700"
          onClick={() => onChange(value)}
        >
          Totale
        </Button>
      </div>
    </div>
  );
}