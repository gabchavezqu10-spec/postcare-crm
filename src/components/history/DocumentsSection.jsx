import { clientDocumentApi } from '@/api/clientDocumentApi';
import { clientTimelineApi } from '@/api/clientTimelineApi';
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Image, File, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function DocumentsSection({ client, documents }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const fileType = file.type.includes("pdf") ? "PDF" : 
                       file.type.includes("image") ? "Imagen" : "Documento";
      
      await clientDocumentApi.create({
        client_id: client.id,
        file_name: file.name,
        file_url: file_url,
        file_type: fileType,
        uploaded_by: (await base44.auth.me()).email,
      });

      await clientTimelineApi.create({
        client_id: client.id,
        event_type: "documento_subido",
        event_title: "Documento subido",
        event_description: `Archivo: ${file.name}`,
        event_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", client.id] });
      queryClient.invalidateQueries({ queryKey: ["timeline", client.id] });
      setUploading(false);
      toast.success("Documento subido");
    },
    onError: () => {
      setUploading(false);
      toast.error("Error al subir documento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => clientDocumentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", client.id] });
      toast.success("Documento eliminado");
    },
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("El archivo no debe superar 10MB");
        return;
      }
      setUploading(true);
      uploadMutation.mutate(file);
    }
  };

  const getFileIcon = (type) => {
    if (type === "PDF") return FileText;
    if (type === "Imagen") return Image;
    return File;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Documentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="block">
          <Button className="w-full" size="sm" disabled={uploading} asChild>
            <div>
              {uploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Subir Documento</>
              )}
            </div>
          </Button>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>

        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No hay documentos subidos
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.file_type);
              return (
                <Card key={doc.id} className="bg-card/50">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {moment(doc.created_date).format("DD/MM/YYYY")}
                          {doc.uploaded_by && ` • ${doc.uploaded_by}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(doc.file_url, "_blank")}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            if (confirm("¿Eliminar este documento?")) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}