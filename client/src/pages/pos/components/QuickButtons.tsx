import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Product, QuickButton } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { Star, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuickButtonsProps {
  onProductSelect: (product: Product) => void;
}

export default function QuickButtons({ onProductSelect }: QuickButtonsProps) {
  const { toast } = useToast();

  const { data: quickButtons, isLoading: isLoadingButtons } = useQuery<
    (QuickButton & { product: Product })[]
  >({
    queryKey: ['/api/quick-buttons'],
  });

  const { mutate: addQuickButton } = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch('/api/quick-buttons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          position: (quickButtons?.length || 0) + 1
        })
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

  if (isLoadingButtons) {
    return <div>Caricamento tasti rapidi...</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {quickButtons?.map(button => (
        <Button
          key={button.id}
          variant="outline"
          className="h-24 relative"
          onClick={() => onProductSelect(button.product)}
        >
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
          
          <div className="flex flex-col items-center justify-center text-center">
            <Star className="w-8 h-8 mb-1 text-yellow-500" />
            <div className="text-sm font-medium truncate w-full">
              {button.product.name}
            </div>
            <div className="text-xs text-muted-foreground">
              €{button.product.price.toString()}
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}
