import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Client } from "@shared/schema";
import { Search, Phone, Mail, Calendar, Trash2, Edit, UserPlus } from "lucide-react";
import { useState } from "react";
import { AddClientModal } from "@/components/add-client-modal";
import { AddBookingModal } from "@/components/add-booking-modal";
import { AddSubscriptionModal } from "@/components/add-subscription-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      await apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Successo",
        description: "Cliente cancellato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile cancellare il cliente",
        variant: "destructive",
      });
    },
  });

  const filteredClients = clients.filter(client => 
    client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleBookService = (clientId: string) => {
    setSelectedClientId(clientId);
    setShowBookingModal(true);
  };

  const handleAddSubscription = (clientId: string) => {
    setSelectedClientId(clientId);
    setShowSubscriptionModal(true);
  };

  const handleDeleteClient = (clientId: string) => {
    if (confirm("Are you sure you want to delete this client?")) {
      deleteClientMutation.mutate(clientId);
    }
  };

  if (isLoading) {
    return (
      <Layout title="Clients" subtitle="Manage your salon clients and their information">
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
    <Layout title="Clients" subtitle="Manage your salon clients and their information">
      <div className="space-y-6">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search clients by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          </div>
          <Button
            onClick={() => setShowAddClientModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add New Client
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Clients</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{clients.length}</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <UserPlus className="text-primary w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">New This Month</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {clients.filter(client => {
                      const clientDate = new Date(client.createdAt);
                      const thisMonth = new Date();
                      return clientDate.getMonth() === thisMonth.getMonth() && 
                             clientDate.getFullYear() === thisMonth.getFullYear();
                    }).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <Calendar className="text-success w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Active Clients</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{clients.length}</p>
                </div>
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <UserPlus className="text-accent w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-poppins font-semibold text-lg">
              Client Directory ({filteredClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? "No clients found" : "No clients yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "Try adjusting your search terms" 
                    : "Add your first client to get started"
                  }
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setShowAddClientModal(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add First Client
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Member Since</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {client.firstName} {client.lastName}
                          </p>
                          {client.notes && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {client.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{client.phone}</span>
                          </div>
                          {client.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm text-blue-600">{client.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(client.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBookService(client.id)}
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            Book
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddSubscription(client.id)}
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Subscribe
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClient(client.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddClientModal open={showAddClientModal} onOpenChange={setShowAddClientModal} />
      <AddBookingModal 
        open={showBookingModal} 
        onOpenChange={setShowBookingModal}
        preselectedClientId={selectedClientId}
      />
      <AddSubscriptionModal 
        open={showSubscriptionModal} 
        onOpenChange={setShowSubscriptionModal}
        preselectedClientId={selectedClientId}
      />
    </Layout>
  );
}
