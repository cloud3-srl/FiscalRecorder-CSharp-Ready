import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onDiscount?: (amount: number) => void;
}

export default function NumericKeypad({ value, onChange, onDiscount }: NumericKeypadProps) {
  const buttons = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '0', '00', 'CE'
  ];

  const handleClick = (button: string) => {
    if (button === 'CE') {
      onChange('');
    } else if (button === '00') {
      if (value === '') return;
      onChange(value + '00');
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

      {/* Numeric Keypad Grid */}
      <div className="grid grid-cols-4 gap-1">
        {/* Prima riga di bottoni speciali */}
        <Button variant="outline" className="h-12" onClick={() => onChange('')}>Pick List</Button>
        <Button variant="outline" className="h-12">Open Drawer</Button>
        <Button variant="outline" className="h-12">CE</Button>
        <Button variant="outline" className="h-12">C</Button>

        {/* Griglia numerica 3x4 */}
        {buttons.map((button) => (
          <Button
            key={button}
            variant={button === 'CE' ? "destructive" : "default"}
            onClick={() => handleClick(button)}
            className="h-12 text-xl"
          >
            {button}
          </Button>
        ))}

        {/* Bottoni azioni speciali */}
        <Button variant="outline" className="h-12">Qty</Button>
        <Button variant="default" className="h-12 bg-blue-600 hover:bg-blue-700">Show Total</Button>
        <Button variant="default" className="h-12 bg-green-600 hover:bg-green-700 col-span-2">Payment</Button>
      </div>
    </div>
  );
}