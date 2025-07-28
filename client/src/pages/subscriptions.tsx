import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  type Subscription, 
  type ClientSubscription, 
  type Client,
  insertSubscriptionSchema, 
  type InsertSubscription 
} from "@shared/schema";
import { 
  Search, 
  Star, 
  Users, 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  Package
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AddSubscriptionModal } from "@/components/add-subscription-modal";
import { ScaleSubscriptionModal } from "@/components/scale-subscription-modal";

export default function Subscriptions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [showAddSubscriptionModal, setShowAddSubscriptionModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Subscription | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const { data: clientSubscriptions = [], isLoading: clientSubscriptionsLoading } = useQuery<ClientSubscription[]>({
    queryKey: ["/api/client-subscriptions"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm<InsertSubscription>({
    resolver: zodResolver(insertSubscriptionSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0.00",
      servicesIncluded: [],
      usageLimit: 1,
      isActive: true,
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: InsertSubscription) => {
      const response = await apiRequest("POST", "/api/subscriptions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Successo",
        description: "Pacchetto abbonamento creato con successo",
      });
      form.reset();
      setShowAddPackageModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare il pacchetto abbonamento",
        variant: "destructive",
      });
    },
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      await apiRequest("DELETE", `/api/subscriptions/${subscriptionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Successo",
        description: "Pacchetto abbonamento eliminato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare il pacchetto abbonamento",
        variant: "destructive",
      });
    },
  });

  // Create lookup maps
  const clientsMap = new Map(clients.map(client => [client.id, client]));
  const subscriptionsMap = new Map(subscriptions.map(sub => [sub.id, sub]));

  // Enhanced client subscriptions with client and subscription data
  const enhancedClientSubscriptions = clientSubscriptions.map(cs => ({
    ...cs,
    client: clientsMap.get(cs.clientId),
    subscription: subscriptionsMap.get(cs.subscriptionId),
  }));

  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subscription.description && subscription.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredClientSubscriptions = enhancedClientSubscriptions.filter(cs =>
    cs.client?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cs.client?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cs.subscription?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPackage = () => {
    form.reset();
    setEditingPackage(null);
    setShowAddPackageModal(true);
  };

  const handleDeletePackage = (packageId: string) => {
    if (confirm("Sei sicuro di voler eliminare questo pacchetto abbonamento?")) {
      deleteSubscriptionMutation.mutate(packageId);
    }
  };

  const onSubmit = (data: InsertSubscription) => {
    createSubscriptionMutation.mutate(data);
  };

  const activeSubscriptions = clientSubscriptions.filter(cs => cs.isActive);
  const totalRevenue = clientSubscriptions.reduce((sum, cs) => {
    const subscription = subscriptionsMap.get(cs.subscriptionId);
    return sum + (subscription ? parseFloat(subscription.price) : 0);
  }, 0);

  if (subscriptionsLoading || clientSubscriptionsLoading) {
    return (
      <Layout title="Abbonamenti" subtitle="Gestisci pacchetti abbonamento e iscrizioni">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Abbonamenti" subtitle="Gestisci pacchetti abbonamento e iscrizioni">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Abbonamenti Attivi</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{activeSubscriptions.length}</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Star className="text-primary w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Opzioni Pacchetti</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{subscriptions.length}</p>
                </div>
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Package className="text-accent w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Ricavi Totali</p>
                  <p className="text-2xl font-bold text-foreground mt-1">€{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-success w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Subscription Rate</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {clients.length > 0 
                      ? Math.round((activeSubscriptions.length / clients.length) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="w-10 h-10 bg-secondary/60 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-primary w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Packages and Client Subscriptions */}
        <Tabs defaultValue="packages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="packages">Subscription Packages</TabsTrigger>
            <TabsTrigger value="client-subscriptions">Client Subscriptions</TabsTrigger>
          </TabsList>

          {/* Subscription Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Input
                  type="text"
                  placeholder="Search packages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              </div>
              <Button
                onClick={handleAddPackage}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Package
              </Button>
            </div>

            {/* Packages Grid */}
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? "No packages found" : "No subscription packages yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "Try adjusting your search terms" 
                    : "Create your first subscription package to get started"
                  }
                </p>
                {!searchTerm && (
                  <Button
                    onClick={handleAddPackage}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Package
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubscriptions.map((subscription) => (
                  <Card key={subscription.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-poppins text-lg">{subscription.name}</CardTitle>
                          <p className="text-2xl font-bold text-primary mt-2">${subscription.price}</p>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePackage(subscription.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">{subscription.description}</p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Usage Limit:</span>
                          <span className="font-medium">{subscription.usageLimit} services</span>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Services Included:</p>
                          <div className="flex flex-wrap gap-1">
                            {subscription.servicesIncluded.map((service, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <Badge className={subscription.isActive ? "bg-success/10 text-success" : "bg-muted"}>
                            {subscription.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {clientSubscriptions.filter(cs => cs.subscriptionId === subscription.id).length} subscribers
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Client Subscriptions Tab */}
          <TabsContent value="client-subscriptions" className="space-y-6">
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Input
                  type="text"
                  placeholder="Search client subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              </div>
              <Button
                onClick={() => setShowAddSubscriptionModal(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign Subscription
              </Button>
            </div>

            {/* Client Subscriptions Table */}
            <Card>
              <CardHeader>
                <CardTitle className="font-poppins font-semibold text-lg">
                  Client Subscriptions ({filteredClientSubscriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredClientSubscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {searchTerm ? "No subscriptions found" : "No client subscriptions yet"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? "Try adjusting your search terms" 
                        : "Assign subscriptions to clients to get started"
                      }
                    </p>
                    {!searchTerm && (
                      <Button
                        onClick={() => setShowAddSubscriptionModal(true)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Assign First Subscription
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Purchase Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClientSubscriptions.map((cs) => (
                        <TableRow key={cs.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {cs.client?.firstName} {cs.client?.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {cs.client?.phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{cs.subscription?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {cs.subscription?.usageLimit} services included
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>{cs.remainingUses} remaining</span>
                                <span>{(cs.subscription?.usageLimit || 0) - cs.remainingUses} used</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                                  style={{ 
                                    width: `${((cs.subscription?.usageLimit || 0) - cs.remainingUses) / (cs.subscription?.usageLimit || 1) * 100}%` 
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(cs.purchaseDate).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={cs.isActive ? "bg-success/10 text-success" : "bg-muted"}>
                              {cs.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-foreground">
                              ${cs.subscription?.price}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Package Modal */}
      <Dialog open={showAddPackageModal} onOpenChange={setShowAddPackageModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-poppins font-semibold text-xl">Add Subscription Package</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Premium Package" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Package description..." 
                        rows={3} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Limit</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="5" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddPackageModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSubscriptionMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {createSubscriptionMutation.isPending ? "Creating..." : "Create Package"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Client Subscription Modal */}
      <AddSubscriptionModal 
        open={showAddSubscriptionModal} 
        onOpenChange={setShowAddSubscriptionModal} 
      />
    </Layout>
  );
}
