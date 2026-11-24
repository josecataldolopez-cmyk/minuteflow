/**
 * ==============================================================================
 * PACTACLOUD (MINUTEFLOW) - GOOGLE APPS SCRIPT WEBHOOK PARA GOOGLE DRIVE
 * Sincronización oficial de Actas y Carpetas en Google Drive
 * ==============================================================================
 * 
 * INSTRUCCIONES DE INSTALACIÓN (3 minutos):
 * 1. Abre https://script.google.com con tu cuenta de Google del establecimiento.
 * 2. Haz clic en "Nuevo proyecto" y nómbralo "PactaCloud Drive Sync".
 * 3. Borra el código existente y pega TODO el contenido de este archivo.
 * 4. Haz clic en "Implementar" (arriba a la derecha) > "Nueva implementación".
 * 5. Selecciona tipo: "Aplicación web".
 * 6. Configuración obligatoria:
 *    - Descripción: "PactaCloud Webhook"
 *    - Ejecutar como: "Yo" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone)
 * 7. Haz clic en "Implementar", autoriza los permisos de Google Drive cuando te lo solicite.
 * 8. Copia la "URL de la aplicación web" (termina en /exec) y pégala en PactaCloud en Configuración > Google Drive.
 *
 * SEGURIDAD (obligatorio):
 * 9. En el editor del script: Configuración del proyecto (ícono de engranaje) >
 *    "Propiedades del script" > agrega la propiedad SHARED_SECRET con un valor
 *    largo y aleatorio (ej. generado con un password manager).
 * 10. Configura el MISMO valor en PactaCloud (variable de entorno DRIVE_WEBHOOK_SECRET
 *    o el campo "Secreto del webhook" en Configuración > Google Drive).
 *    Toda petición POST debe incluir { "secret": "<SHARED_SECRET>" } o será rechazada.
 */

/**
 * Obtiene el secreto compartido desde las Propiedades del Script.
 * Si no está configurado, el webhook rechaza todas las peticiones por seguridad.
 */
function getSharedSecret() {
  return PropertiesService.getScriptProperties().getProperty("SHARED_SECRET") || "";
}

/**
 * Respuesta de error estándar en JSON.
 */
function errorResponse(status, message) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: status, message: message })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "online",
      message: "PactaCloud Google Drive Sync Activo y Conectado",
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : null;
    if (!rawData) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", message: "No data received" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(rawData);

    // Validación de seguridad: exigir secreto compartido coincidente.
    var expectedSecret = getSharedSecret();
    if (!expectedSecret) {
      return errorResponse("error", "Webhook no configurado: falta la propiedad SHARED_SECRET en el script.");
    }
    if (data.secret !== expectedSecret) {
      return errorResponse("error", "No autorizado: secreto de webhook inválido o ausente.");
    }

    var orgName = data.organizationName || "Establecimiento";
    var rootFolderName = "PactaCloud - Actas Oficiales (" + orgName + ")";
    var rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), rootFolderName);

    // CASO 1: Acción de creación explícita de Carpeta / Subcarpeta
    if (data.action === "create_folder") {
      var folderName = data.folderName || data.name || "Nueva Carpeta";
      var createdFolder = getOrCreateFolder(rootFolder, folderName);
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "success",
          message: "Carpeta '" + folderName + "' creada correctamente en Google Drive (" + rootFolderName + ")",
          folderId: createdFolder.getId(),
          folderUrl: createdFolder.getUrl(),
          rootFolderUrl: rootFolder.getUrl()
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // CASO 2: Prueba de Conexión
    if (data.action === "test") {
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "success",
          message: "Conexión verificada exitosamente con Google Drive. Carpeta raíz activa: " + rootFolderName,
          folderUrl: rootFolder.getUrl(),
          folderId: rootFolder.getId()
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // CASO 3: Guardar Acta Oficial como Documento de Google
    var targetFolderName = data.directory || "Reuniones Generales";
    var targetFolder = getOrCreateFolder(rootFolder, targetFolderName);

    var docTitle = (data.title || "Acta de Reunión") + " - " + (data.date || new Date().toISOString().split('T')[0]);
    var doc = DocumentApp.create(docTitle);
    var body = doc.getBody();

    // Márgenes ejecutivos
    body.setMarginTop(54);
    body.setMarginBottom(54);
    body.setMarginLeft(54);
    body.setMarginRight(54);

    // Encabezado institucional
    var headerPar = body.appendParagraph(orgName.toUpperCase());
    headerPar.setHeading(DocumentApp.ParagraphHeading.HEADING3);
    headerPar.setForegroundColor("#4f46e5");

    // Título Principal
    var titlePar = body.appendParagraph(data.title || "Acta de Reunión Oficial");
    titlePar.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    titlePar.setForegroundColor("#0f172a");

    // Metadatos
    body.appendParagraph("📅 Fecha: " + (data.date || "N/A") + "   |   ⏰ Hora: " + (data.time || "10:00") + "   |   📁 Carpeta: " + targetFolderName);
    body.appendParagraph("🏷️ Estado: " + (data.status || "Aprobada") + "   |   👤 Registrado por: " + (data.author || "Dirección Ejecutiva"));
    body.appendHorizontalRule();

    // Objetivos
    if (data.objectives) {
      body.appendParagraph("\n1. OBJETIVO Y PROPÓSITO DE LA SESIÓN").setHeading(DocumentApp.ParagraphHeading.HEADING2);
      body.appendParagraph(data.objectives);
    }

    // Asistentes
    if (data.attendees && data.attendees.length > 0) {
      body.appendParagraph("\n2. ASISTENTES Y PARTICIPANTES").setHeading(DocumentApp.ParagraphHeading.HEADING2);
      for (var i = 0; i < data.attendees.length; i++) {
        var att = data.attendees[i];
        body.appendListItem(att.name + " — " + (att.role || "Miembro") + (att.email ? " (" + att.email + ")" : ""));
      }
    }

    // Puntos Tratados
    body.appendParagraph("\n3. PUNTOS TRATADOS Y DESARROLLO").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(data.pointsTreated || "Sin notas registradas.");

    // Acuerdos y Decisiones Clave
    if (data.keyDecisions && data.keyDecisions.length > 0) {
      body.appendParagraph("\n4. ACUERDOS Y DECISIONES CLAVE").setHeading(DocumentApp.ParagraphHeading.HEADING2);
      for (var k = 0; k < data.keyDecisions.length; k++) {
        body.appendListItem("✓ " + data.keyDecisions[k]);
      }
    }

    // Compromisos y Tareas (Action Items)
    if (data.actionItems && data.actionItems.length > 0) {
      body.appendParagraph("\n5. COMPROMISOS Y TAREAS DERIVADAS").setHeading(DocumentApp.ParagraphHeading.HEADING2);
      for (var j = 0; j < data.actionItems.length; j++) {
        var item = data.actionItems[j];
        var assigneeName = item.assignedTo ? item.assignedTo.name : "Sin asignar";
        var priorityText = item.priority === "High" ? "[Alta]" : item.priority === "Low" ? "[Baja]" : "[Media]";
        var statusText = item.completed ? "✓ COMPLETADO" : "PENDIENTE";
        body.appendListItem("• " + item.text + " | Responsable: " + assigneeName + " | Vence: " + (item.dueDate || "N/A") + " " + priorityText + " (" + statusText + ")");
      }
    }

    // Próxima Sesión
    if (data.nextSessionDate) {
      body.appendHorizontalRule();
      body.appendParagraph("🗓️ Próxima Sesión Programada: " + data.nextSessionDate);
    }

    doc.saveAndClose();

    // Mover el archivo a la subcarpeta destino en Google Drive
    var file = DriveApp.getFileById(doc.getId());
    targetFolder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "success",
        message: "Acta guardada exitosamente en la carpeta '" + targetFolderName + "' de Google Drive",
        fileUrl: doc.getUrl(),
        fileId: doc.getId(),
        folderName: targetFolderName,
        folderUrl: targetFolder.getUrl()
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función auxiliar para obtener una carpeta o crearla si no existe
 */
function getOrCreateFolder(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(folderName);
  }
}
