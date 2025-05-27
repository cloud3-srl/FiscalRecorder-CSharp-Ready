import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Product, FavoriteGroup, FavoriteSlot } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { Plus, Star, X, Settings, Loader2, Edit3, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface QuickButtonsProps {
  onProductSelect: (product: Product) => void;
}

interface FavoriteSlotWithProduct extends FavoriteSlot {
  product?: Product;
}

export default function QuickButtons({ onProductSelect }: QuickButtonsProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);

  // Queries
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: favoriteGroups, isLoading: isLoadingGroups } = useQuery<FavoriteGroup[]>({
    queryKey: ['/api/favorite-groups'],
  });

  const activeGroup = favoriteGroups?.[0];
  const [selectedTab, setSelectedTab] = useState<string>(activeGroup?.id.toString() || "1");

  const { data: favoriteSlots, isLoading: isLoadingSlots } = useQuery<FavoriteSlotWithProduct[]>({
    queryKey: ['/api/favorite-slots', selectedTab],
    queryFn: async () => {
      if (!selectedTab) return [];
      const response = await fetch(`/api/favorite-slots/${selectedTab}`);
      if (!response.ok) throw new Error('Failed to fetch slots');
      return response.json();
    },
    enabled: !!selectedTab,
  });

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutations
  const { mutate: createGroup } = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await fetch('/api/favorite-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          type: 'custom',
          displayOrder: (favoriteGroups?.length || 0) + 1
        })
      });
      if (!response.ok) throw new Error('Failed to create group');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-groups'] });
      toast({
        title: "Gruppo creato",
        description: "Il nuovo gruppo preferiti è stato creato"
      });
      setShowNewGroupDialog(false);
      setNewGroupName("");
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile creare il gruppo",
        variant: "destructive"
      });
    }
  });

  const { mutate: addSlot, isPending: isAddingSlot } = useMutation({
    mutationFn: async (data: { groupId: number, productId: number, position: number }) => {
      const response = await fetch('/api/favorite-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: data.groupId,
          productId: data.productId,
          positionInGrid: data.position
        })
      });
      if (!response.ok) throw new Error('Failed to add slot');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-slots', selectedTab] });
      toast({
        title: "Prodotto aggiunto",
        description: "Il prodotto è stato aggiunto ai preferiti"
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il prodotto",
        variant: "destructive"
      });
    }
  });

  const { mutate: removeSlot } = useMutation({
    mutationFn: async (slotId: number) => {
      const response = await fetch(`/api/favorite-slots/${slotId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove slot');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-slots', selectedTab] });
      toast({
        title: "Prodotto rimosso",
        description: "Il prodotto è stato rimosso dai preferiti"
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile rimuovere il prodotto",
        variant: "destructive"
      });
    }
  });

  const { mutate: deleteGroup } = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await fetch(`/api/favorite-groups/${groupId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete group');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-groups'] });
      toast({
        title: "Gruppo eliminato",
        description: "Il gruppo preferiti è stato eliminato"
      });
      // Seleziona il primo gruppo disponibile
      if (favoriteGroups && favoriteGroups.length > 1) {
        const remainingGroups = favoriteGroups.filter(g => g.id.toString() !== selectedTab);
        setSelectedTab(remainingGroups[0]?.id.toString() || "");
      }
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il gruppo",
        variant: "destructive"
      });
    }
  });

  // Crea una griglia 4x6 di posizioni (24 slot)
  const gridPositions = Array.from({ length: 24 }, (_, i) => i + 1);

  if (isLoadingGroups || isLoadingSlots) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getSlotForPosition = (position: number) => {
    return favoriteSlots?.find(slot => slot.positionInGrid === position);
  };

  return (
    <div className="space-y-4">
      {/* Header con titolo e controlli */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Star className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Preferiti</h2>
          <Badge variant={isEditMode ? "secondary" : "outline"} className="text-xs">
            {isEditMode ? "✏️ Modalità Modifica" : "🎯 Modalità Normale"}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditMode(!isEditMode)}
          className={cn(
            "gap-2",
            isEditMode ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : ""
          )}
        >
          <Settings className="h-4 w-4" />
          {isEditMode ? "Fine" : "Modifica"}
        </Button>
      </div>

      {/* Barra Tab Gruppi */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1">
          <TabsList className="w-full justify-start">
            {favoriteGroups?.map((group) => (
              <TabsTrigger
                key={group.id}
                value={group.id.toString()}
                className={cn(
                  "relative flex items-center gap-2",
                  selectedTab === group.id.toString() ? "bg-blue-100" : ""
                )}
              >
                {group.name}
                {isEditMode && group.type === 'custom' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGroup(group.id);
                    }}
                    className="ml-1 p-1 hover:bg-red-100 rounded"
                    title="Elimina gruppo"
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </button>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        {/* Pulsante Aggiungi Nuovo Gruppo */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewGroupDialog(true)}
          className="whitespace-nowrap gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuovo
        </Button>
      </div>

      {/* Griglia Prodotti */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50 rounded-lg">
        {gridPositions.map(position => {
          const slot = getSlotForPosition(position);

          return (
            <Button
              key={position}
              variant="outline"
              title={slot?.product ? `${slot.product.name} - €${slot.product.price} (${slot.product.code})` : isEditMode ? "Clicca per aggiungere un prodotto" : "Slot vuoto"}
              className={cn(
                "h-16 relative flex flex-col items-start justify-between p-2 text-left bg-white",
                slot?.product ? "hover:bg-blue-50" : "hover:bg-gray-100 border-dashed"
              )}
              onClick={() => {
                if (isEditMode) {
                  if (slot) {
                    removeSlot(slot.id);
                  } else {
                    setSelectedPosition(position);
                    setSelectedGroupId(parseInt(selectedTab));
                    setIsDialogOpen(true);
                  }
                } else if (slot?.product) {
                  onProductSelect(slot.product);
                }
              }}
            >
              {slot?.product ? (
                <>
                  {isEditMode && (
                    <div className="absolute top-1 right-1 flex gap-1">
                      <button
                        className="p-1 hover:bg-red-100 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSlot(slot.id);
                        }}
                        title="Rimuovi prodotto"
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </button>
                    </div>
                  )}

                  <div className="w-full">
                    <div className="text-[10px] font-medium text-muted-foreground">
                      {slot.product.code}
                    </div>
                    <div className="text-[8px] leading-tight line-clamp-2 font-medium">
                      {slot.product.name}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-blue-600">
                    €{slot.product.price.toString()}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Plus className="w-4 h-4 mb-1" />
                  <span className="text-[8px] text-center leading-tight">
                    {isEditMode ? "AGGIUNGI PRODOTTO" : "Slot Vuoto"}
                  </span>
                </div>
              )}
            </Button>
          );
        })}
      </div>

      {/* Suggerimento */}
      {!isEditMode && (
        <div className="text-xs text-muted-foreground text-center p-2 bg-blue-50 rounded">
          💡 Suggerimento: Clicca su "Modifica" per personalizzare i gruppi e aggiungere prodotti
        </div>
      )}

      {/* Dialog Selezione Prodotto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Seleziona un prodotto per la posizione {selectedPosition}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Cerca prodotti per nome o codice..."
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
                    if (selectedPosition && selectedGroupId) {
                      addSlot({
                        groupId: selectedGroupId,
                        productId: product.id,
                        position: selectedPosition
                      });
                    }
                  }}
                  disabled={isAddingSlot}
                >
                  <div className="text-sm font-medium truncate w-full">
                    {product.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {product.code}
                  </div>
                  <div className="text-xs font-semibold text-blue-600">
                    €{product.price.toString()}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nuovo Gruppo */}
      <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea nuovo gruppo preferiti</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome del gruppo (es. 'Bevande Calde', 'Snack', 'Promozioni')"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowNewGroupDialog(false)}
              >
                Annulla
              </Button>
              <Button
                onClick={() => createGroup({ name: newGroupName })}
                disabled={!newGroupName.trim()}
              >
                Crea Gruppo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
