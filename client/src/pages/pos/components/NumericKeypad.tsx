import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
}

export default function NumericKeypad({ value, onChange }: NumericKeypadProps) {
  const buttons = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '0', '.', 'C'
  ];

  const handleClick = (button: string) => {
    if (button === 'C') {
      onChange('');
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
        placeholder="Quantità"
      />

      <div className="grid grid-cols-3 gap-2">
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
    </div>
  );
}