import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProductGrid from "./components/ProductGrid";
import QuickButtons from "./components/QuickButtons";
import Cart from "./components/Cart";
import Payment from "./components/Payment";
import CustomerSelect from "./components/CustomerSelect";
import { Product } from "@shared/schema";
import { User, Store, Pause, RotateCcw } from "lucide-react";

export default function POS() {
  const [cart, setCart] = useState<Array<{product: Product, quantity: number}>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity }]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b p-2">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CustomerSelect
              selectedCustomerId={selectedCustomerId}
              onSelect={setSelectedCustomerId}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Pause className="h-4 w-4 mr-2" />
              Sospendi
            </Button>
            <Button variant="outline" size="sm">
              <Store className="h-4 w-4 mr-2" />
              Vendite Sospese
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reso
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Cart */}
          <div className="col-span-3">
            <Card className="p-4">
              <Cart items={cart} setItems={setCart} />
            </Card>
          </div>

          {/* Center Column - Products */}
          <div className="col-span-6">
            <Card className="p-4">
              <ProductGrid onProductSelect={(product) => addToCart(product)} />
            </Card>
          </div>

          {/* Right Column - Quick Buttons and Payment */}
          <div className="col-span-3 space-y-4">
            <Card className="p-4">
              <QuickButtons onProductSelect={(product) => addToCart(product)} />
            </Card>
            <Card className="p-4">
              <Payment 
                cart={cart} 
                customerId={selectedCustomerId}
                onComplete={() => {
                  setCart([]);
                  setSelectedCustomerId(null);
                }} 
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}