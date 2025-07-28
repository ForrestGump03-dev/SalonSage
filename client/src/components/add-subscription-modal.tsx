import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSubscriptionSchema, type InsertClientSubscription, type Client, type Subscription } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface AddSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedClientId?: string;
}

export function AddSubscriptionModal({ open, onOpenChange, preselectedClientId }: AddSubscriptionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const form = useForm<InsertClientSubscription>({
    resolver: zodResolver(insertClientSubscriptionSchema),
    defaultValues: {
      clientId: preselectedClientId || "",
      subscriptionId: "",
      remainingUses: 0,
      expiryDate: null,
      isActive: true,
    },
  });

  const selectedSubscriptionId = form.watch("subscriptionId");
  const selectedSubscription = subscriptions.find(s => s.id === selectedSubscriptionId);

  // Update remaining uses when subscription changes
  React.useEffect(() => {
    if (selectedSubscription) {
      form.setValue("remainingUses", selectedSubscription.usageLimit);
    }
  }, [selectedSubscription, form]);

  const createClientSubscriptionMutation = useMutation({
    mutationFn: async (data: InsertClientSubscription) => {
      const response = await apiRequest("POST", "/api/client-subscriptions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({
        title: "Successo",
        description: "Abbonamento aggiunto con successo",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiungere l'abbonamento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertClientSubscription) => {
    createClientSubscriptionMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-poppins font-semibold text-xl">Aggiungi Abbonamento</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.firstName} {client.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subscriptionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Package</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subscription" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subscriptions.map((subscription) => (
                        <SelectItem key={subscription.id} value={subscription.id}>
                          {subscription.name} - ${subscription.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedSubscription && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">{selectedSubscription.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">{selectedSubscription.description}</p>
                <p className="text-sm">
                  <strong>Usage Limit:</strong> {selectedSubscription.usageLimit} services
                </p>
                <p className="text-sm">
                  <strong>Services Included:</strong> {selectedSubscription.servicesIncluded.join(", ")}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createClientSubscriptionMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createClientSubscriptionMutation.isPending ? "Adding..." : "Add Subscription"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
