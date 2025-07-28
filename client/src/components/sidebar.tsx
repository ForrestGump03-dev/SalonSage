import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Star, 
  Scissors, 
  BarChart3,
  Key
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { licenseManager } from "@/lib/license";
import { useEffect, useState } from "react";

const navigationItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/clients", icon: Users, label: "Clienti" },
  { path: "/bookings", icon: Calendar, label: "Prenotazioni" },
  { path: "/subscriptions", icon: Star, label: "Abbonamenti" },
  { path: "/services", icon: Scissors, label: "Servizi" },
  { path: "/analytics", icon: BarChart3, label: "Analisi" },
];

export function Sidebar() {
  const [location] = useLocation();
  const [licenseStatus, setLicenseStatus] = useState<'loading' | 'licensed' | 'demo'>('loading');

  useEffect(() => {
    // Check license on component mount
    licenseManager.validateLicense("SALON_FLOW_FULL_2024").then((info) => {
      setLicenseStatus(info.isValid ? 'licensed' : 'demo');
    });
  }, []);

  return (
    <div className="w-64 bg-card shadow-lg border-r border-border flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Scissors className="text-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="font-poppins font-bold text-xl text-primary">SalonFlow</h1>
            <p className="text-xs text-muted-foreground">
              {licenseStatus === 'licensed' ? 'Edizione Professionale' : 
               licenseStatus === 'demo' ? 'Versione Demo' : 'Caricamento...'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-primary"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* License Info */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          "rounded-lg p-3",
          licenseStatus === 'licensed' ? "bg-success/10" : "bg-warning/10"
        )}>
          <div className="flex items-center space-x-2">
            <Key className={cn(
              "w-4 h-4",
              licenseStatus === 'licensed' ? "text-success" : "text-warning"
            )} />
            <span className={cn(
              "text-sm font-medium",
              licenseStatus === 'licensed' ? "text-success" : "text-warning"
            )}>
              {licenseStatus === 'licensed' ? 'Con Licenza' : 'Modalità Demo'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {licenseStatus === 'licensed' ? 'Versione completa attivata' : 'Funzionalità limitate'}
          </p>
        </div>
      </div>
    </div>
  );
}
