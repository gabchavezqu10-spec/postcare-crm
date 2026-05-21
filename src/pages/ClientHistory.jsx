import { clientApi } from '@/api/clientApi';
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search, User, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import moment from "moment";
import ClientProfileView from "../components/history/ClientProfileView";

export default function ClientHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientApi.filter(),
  });

  const filteredClients = clients.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${c.nombre} ${c.apellido}`.toLowerCase();
    return (
      fullName.includes(query) ||
      c.documento?.toLowerCase().includes(query) ||
      c.telefono?.includes(query)
    );
  });

  if (selectedClient) {
    return (
      <ClientProfileView 
        client={selectedClient} 
        onBack={() => setSelectedClient(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Historial de Clientes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Busca y gestiona perfiles completos de clientes
        </p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, DNI o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No se encontraron clientes
              </CardContent>
            </Card>
          ) : (
            filteredClients.map(client => (
              <Card
                key={client.id}
                className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
                onClick={() => setSelectedClient(client)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={client.profile_photo} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {client.nombre?.[0]}{client.apellido?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">
                        {client.nombre} {client.apellido}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                        {client.documento && (
                          <span>DNI: {client.documento}</span>
                        )}
                        {client.telefono && (
                          <span>• {client.telefono}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {moment(client.created_date || client.fecha_registro).format("DD/MM/YYYY")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}