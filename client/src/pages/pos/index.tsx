import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductGrid from "./components/ProductGrid";
import QuickButtons from "./components/QuickButtons";
import NumericKeypad from "./components/NumericKeypad";
import Cart from "./components/Cart";
import Payment from "./components/Payment";
import { Product } from "@shared/schema";

export default function POS() {
  const [cart, setCart] = useState<Array<{product: Product, quantity: number}>>([]);
  const [selectedQuantity, setSelectedQuantity] = useState<string>("1");
  const [selectedTab, setSelectedTab] = useState("1");

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
        {/* Tabs di reparto */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="1">REPARTO 1</TabsTrigger>
            <TabsTrigger value="2">REPARTO 2</TabsTrigger>
            <TabsTrigger value="3">REPARTO 3</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-12 gap-4">
          {/* Left side - Products and Keypad */}
          <div className="col-span-8">
            {/* Top area for product grid */}
            <Card className="p-4 mb-4">
              <ProductGrid onProductSelect={addToCart} />
            </Card>

            {/* Bottom area with quick buttons and keypad */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4">Preferiti</h2>
                <QuickButtons onProductSelect={addToCart} />
              </Card>
              <Card className="p-4">
                <NumericKeypad 
                  value={selectedQuantity}
                  onChange={setSelectedQuantity}
                />
              </Card>
            </div>
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