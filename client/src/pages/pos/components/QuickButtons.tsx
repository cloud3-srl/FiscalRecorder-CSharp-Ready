import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Product, QuickButton } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { Plus, Star, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface QuickButtonsProps {
  onProductSelect: (product: Product) => void;
}

export default function QuickButtons({ onProductSelect }: QuickButtonsProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [longPressPosition, setLongPressPosition] = useState<number | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: quickButtons, isLoading: isLoadingButtons } = useQuery<
    (QuickButton & { product: Product })[]
  >({
    queryKey: ['/api/quick-buttons'],
  });

  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { mutate: addQuickButton } = useMutation({
    mutationFn: async (data: { productId: number, position: number }) => {
      const response = await fetch('/api/quick-buttons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Impossibile aggiungere il tasto rapido');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-buttons'] });
      toast({
        title: "Tasto rapido aggiunto",
        description: "Il prodotto è stato aggiunto ai preferiti"
      });
      setIsDialogOpen(false);
    }
  });

  const { mutate: removeQuickButton } = useMutation({
    mutationFn: async (buttonId: number) => {
      const response = await fetch(`/api/quick-buttons/${buttonId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Impossibile rimuovere il tasto rapido');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-buttons'] });
      toast({
        title: "Tasto rapido rimosso",
        description: "Il prodotto è stato rimosso dai preferiti"
      });
    }
  });

  const handleLongPressStart = (position: number) => {
    const timer = setTimeout(() => {
      setLongPressPosition(position);
      toast({
        title: "Modalità modifica",
        description: "Ora puoi modificare questo tasto rapido"
      });
    }, 4000); // 4 secondi

    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setLongPressPosition(null);
  };

  // Crea una griglia 4x4 di posizioni
  const gridPositions = Array.from({ length: 16 }, (_, i) => i + 1);

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {gridPositions.map(position => {
          const button = quickButtons?.find(b => b.position === position);

          return (
            <Button
              key={position}
              variant="outline"
              className="h-24 relative"
              onMouseDown={() => handleLongPressStart(position)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(position)}
              onTouchEnd={handleLongPressEnd}
              onClick={() => {
                if (longPressPosition === position) {
                  // In modalità modifica
                  if (button) {
                    removeQuickButton(button.id);
                  }
                } else if (button) {
                  // Normale click con prodotto
                  onProductSelect(button.product);
                } else {
                  // Bottone vuoto
                  setSelectedPosition(position);
                  setIsDialogOpen(true);
                }
              }}
            >
              {button ? (
                <>
                  {longPressPosition === position && (
                    <button
                      className="absolute top-1 right-1 p-1 hover:bg-red-100 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQuickButton(button.id);
                      }}
                      title="Rimuovi dai preferiti"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  )}

                  <div className="flex flex-col items-center justify-center text-center">
                    <Star className="w-8 h-8 mb-1 text-yellow-500" />
                    <div className="text-sm font-medium truncate w-full">
                      {button.product.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      €{button.product.price.toString()}
                    </div>
                  </div>
                </>
              ) : (
                <Plus className="w-8 h-8 text-gray-400" />
              )}
            </Button>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleziona un prodotto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Cerca prodotti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {filteredProducts?.map(product => (
                <Button
                  key={product.id}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center text-center p-2"
                  onClick={() => {
                    if (selectedPosition) {
                      addQuickButton({
                        productId: product.id,
                        position: selectedPosition
                      });
                    }
                  }}
                >
                  <div className="text-sm font-medium truncate w-full">
                    {product.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    €{product.price.toString()}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}