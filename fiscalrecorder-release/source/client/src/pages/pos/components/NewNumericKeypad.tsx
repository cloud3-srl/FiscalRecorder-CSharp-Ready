import { Button } from "@/components/ui/button";

interface NewNumericKeypadProps {
  onKeyPress: (key: string) => void;
  // onDiscount?: (amount: number) => void; // Rimosso per ora, può essere aggiunto se necessario
}

export default function NewNumericKeypad({ onKeyPress }: NewNumericKeypadProps) {
  // Layout dei tasti come da screenshot fornito (quello sotto il carrello)
  const layout = [
    { key: 'C', className: "bg-slate-200 hover:bg-slate-300 text-slate-800" }, // Tasto C (Clear?)
    { key: 'PAGA', className: "col-span-1 bg-green-500 hover:bg-green-600 text-white" },
    { key: 'RESO', className: "bg-amber-500 hover:bg-amber-600 text-white" },
    { key: 'SUB', className: "bg-sky-500 hover:bg-sky-600 text-white" },
    
    { key: '7', className: "" }, { key: '8', className: "" }, { key: '9', className: "" },
    { key: 'x', label: '×', className: "bg-slate-200 hover:bg-slate-300 text-slate-800" }, // Moltiplicazione
    
    { key: '4', className: "" }, { key: '5', className: "" }, { key: '6', className: "" },
    { key: '-', className: "bg-slate-200 hover:bg-slate-300 text-slate-800" }, // Sottrazione
    
    { key: '1', className: "" }, { key: '2', className: "" }, { key: '3', className: "" },
    { key: '%-', className: "bg-sky-500 hover:bg-sky-600 text-white" }, // Sconto percentuale
    
    { key: '0', className: "" }, { key: '00', className: "" }, { key: '.', className: "" },
    { key: '%+', className: "bg-sky-500 hover:bg-sky-600 text-white" }, // Aumento percentuale / Maggiorazione
    
    // Il tasto TOT non è visibile nello screenshot del tastierino, ma era nel layout precedente.
    // Lo aggiungo qui, potrebbe essere un col-span-4 o rimosso se non serve.
    // Per ora lo ometto per seguire strettamente lo screenshot del tastierino.
    // { key: 'TOT', className: "col-span-4 bg-blue-500 hover:bg-blue-600 text-white" },
  ];

  return (
    <div className="grid grid-cols-4 gap-1">
      {layout.map((btn) => (
        <Button
          key={btn.key}
          variant="default" // Default per i numeri, sovrascritto da className per gli altri
          className={`h-14 text-xl ${btn.className || 'bg-gray-700 hover:bg-gray-800 text-white'} ${btn.key === 'PAGA' ? 'col-span-1' : ''}`}
          onClick={() => onKeyPress(btn.key)}
        >
          {btn.label || btn.key}
        </Button>
      ))}
    </div>
  );
}
