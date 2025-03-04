import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product, QuickButton } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { Plus, Star, X, Pencil, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface QuickButtonsProps {
  onProductSelect: (product: Product) => void;
}

interface QuickButtonWithProduct extends QuickButton {
  product: Product;
}

export default function QuickButtons({ onProductSelect }: QuickButtonsProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("1");

  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: quickButtons, isLoading: isLoadingButtons } = useQuery<QuickButtonWithProduct[]>({
    queryKey: ['/api/quick-buttons'],
  });

  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredButtons = quickButtons?.filter(button => 
    button.department === parseInt(selectedDepartment)
  );

  const { mutate: addQuickButton, isPending: isAddingButton } = useMutation({
    mutationFn: async (data: { productId: number, position: number }) => {
      const response = await fetch('/api/quick-buttons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          department: parseInt(selectedDepartment)
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
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il tasto rapido",
        variant: "destructive"
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
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile rimuovere il tasto rapido",
        variant: "destructive"
      });
    }
  });

  // Crea una griglia 4x4 di posizioni
  const gridPositions = Array.from({ length: 16 }, (_, i) => i + 1);

  if (isLoadingButtons) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Preferiti</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditMode(!isEditMode)}
            className={isEditMode ? "bg-muted" : ""}
            title={isEditMode ? "Termina modifica" : "Modifica tasti rapidi"}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <TabsList className="w-full">
            <TabsTrigger value="1" className="flex-1">REPARTO 1</TabsTrigger>
            <TabsTrigger value="2" className="flex-1">REPARTO 2</TabsTrigger>
            <TabsTrigger value="3" className="flex-1">REPARTO 3</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-4 gap-2">
          {gridPositions.map(position => {
            const button = filteredButtons?.find(b => b.position === position);

            return (
              <Button
                key={position}
                variant="outline"
                className="h-24 relative"
                onClick={() => {
                  if (isEditMode) {
                    if (button) {
                      removeQuickButton(button.id);
                    } else {
                      setSelectedPosition(position);
                      setIsDialogOpen(true);
                    }
                  } else if (button?.product) {
                    onProductSelect(button.product);
                  }
                }}
              >
                {button?.product ? (
                  <>
                    {isEditMode && (
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
                  disabled={isAddingButton}
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