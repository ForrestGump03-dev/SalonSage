import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, Calendar, Star, TrendingUp, Clock, ArrowUp, UserPlus, CalendarPlus, BarChart3 } from "lucide-react";
import { useState } from "react";
import { AddClientModal } from "@/components/add-client-modal";
import { AddBookingModal } from "@/components/add-booking-modal";
import { AddSubscriptionModal } from "@/components/add-subscription-modal";
import { Link } from "wouter";

interface DashboardStats {
  stats: {
    activeClients: number;
    monthlyRevenue: number;
    todayAppointments: number;
    activeSubscriptions: number;
    subscriptionRate: number;
  };
  serviceAnalytics: Array<{
    id: string;
    name: string;
    bookings: number;
    percentage: number;
  }>;
  todayBookings: Array<{
    id: string;
    appointmentDate: string;
    totalPrice: string;
    status: string;
  }>;
}

export default function Dashboard() {
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const { data: dashboardData, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/analytics/dashboard"],
  });

  if (isLoading) {
    return (
      <Layout title="Dashboard" subtitle="Bentornato! Ecco cosa sta succedendo nel tuo salone oggi.">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const stats = dashboardData?.stats || {
    activeClients: 0,
    monthlyRevenue: 0,
    todayAppointments: 0,
    activeSubscriptions: 0,
    subscriptionRate: 0
  };

  return (
    <Layout title="Dashboard" subtitle="Bentornato! Ecco cosa sta succedendo nel tuo salone oggi.">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Clienti Attivi</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats.activeClients}</p>
                  <p className="text-success text-sm mt-2 flex items-center">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    +12% questo mese
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="text-primary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Ricavi Mensili</p>
                  <p className="text-3xl font-bold text-foreground mt-2">€{stats.monthlyRevenue.toFixed(2)}</p>
                  <p className="text-success text-sm mt-2 flex items-center">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    +8% dal mese scorso
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-success text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Appuntamenti di Oggi</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats.todayAppointments}</p>
                  <p className="text-accent text-sm mt-2 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Prossimo: 14:30
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Calendar className="text-accent text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Abbonamenti Attivi</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats.activeSubscriptions}</p>
                  <p className="text-success text-sm mt-2 flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    {stats.subscriptionRate}% dei clienti
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/60 rounded-lg flex items-center justify-center">
                  <Star className="text-primary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Popular Services Analytics */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-poppins font-semibold text-lg">Servizi Popolari</CardTitle>
                  <select className="text-sm border border-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent">
                    <option>Questo Mese</option>
                    <option>Mese Scorso</option>
                    <option>Quest'Anno</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.serviceAnalytics.slice(0, 4).map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <TrendingUp className="text-primary w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.bookings} prenotazioni</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full progress-fill" 
                            style={{ width: `${service.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground min-w-[3rem] text-right">
                          {service.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins font-semibold text-lg">Attività Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserPlus className="text-success w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">Nuovo cliente <strong>Sarah Johnson</strong> registrato</p>
                    <p className="text-xs text-muted-foreground mt-1">2 minuti fa</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="text-primary w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">Appuntamento prenotato per <strong>Maria Garcia</strong></p>
                    <p className="text-xs text-muted-foreground mt-1">15 minuti fa</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="text-accent w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground"><strong>Jennifer Lee</strong> ha aggiornato a abbonamento Premium</p>
                    <p className="text-xs text-muted-foreground mt-1">1 ora fa</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-secondary/60 rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign className="text-primary w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">Pagamento ricevuto da <strong>Anna Thompson</strong> - €125</p>
                    <p className="text-xs text-muted-foreground mt-1">2 ore fa</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Today's Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins font-semibold text-lg">Azioni Rapide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-start text-left border-2 border-primary/20 hover:bg-primary/5"
                  onClick={() => setShowAddClientModal(true)}
                >
                  <UserPlus className="text-primary text-xl mb-2" />
                  <p className="font-medium text-foreground">Aggiungi Cliente</p>
                  <p className="text-sm text-muted-foreground">Registra nuovo cliente</p>
                </Button>

                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-start text-left border-2 border-accent/20 hover:bg-accent/5"
                  onClick={() => setShowBookingModal(true)}
                >
                  <CalendarPlus className="text-accent text-xl mb-2" />
                  <p className="font-medium text-foreground">Prenota Servizio</p>
                  <p className="text-sm text-muted-foreground">Pianifica appuntamento</p>
                </Button>

                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-start text-left border-2 border-success/20 hover:bg-success/5"
                  onClick={() => setShowSubscriptionModal(true)}
                >
                  <Star className="text-success text-xl mb-2" />
                  <p className="font-medium text-foreground">Aggiungi Abbonamento</p>
                  <p className="text-sm text-muted-foreground">Crea abbonamento</p>
                </Button>

                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-start text-left border-2 border-secondary/80 hover:bg-secondary/20"
                  asChild
                >
                  <Link href="/analytics">
                    <BarChart3 className="text-primary text-xl mb-2" />
                    <p className="font-medium text-foreground">Visualizza Report</p>
                    <p className="text-sm text-muted-foreground">Analisi dell'attività</p>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-poppins font-semibold text-lg">Programma di Oggi</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/bookings">Vedi Tutto</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.todayBookings.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nessun appuntamento programmato per oggi</p>
                ) : (
                  dashboardData?.todayBookings.map((booking) => {
                    const appointmentTime = new Date(booking.appointmentDate);
                    return (
                      <div key={booking.id} className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                        <div className="text-center min-w-[3rem]">
                          <p className="text-sm font-medium text-primary">
                            {appointmentTime.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: false 
                            })}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">Client Appointment</p>
                          <p className="text-sm text-muted-foreground">Service Booking</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">${booking.totalPrice}</p>
                          <div className={`inline-block w-2 h-2 rounded-full ${
                            booking.status === 'completed' ? 'bg-success' : 
                            booking.status === 'scheduled' ? 'bg-accent' : 'bg-destructive'
                          }`} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddClientModal open={showAddClientModal} onOpenChange={setShowAddClientModal} />
      <AddBookingModal open={showBookingModal} onOpenChange={setShowBookingModal} />
      <AddSubscriptionModal open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal} />
    </Layout>
  );
}
