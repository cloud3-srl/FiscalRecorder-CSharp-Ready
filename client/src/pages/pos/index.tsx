import { useState } from "react";
import { Card } from "@/components/ui/card";
import ProductGrid from "./components/ProductGrid";
import NumericKeypad from "./components/NumericKeypad";
import Cart from "./components/Cart";
import Payment from "./components/Payment";
import { Product } from "@shared/schema";

export default function POS() {
  const [cart, setCart] = useState<Array<{product: Product, quantity: number}>>([]);
  const [selectedQuantity, setSelectedQuantity] = useState<string>("1");

  const addToCart = (product: Product) => {
    const quantity = parseFloat(selectedQuantity) || 1;
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
    setSelectedQuantity("1");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left side - Products and Keypad */}
          <div className="col-span-8 space-y-4">
            <Card className="p-4">
              <ProductGrid onProductSelect={addToCart} />
            </Card>
            <Card className="p-4">
              <NumericKeypad 
                value={selectedQuantity}
                onChange={setSelectedQuantity}
              />
            </Card>
          </div>
          
          {/* Right side - Cart and Payment */}
          <div className="col-span-4 space-y-4">
            <Card className="p-4">
              <Cart items={cart} setItems={setCart} />
            </Card>
            <Card className="p-4">
              <Payment cart={cart} onComplete={() => setCart([])} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
