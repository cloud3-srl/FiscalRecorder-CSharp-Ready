import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onDiscount?: (amount: number) => void;
}

export default function NumericKeypad({ value, onChange, onDiscount }: NumericKeypadProps) {
  const handleClick = (button: string) => {
    switch (button) {
      case 'CE':
      case 'C':
        onChange('');
        break;
      case '00':
        if (value === '') return;
        onChange(value + '00');
        break;
      default:
        onChange(value + button);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-right text-2xl h-12"
        placeholder="0.00"
      />

      <div className="grid grid-cols-4 gap-1">
        {/* Prima riga - Funzioni speciali */}
        <Button variant="outline" className="h-12" onClick={() => onChange('')}>
          Pick List
        </Button>
        <Button variant="outline" className="h-12">
          Open Drawer
        </Button>
        <Button variant="outline" className="h-12" onClick={() => onChange('')}>
          CE
        </Button>
        <Button variant="outline" className="h-12" onClick={() => onChange('')}>
          C
        </Button>

        {/* Griglia numerica */}
        {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00'].map((button) => (
          <Button
            key={button}
            onClick={() => handleClick(button)}
            className="h-12 text-xl"
            variant={button === 'CE' ? "destructive" : "default"}
          >
            {button}
          </Button>
        ))}

        {/* Ultima riga - Funzioni speciali */}
        <Button variant="outline" className="h-12">
          Qty
        </Button>
        <Button variant="default" className="h-12 bg-blue-600 hover:bg-blue-700">
          Show Total
        </Button>
        <Button 
          variant="default" 
          className="h-12 bg-green-600 hover:bg-green-700 col-span-2"
        >
          Payment
        </Button>
      </div>
    </div>
  );
}