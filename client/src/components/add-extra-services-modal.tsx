import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Service, type Booking } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, X } from "lucide-react";

interface AddExtraServicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
}

export function AddExtraServicesModal({ open, onOpenChange, booking }: AddExtraServicesModalProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Filter out the main service that's already booked
  const availableServices = services.filter(service => 
    service.id !== booking.serviceId && 
    service.isActive &&
    !(booking.additionalServices || []).includes(service.id)
  );

  const updateBookingMutation = useMutation({
    mutationFn: async (additionalServices: string[]) => {
      const currentAdditional = booking.additionalServices || [];
      const allAdditional = [...currentAdditional, ...additionalServices];
      
      // Calculate new total price
      const additionalServicesData = services.filter(s => additionalServices.includes(s.id));
      const additionalPrice = additionalServicesData.reduce((sum, service) => sum + Number(service.price), 0);
      const newTotalPrice = Number(booking.totalPrice) + additionalPrice;

      const response = await apiRequest("PUT", `/api/bookings/${booking.id}`, {
        additionalServices: allAdditional,
        totalPrice: newTotalPrice
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({
        title: "Successo",
        description: "Servizi extra aggiunti con successo",
      });
      setSelectedServices([]);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiungere i servizi extra",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (selectedServices.length === 0) {
      toast({
        title: "Attenzione",
        description: "Seleziona almeno un servizio extra",
        variant: "destructive",
      });
      return;
    }
    updateBookingMutation.mutate(selectedServices);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectedTotal = selectedServices.reduce((sum, serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return sum + (service ? Number(service.price) : 0);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-poppins font-semibold text-xl">
            Aggiungi Servizi Extra
          </DialogTitle>
          <DialogDescription>
            Seleziona i servizi aggiuntivi forniti durante questa visita
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {availableServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">Nessun servizio aggiuntivo disponibile</p>
              <p className="text-sm text-muted-foreground">
                Tutti i servizi sono già stati aggiunti a questa prenotazione
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availableServices.map((service) => (
                  <div key={service.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={service.id}
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <div className="flex-1">
                      <label htmlFor={service.id} className="cursor-pointer">
                        <p className="font-medium text-foreground">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </label>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">€{service.price}</p>
                      <p className="text-xs text-muted-foreground">{service.duration} min</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedServices.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Totale servizi extra:</span>
                    <span className="font-bold text-primary">€{selectedTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Nuovo totale prenotazione:</span>
                    <span>€{(Number(booking.totalPrice) + selectedTotal).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annulla
          </Button>
          {availableServices.length > 0 && (
            <Button
              onClick={handleSubmit}
              disabled={updateBookingMutation.isPending || selectedServices.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {updateBookingMutation.isPending ? "Aggiungendo..." : `Aggiungi ${selectedServices.length} Servizi`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}