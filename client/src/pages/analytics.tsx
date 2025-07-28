import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Star,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { type Booking, type Client, type Service, type ClientSubscription } from "@shared/schema";

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

export default function Analytics() {
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/analytics/dashboard"],
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: clientSubscriptions = [] } = useQuery<ClientSubscription[]>({
    queryKey: ["/api/client-subscriptions"],
  });

  if (dashboardLoading) {
    return (
      <Layout title="Analisi" subtitle="Statistiche e performance dell'attività">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
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

  // Prepare monthly revenue data
  const monthlyRevenueData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(2024, i, 1);
    const monthBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate.getMonth() === i && bookingDate.getFullYear() === 2024;
    });
    const revenue = monthBookings.reduce((sum, booking) => sum + parseFloat(booking.totalPrice), 0);
    
    return {
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      revenue: revenue,
      bookings: monthBookings.length
    };
  });

  // Service performance data
  const servicePerformanceData = dashboardData?.serviceAnalytics.slice(0, 6).map(service => ({
    name: service.name.length > 15 ? service.name.substring(0, 15) + '...' : service.name,
    bookings: service.bookings,
    percentage: service.percentage
  })) || [];

  // Client growth data (last 6 months)
  const clientGrowthData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - i));
    
    const monthClients = clients.filter(client => {
      const clientDate = new Date(client.createdAt);
      return clientDate.getMonth() === month.getMonth() && 
             clientDate.getFullYear() === month.getFullYear();
    });
    
    return {
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      clients: monthClients.length
    };
  });

  // Subscription distribution data
  const subscriptionData = [
    { name: 'With Subscription', value: stats.activeSubscriptions, color: '#8B5A3C' },
    { name: 'Without Subscription', value: stats.activeClients - stats.activeSubscriptions, color: '#F4E4BC' }
  ];

  // Status breakdown
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const scheduledBookings = bookings.filter(b => b.status === 'scheduled').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

  const statusData = [
    { name: 'Completed', value: completedBookings, color: '#27AE60' },
    { name: 'Scheduled', value: scheduledBookings, color: '#D4A574' },
    { name: 'Cancelled', value: cancelledBookings, color: '#E74C3C' }
  ];

  return (
    <Layout title="Analisi" subtitle="Statistiche e performance del business">
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Totale Ricavi</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    ${bookings.reduce((sum, b) => sum + parseFloat(b.totalPrice), 0).toFixed(2)}
                  </p>
                  <p className="text-success text-sm mt-2 flex items-center">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    15% from last month
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
                  <p className="text-muted-foreground text-sm font-medium">Totale Prenotazioni</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{bookings.length}</p>
                  <p className="text-success text-sm mt-2 flex items-center">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    8% aumento
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="text-primary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Fidelizzazione Clienti</p>
                  <p className="text-3xl font-bold text-foreground mt-2">92%</p>
                  <p className="text-accent text-sm mt-2 flex items-center">
                    <Minus className="w-3 h-3 mr-1" />
                    Stabile
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Users className="text-accent text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Valore Medio del Servizio</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    ${bookings.length > 0 
                      ? (bookings.reduce((sum, b) => sum + parseFloat(b.totalPrice), 0) / bookings.length).toFixed(2)
                      : '0.00'
                    }
                  </p>
                  <p className="text-success text-sm mt-2 flex items-center">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    5% higher
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/60 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-primary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafico dei Ricavi Mensili */}
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins font-semibold text-lg">Trend dei Ricavi Mensili</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8B5A3C" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5A3C', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8B5A3C', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Grafico delle Prestazioni del Servizio */}
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins font-semibold text-lg">Prestazioni del Servizio</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={servicePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip 
                    formatter={(value: any) => [value, 'Bookings']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="bookings" 
                    fill="#8B5A3C"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crescita Clientela */}
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins font-semibold text-lg">Crescita Clientela</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={clientGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip 
                    formatter={(value: any) => [value, 'New Clients']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="clients" 
                    fill="#D4A574"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuzione Abbonamenti */}
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins font-semibold text-lg">Distribuzione Abbonamenti</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [value, 'Clients']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-4 mt-4">
                {subscriptionData.map((entry, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Distribuzione Stato Prenotazione */}
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins font-semibold text-lg">Stato Prenotazione</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [value, 'Bookings']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-4 mt-4">
                {statusData.map((entry, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Riepilogo delle Prestazioni */}
        <Card>
          <CardHeader>
            <CardTitle className="font-poppins font-semibold text-lg">Riepilogo delle Prestazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{completedBookings}</p>
                <p className="text-sm text-muted-foreground">Servizi Completati</p>
                <p className="text-xs text-success mt-1">
                  {bookings.length > 0 ? Math.round((completedBookings / bookings.length) * 100) : 0}% tasso di completamento
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{services.length}</p>
                <p className="text-sm text-muted-foreground">Opzioni Servizio</p>
                <p className="text-xs text-primary mt-1">
                  ${services.length > 0 
                    ? (services.reduce((sum, s) => sum + parseFloat(s.price), 0) / services.length).toFixed(2)
                    : '0.00'
                  } prezzo medio
                </p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">${stats.monthlyRevenue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Questo Mese</p>
                <p className="text-xs text-accent mt-1">
                  {stats.todayAppointments} appuntamenti oggi
                </p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats.subscriptionRate}%</p>
                <p className="text-sm text-muted-foreground">Tasso di Abbonamento</p>
                <p className="text-xs text-success mt-1">
                  {stats.activeSubscriptions} abbonamenti attivi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
