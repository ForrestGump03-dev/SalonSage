import { useState, useEffect } from "react";
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
  const [usesToModify, setUsesToModify] = useState<number>(1);
  const [operationType, setOperationType] = useState<'add' | 'remove'>('remove');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset states when modal opens/closes
  useEffect(() => {
    if (open) {
      setUsesToModify(1);
      setOperationType('remove');
    }
  }, [open]);

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
      const usesChange = operationType === 'add' ? usesToModify : -usesToModify;
      const newScaledLimit = currentScaled + usesChange;
      const newRemainingUses = clientSubscription.remainingUses + usesChange;
      
      // Validazione per evitare numeri negativi
      if (newRemainingUses < 0) {
        throw new Error("Non puoi rimuovere più utilizzi di quelli rimanenti");
      }
      
      const payload = {
        scaledUsageLimit: newScaledLimit,
        remainingUses: newRemainingUses
      };
      
      const response = await apiRequest("PUT", `/api/client-subscriptions/${clientSubscription.id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      const action = operationType === 'add' ? 'potenziato' : 'ridotto';
      toast({
        title: "Successo",
        description: `Abbonamento ${action} con ${usesToModify} utilizzi`,
      });
      setUsesToModify(1);
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
    if (usesToModify < 1) {
      toast({
        title: "Attenzione",
        description: "Inserisci un numero valido di utilizzi da modificare",
        variant: "destructive",
      });
      return;
    }
    
    if (operationType === 'remove' && usesToModify > clientSubscription.remainingUses) {
      toast({
        title: "Attenzione", 
        description: "Non puoi rimuovere più utilizzi di quelli rimanenti",
        variant: "destructive",
      });
      return;
    }
    
    scaleSubscriptionMutation.mutate();
  };

  const currentTotal = (subscription?.usageLimit || 0) + (clientSubscription.scaledUsageLimit || 0);
  const usesChange = operationType === 'add' ? usesToModify : -usesToModify;
  const newTotal = currentTotal + usesChange;
  const newRemainingUses = clientSubscription.remainingUses + usesChange;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-poppins font-semibold text-xl flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Gestisci Abbonamento
          </DialogTitle>
          <DialogDescription>
            Aggiungi o rimuovi utilizzi dall'abbonamento del cliente
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

          {/* Operation Type Selection */}
          <div className="space-y-3">
            <Label>Tipo di operazione</Label>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="add"
                  name="operation"
                  value="add"
                  checked={operationType === 'add'}
                  onChange={(e) => setOperationType('add')}
                  className="w-4 h-4"
                />
                <Label htmlFor="add" className="text-sm">Aggiungi utilizzi</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="remove"
                  name="operation"
                  value="remove"
                  checked={operationType === 'remove'}
                  onChange={(e) => setOperationType('remove')}
                  className="w-4 h-4"
                />
                <Label htmlFor="remove" className="text-sm">Rimuovi utilizzi</Label>
              </div>
            </div>
          </div>

          {/* Uses Input */}
          <div className="space-y-2">
            <Label htmlFor="usesToModify">
              {operationType === 'add' ? 'Utilizzi da aggiungere' : 'Utilizzi da rimuovere'}
            </Label>
            <Input
              id="usesToModify"
              type="number"
              min="1"
              max={operationType === 'remove' ? clientSubscription.remainingUses : 50}
              value={usesToModify}
              onChange={(e) => setUsesToModify(parseInt(e.target.value) || 1)}
              placeholder={operationType === 'add' ? "Numero di utilizzi da aggiungere" : "Numero di utilizzi da rimuovere"}
            />
            <p className="text-xs text-muted-foreground">
              {operationType === 'add' 
                ? 'Puoi aggiungere da 1 a 50 utilizzi'
                : `Puoi rimuovere da 1 a ${clientSubscription.remainingUses} utilizzi`
              }
            </p>
          </div>

          {/* Preview Changes */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Anteprima modifiche:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Utilizzi totali dopo modifica:</span>
                <span className="font-medium text-primary">{newTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Nuovi utilizzi rimanenti:</span>
                <span className={`font-medium ${newRemainingUses >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {newRemainingUses}
                </span>
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
            disabled={scaleSubscriptionMutation.isPending || usesToModify < 1 || newRemainingUses < 0}
            className={operationType === 'add' 
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }
          >
            {scaleSubscriptionMutation.isPending 
              ? (operationType === 'add' ? "Aggiungendo..." : "Rimuovendo...")
              : (operationType === 'add' 
                  ? `Aggiungi ${usesToModify} utilizzi`
                  : `Rimuovi ${usesToModify} utilizzi`
                )
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}