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
import { cn } from "@/lib/utils";

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
  const [selectedTab, setSelectedTab] = useState("1"); // "1" per Reparto 1, "2" per Reparto 2

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

  const { mutate: addQuickButton, isPending: isAddingButton } = useMutation({
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

  // Crea una griglia 4x6 di posizioni (24 pulsanti)
  const gridPositions = Array.from({ length: 24 }, (_, i) => i + 1);

  if (isLoadingButtons) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
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

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="w-full">
          <TabsTrigger
            value="1"
            className={cn(
              "flex-1",
              selectedTab === "1" ? "bg-blue-100 hover:bg-blue-200" : ""
            )}
          >
            REPARTO 1
          </TabsTrigger>
          <TabsTrigger
            value="2"
            className={cn(
              "flex-1",
              selectedTab === "2" ? "bg-red-100 hover:bg-red-200" : ""
            )}
          >
            REPARTO 2
          </TabsTrigger>
          <TabsTrigger value="3" className="flex-1">REPARTO 3</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className={cn(
        "grid grid-cols-4 gap-2",
        selectedTab === "1" ? "bg-blue-50" : selectedTab === "2" ? "bg-red-50" : "",
        "p-4 rounded-lg"
      )}>
        {gridPositions.map(position => {
          const adjustedPosition = selectedTab === "2" ? position + 24 : selectedTab === "3" ? position + 48 : position;
          const button = quickButtons?.find(b => b.position === adjustedPosition);

          return (
            <Button
              key={position}
              variant="outline"
              className={cn(
                "h-16 relative flex flex-col items-start justify-between p-2 text-left",
                selectedTab === "1" ? "hover:bg-blue-100" : selectedTab === "2" ? "hover:bg-red-100" : ""
              )}
              onClick={() => {
                if (isEditMode) {
                  if (button) {
                    removeQuickButton(button.id);
                  } else {
                    setSelectedPosition(adjustedPosition);
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
                      <X className="h-3 w-3 text-red-500" />
                    </button>
                  )}

                  <div className="w-full">
                    <div className="text-[10px] font-medium text-muted-foreground">
                      {button.product.code}
                    </div>
                    <div className="text-[8px] leading-tight line-clamp-2">
                      {button.product.name}
                    </div>
                  </div>
                  <div className="text-xs font-semibold">
                    €{button.product.price.toString()}
                  </div>
                </>
              ) : (
                <Plus className="w-4 h-4 text-gray-400" />
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
    </div>
  );
}
