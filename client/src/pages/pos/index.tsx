import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductGrid from "./components/ProductGrid";
import QuickButtons from "./components/QuickButtons";
import Cart from "./components/Cart";
import Payment from "./components/Payment";
import CustomerSelect from "./components/CustomerSelect";
import { Product } from "@shared/schema";
import { Calendar, Store, Pause } from "lucide-react";

export default function POS() {
  const [cart, setCart] = useState<Array<{product: Product, quantity: number}>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [registrationMode, setRegistrationMode] = useState<string>("SCONTRINO DI VENDITA");
  const [table, setTable] = useState<string>("");

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
            <Select value={registrationMode} onValueChange={setRegistrationMode}>
              <SelectTrigger className="w-[200px]">
                <SelectValue>{registrationMode}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCONTRINO DI VENDITA">SCONTRINO DI VENDITA</SelectItem>
                <SelectItem value="PREVENTIVO">PREVENTIVO</SelectItem>
                <SelectItem value="FATTURA">FATTURA</SelectItem>
                <SelectItem value="RESO">RESO</SelectItem>
              </SelectContent>
            </Select>

            <Select value={table} onValueChange={setTable}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tavolo">Tavolo</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Tavolo 1</SelectItem>
                <SelectItem value="2">Tavolo 2</SelectItem>
                <SelectItem value="DELIVERY">DELIVERY</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              VENDITE DEL GIORNO
            </Button>
            <Button variant="outline" size="sm">
              <Pause className="h-4 w-4 mr-2" />
              SOSPESO
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Products */}
          <div className="col-span-5">
            <Card className="p-4">
              <div className="mb-4">
                <CustomerSelect
                  selectedCustomerId={selectedCustomerId}
                  onSelect={setSelectedCustomerId}
                />
              </div>
              <ProductGrid onProductSelect={(product) => addToCart(product)} />
            </Card>
          </div>

          {/* Center Column - Cart */}
          <div className="col-span-4">
            <Card className="p-4">
              <Cart items={cart} setItems={setCart} />
            </Card>
          </div>

          {/* Right Column - Payment and Quick Buttons */}
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