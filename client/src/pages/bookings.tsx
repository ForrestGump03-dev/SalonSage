import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Booking, type Client, type Service } from "@shared/schema";
import { Search, Calendar, Clock, DollarSign, CalendarPlus, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { AddBookingModal } from "@/components/add-booking-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function Bookings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/bookings/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({
        title: "Successo",
        description: "Stato prenotazione aggiornato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare la prenotazione",
        variant: "destructive",
      });
    },
  });

  // Create lookup maps
  const clientsMap = new Map(clients.map(client => [client.id, client]));
  const servicesMap = new Map(services.map(service => [service.id, service]));

  // Enhanced bookings with client and service data
  const enhancedBookings = bookings.map(booking => ({
    ...booking,
    client: clientsMap.get(booking.clientId),
    service: servicesMap.get(booking.serviceId),
  }));

  const filteredBookings = enhancedBookings.filter(booking => {
    const matchesSearch = 
      booking.client?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = (bookingId: string, status: string) => {
    updateBookingMutation.mutate({ id: bookingId, status });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge className="bg-accent/10 text-accent">Scheduled</Badge>;
    }
  };

  const todayBookings = filteredBookings.filter(booking => {
    const bookingDate = new Date(booking.appointmentDate);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  });

  const upcomingBookings = filteredBookings.filter(booking => {
    const bookingDate = new Date(booking.appointmentDate);
    const today = new Date();
    return bookingDate > today;
  });

  if (bookingsLoading) {
    return (
      <Layout title="Bookings" subtitle="Manage appointments and service bookings">
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
    <Layout title="Bookings" subtitle="Manage appointments and service bookings">
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search by client name or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <Button
            onClick={() => setShowAddBookingModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Today's Bookings</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{todayBookings.length}</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="text-primary w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Upcoming</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{upcomingBookings.length}</p>
                </div>
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Clock className="text-accent w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {bookings.filter(b => b.status === 'completed').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-success w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ${bookings
                      .filter(b => b.status === 'completed')
                      .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-success w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-poppins font-semibold text-lg">
              All Bookings ({filteredBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm || statusFilter !== "all" ? "No bookings found" : "No bookings yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria" 
                    : "Create your first booking to get started"
                  }
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button
                    onClick={() => setShowAddBookingModal(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Create First Booking
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {booking.client?.firstName} {booking.client?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.client?.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{booking.service?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.service?.duration} minutes
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {format(new Date(booking.appointmentDate), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(booking.appointmentDate), 'h:mm a')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">${booking.totalPrice}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(booking.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {booking.status === 'scheduled' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(booking.id, 'completed')}
                                className="text-success hover:text-success"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                className="text-destructive hover:text-destructive"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
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
      <AddBookingModal open={showAddBookingModal} onOpenChange={setShowAddBookingModal} />
    </Layout>
  );
}
