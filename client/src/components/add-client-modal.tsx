import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema, type InsertClient, type Client } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient?: Client | null;
  onUpdate?: (id: string, data: InsertClient) => void;
}

export function AddClientModal({ open, onOpenChange, editingClient, onUpdate }: AddClientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  // Pre-popola il form quando si modifica un cliente
  React.useEffect(() => {
    if (editingClient) {
      form.reset({
        firstName: editingClient.firstName,
        lastName: editingClient.lastName,
        phone: editingClient.phone || "",
        email: editingClient.email || "",
        notes: editingClient.notes || "",
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        notes: "",
      });
    }
  }, [editingClient, form]);

  const createClientMutation = useMutation({
    mutationFn: async (data: InsertClient) => {
      const response = await apiRequest("POST", "/api/clients", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Successo",
        description: "Cliente aggiunto con successo",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiungere il cliente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertClient) => {
    if (editingClient && onUpdate) {
      onUpdate(editingClient.id, data);
    } else {
      createClientMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-poppins font-semibold text-xl">
            {editingClient ? "Modifica Cliente" : "Aggiungi Nuovo Cliente"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Inserisci nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cognome</FormLabel>
                    <FormControl>
                      <Input placeholder="Inserisci cognome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numero di Telefono</FormLabel>
                  <FormControl>
                    <Input placeholder="+39 123 456 7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="cliente@esempio.com" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informazioni aggiuntive sul cliente..." 
                      rows={3} 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createClientMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createClientMutation.isPending 
                  ? (editingClient ? "Aggiornamento in corso..." : "Aggiunta in corso...")
                  : (editingClient ? "Aggiorna Cliente" : "Aggiungi Cliente")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
