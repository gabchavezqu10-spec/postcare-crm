import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, FileText, Calendar, Clock, Edit2 } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

import BasicInfoSection from "./BasicInfoSection";
import NextActionSection from "./NextActionSection";
import DocumentsSection from "./DocumentsSection";
import TimelineSection from "./TimelineSection";

export default function ClientProfileView({ client, onBack }) {
  const queryClient = useQueryClient();
  const [editingBasicInfo, setEditingBasicInfo] = useState(false);

  const { data: timeline = [] } = useQuery({
    queryKey: ["timeline", client.id],
    queryFn: () => base44.entities.ClientTimeline.filter({ client_id: client.id }, "-event_date"),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", client.id],
    queryFn: () => base44.entities.ClientDocument.filter({ client_id: client.id }, "-created_date"),
  });

  const { data: nextActions = [] } = useQuery({
    queryKey: ["nextActions", client.id],
    queryFn: () => base44.entities.ClientNextAction.filter({ client_id: client.id }, "action_date"),
  });



  const uploadPhotoMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Client.update(client.id, { profile_photo: file_url });
      return file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Foto actualizada");
    },
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar 5MB");
        return;
      }
      uploadPhotoMutation.mutate(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Perfil de Cliente</h1>
          <p className="text-sm text-muted-foreground">Información completa y documentación</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={client.profile_photo} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                        {client.nombre?.[0]}{client.apellido?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-1 -right-1 h-7 w-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {client.nombre} {client.apellido}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Registrado el {moment(client.created_date || client.fecha_registro).format("DD/MM/YYYY")}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <BasicInfoSection client={client} />
          <DocumentsSection client={client} documents={documents} />
          <TimelineSection client={client} timeline={timeline} />
        </div>

        <div className="space-y-6">
          <NextActionSection client={client} nextActions={nextActions} />
        </div>
      </div>
    </div>
  );
}