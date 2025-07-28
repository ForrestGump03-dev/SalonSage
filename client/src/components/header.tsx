import { Search, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AddClientModal } from "./add-client-modal";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  return (
    <>
      <header className="bg-card shadow-sm border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-poppins font-semibold text-2xl text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search clients..."
                className="pl-10 pr-4 py-2 w-64"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            </div>
            
            {/* Add Client Button */}
            <Button
              onClick={() => setShowAddClientModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
            
            {/* Profile Menu */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-accent-foreground" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <AddClientModal 
        open={showAddClientModal} 
        onOpenChange={setShowAddClientModal} 
      />
    </>
  );
}
