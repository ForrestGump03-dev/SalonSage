import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ClientSubscription, type Subscription } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, Package } from "lucide-react";

interface ScaleSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientSubscription: ClientSubscription;
}

export function ScaleSubscriptionModal({ open, onOpenChange, clientSubscription }: ScaleSubscriptionModalProps) {
  const [additionalUses, setAdditionalUses] = useState<number>(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/subscriptions", clientSubscription.subscriptionId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/subscriptions/${clientSubscription.subscriptionId}`);
      return response.json();
    }
  });

  const scaleSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const currentScaled = clientSubscription.scaledUsageLimit || 0;
      const newScaledLimit = currentScaled + additionalUses;
      
      const response = await apiRequest("PUT", `/api/client-subscriptions/${clientSubscription.id}`, {
        scaledUsageLimit: newScaledLimit,
        remainingUses: clientSubscription.remainingUses + additionalUses
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({
        title: "Successo",
        description: `Abbonamento potenziato con ${additionalUses} utilizzi aggiuntivi`,
      });
      setAdditionalUses(1);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile potenziare l'abbonamento",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (additionalUses < 1) {
      toast({
        title: "Attenzione",
        description: "Inserisci un numero valido di utilizzi aggiuntivi",
        variant: "destructive",
      });
      return;
    }
    scaleSubscriptionMutation.mutate();
  };

  const currentTotal = (subscription?.usageLimit || 0) + (clientSubscription.scaledUsageLimit || 0);
  const newTotal = currentTotal + additionalUses;
  
  // Calculate estimated additional cost (base price per use * additional uses)
  const pricePerUse = subscription ? parseFloat(subscription.price) / subscription.usageLimit : 0;
  const estimatedCost = pricePerUse * additionalUses;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-poppins font-semibold text-xl flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Potenzia Abbonamento
          </DialogTitle>
          <DialogDescription>
            Aggiungi utilizzi extra all'abbonamento esistente del cliente
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Subscription Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-primary" />
              <h3 className="font-medium">{subscription?.name}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Utilizzi originali:</p>
                <p className="font-medium">{subscription?.usageLimit || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Utilizzi attuali:</p>
                <p className="font-medium">{currentTotal}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Rimanenti:</p>
                <p className="font-medium text-primary">{clientSubscription.remainingUses}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Stato:</p>
                <p className="font-medium text-success">
                  {clientSubscription.isActive ? "Attivo" : "Inattivo"}
                </p>
              </div>
            </div>
          </div>

          {/* Add Uses Input */}
          <div className="space-y-2">
            <Label htmlFor="additionalUses">Utilizzi aggiuntivi</Label>
            <Input
              id="additionalUses"
              type="number"
              min="1"
              max="50"
              value={additionalUses}
              onChange={(e) => setAdditionalUses(parseInt(e.target.value) || 1)}
              placeholder="Numero di utilizzi da aggiungere"
            />
            <p className="text-xs text-muted-foreground">
              Puoi aggiungere da 1 a 50 utilizzi aggiuntivi
            </p>
          </div>

          {/* Preview Changes */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Anteprima modifiche:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Utilizzi totali dopo potenziamento:</span>
                <span className="font-medium text-primary">{newTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Nuovi utilizzi rimanenti:</span>
                <span className="font-medium text-success">
                  {clientSubscription.remainingUses + additionalUses}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Costo stimato aggiuntivo:</span>
                <span className="font-medium">€{estimatedCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={scaleSubscriptionMutation.isPending || additionalUses < 1}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {scaleSubscriptionMutation.isPending 
              ? "Potenziando..." 
              : `Potenzia (+${additionalUses} utilizzi)`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}