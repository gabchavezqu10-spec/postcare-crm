import { clientApi } from '@/api/clientApi';
import moment from "moment";

/**
 * Construye el payload real con datos actualizados del cliente
 */
export function buildClientPayload(client) {
  return {
    id: client.id,
    nombre: client.nombre,
    apellido: client.apellido,
    telefono: client.telefono,
    documento: client.documento,
    servicio_realizado: client.servicio_realizado,
    sede: client.sede,
    fecha_atencion: client.fecha_atencion,
    fecha_proxima_sesion: client.fecha_proxima_sesion,
    estado: client.estado,
    numero_sesion_actual: client.numero_sesion_actual,
    total_sesiones_sugeridas: client.total_sesiones_sugeridas,
    observaciones: client.observaciones,
    profesional: client.profesional,
    fecha_actualizacion: moment().toISOString(),
  };
}

/**
 * Evalúa si un cliente requiere nueva sesión
 */
export function clientRequiresNewSession(client) {
  if (!client.fecha_proxima_sesion) return false;
  
  const hoy = moment().startOf("day");
  const fechaProxima = moment(client.fecha_proxima_sesion).startOf("day");
  
  // Validar que la fecha próxima ya pasó o es hoy
  if (fechaProxima.isAfter(hoy)) return false;
  
  // Validar que no esté finalizado
  if (["Tratamiento finalizado", "No continuó"].includes(client.estado)) return false;
  
  return true;
}

/**
 * Evalúa si un cliente cumple con la condición del evento
 */
export function evaluateEventCondition(client, event) {
  switch (event) {
    case "requiere_nueva_sesion":
      return clientRequiresNewSession(client);
    
    case "en_seguimiento":
      return client.estado === "En seguimiento";
    
    case "lead_registrado":
    case "lead_actualizado":
    case "nueva_sesion_registrada":
    case "cambio_de_estado":
      return true; // Estos eventos se disparan por acción, no por condición
    
    default:
      return true;
  }
}

/**
 * Evalúa si un cliente cumple con la condición JSON adicional
 */
export function evaluateCondition(client, conditionJson) {
  if (!conditionJson) return true;
  
  try {
    const condition = JSON.parse(conditionJson);
    return Object.entries(condition).every(([key, value]) => {
      return client[key] === value;
    });
  } catch {
    return true;
  }
}

/**
 * Genera hash único para evitar duplicados
 */
export function generateEventHash(integrationId, clientId, event) {
  return `${integrationId}-${clientId}-${event}`;
}

/**
 * Verifica si ya se envió este evento para este cliente en esta integración
 */
export async function isDuplicate(integrationId, clientId, event) {
  const hash = generateEventHash(integrationId, clientId, event);
  const logs = await integrationApiLog.filter({ 
    integration_id: integrationId,
    client_id: clientId,
    hash_evento: hash,
    estado_envio: "exitoso"
  });
  return logs.length > 0;
}

/**
 * Envía webhook saliente con lógica de reintentos
 */
export async function sendWebhook(integration, client, isManual = false, attemptNumber = 1) {
  try {
    // Consultar cliente actualizado en tiempo real
    const freshClient = await clientApi.filter({ id: client.id });
    if (!freshClient || freshClient.length === 0) {
      throw new Error("Cliente no encontrado");
    }
    const currentClient = freshClient[0];

    // Evaluar condición del evento
    if (!evaluateEventCondition(currentClient, integration.evento_disparador)) {
      return { success: false, message: "No cumple condición del evento" };
    }

    // Evaluar condición adicional JSON
    if (!evaluateCondition(currentClient, integration.condicion_json)) {
      return { success: false, message: "No cumple condición adicional" };
    }

    // Verificar duplicados (solo si no es manual)
    if (!isManual) {
      const duplicate = await isDuplicate(integration.id, currentClient.id, integration.evento_disparador);
      if (duplicate) {
        return { success: false, message: "Ya fue enviado anteriormente" };
      }
    }

    // Construir payload con datos reales
    const payload = buildClientPayload(currentClient);

    // Parsear headers personalizados
    let headers = { "Content-Type": "application/json" };
    if (integration.headers_personalizados) {
      try {
        const customHeaders = JSON.parse(integration.headers_personalizados);
        headers = { ...headers, ...customHeaders };
      } catch (e) {
        console.warn("Headers personalizados inválidos", e);
      }
    }

    // Enviar webhook
    const response = await fetch(integration.url, {
      method: integration.metodo_http || "POST",
      headers,
      body: integration.metodo_http === "POST" ? JSON.stringify(payload) : undefined,
    });

    const responseText = await response.text();
    const success = response.ok;

    // Registrar log
    await integrationApiLog.create({
      integration_id: integration.id,
      client_id: currentClient.id,
      treatment_id: currentClient.id,
      evento: integration.evento_disparador,
      tipo: "saliente",
      payload_enviado: JSON.stringify(payload),
      estado_envio: success ? "sent" : "failed",
      codigo_respuesta: response.status,
      respuesta: responseText,
      fue_manual: isManual,
      hash_evento: generateEventHash(integration.id, currentClient.id, integration.evento_disparador),
      error_mensaje: success ? null : `Error ${response.status}: ${responseText}`,
      attempt_number: attemptNumber,
      http_status_code: response.status,
      response_received: responseText,
      payload_sent: JSON.stringify(payload),
      send_status: success ? "sent" : "failed",
      manual_trigger: isManual,
    });

    // Si falló y no es manual, intentar reintentos automáticos
    if (!success && !isManual && attemptNumber < 3) {
      await new Promise(resolve => setTimeout(resolve, 2000 * attemptNumber)); // Espera progresiva
      return await sendWebhook(integration, client, false, attemptNumber + 1);
    }

    // Actualizar webhook_status en el cliente
    if (!isManual) {
      const finalStatus = success ? "sent" : (attemptNumber >= 3 ? "failed" : "retrying");
      await clientApi.update(currentClient.id, { webhook_status: finalStatus });
    }

    // Actualizar integración
    await integrationApi.update(integration.id, {
      ultima_ejecucion: moment().toISOString(),
      ultimo_estado: success ? "exitoso" : "fallido",
      ultima_respuesta: responseText.substring(0, 500),
    });

    return { success, status: response.status, message: responseText };
  } catch (error) {
    // Registrar error
    await integrationApiLog.create({
      integration_id: integration.id,
      client_id: client.id,
      treatment_id: client.id,
      evento: integration.evento_disparador,
      tipo: "saliente",
      payload_enviado: JSON.stringify(buildClientPayload(client)),
      estado_envio: "failed",
      fue_manual: isManual,
      error_mensaje: error.message,
      attempt_number: attemptNumber,
      send_status: "failed",
      manual_trigger: isManual,
    });

    // Reintentar si no es manual y no se alcanzó el límite
    if (!isManual && attemptNumber < 3) {
      await new Promise(resolve => setTimeout(resolve, 2000 * attemptNumber));
      return await sendWebhook(integration, client, false, attemptNumber + 1);
    }

    // Actualizar webhook_status en el cliente
    if (!isManual) {
      await clientApi.update(client.id, { webhook_status: "failed" });
    }

    return { success: false, message: error.message };
  }
}

/**
 * Dispara webhooks automáticamente cuando un cliente cambia
 */
export async function triggerWebhooksForClient(client, event) {
  // Buscar integraciones activas que coincidan con el evento
  const integrations = await integrationApi.filter({
    activo: true,
    tipo_integracion: "saliente",
    evento_disparador: event,
  });

  // Ejecutar cada integración
  for (const integration of integrations) {
    await sendWebhook(integration, client, false);
  }
}

/**
 * Procesa webhook entrante
 */
export async function processIncomingWebhook(integrationId, token, data) {
  try {
    // Buscar integración
    const integrations = await integrationApi.filter({ id: integrationId });
    if (!integrations || integrations.length === 0) {
      return { success: false, message: "Integración no encontrada" };
    }
    const integration = integrations[0];

    // Validar token
    if (integration.secret_token !== token) {
      return { success: false, message: "Token inválido" };
    }

    // Identificar cliente
    const identificador = data[integration.campo_identificador];
    if (!identificador) {
      return { success: false, message: "Identificador no proporcionado" };
    }

    const clients = await clientApi.filter({
      [integration.campo_identificador]: identificador,
    });

    if (!clients || clients.length === 0) {
      return { success: false, message: "Cliente no encontrado" };
    }

    const client = clients[0];

    // Parsear campos permitidos
    let camposPermitidos = [];
    try {
      camposPermitidos = JSON.parse(integration.campos_permitidos || "[]");
    } catch {
      camposPermitidos = ["estado", "observaciones"];
    }

    // Construir actualización solo con campos permitidos
    const updateData = {};
    camposPermitidos.forEach(campo => {
      if (data[campo] !== undefined) {
        updateData[campo] = data[campo];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return { success: false, message: "No hay campos válidos para actualizar" };
    }

    // Actualizar cliente
    await clientApi.update(client.id, updateData);

    // Registrar log
    await integrationApiLog.create({
      integration_id: integration.id,
      client_id: client.id,
      treatment_id: client.id,
      evento: "webhook_entrante",
      tipo: "entrante",
      payload_enviado: JSON.stringify(data),
      estado_envio: "sent",
      send_status: "sent",
      payload_sent: JSON.stringify(data),
    });

    return { success: true, message: "Cliente actualizado", client_id: client.id };
  } catch (error) {
    return { success: false, message: error.message };
  }
}