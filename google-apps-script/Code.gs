/**
 * ==============================================================================
 * MINUTEFLOW - GOOGLE APPS SCRIPT WEBHOOK PARA GOOGLE DRIVE
 * Cuenta de Destino: jose.cataldo@redq.cl (o cualquier cuenta de Google)
 * ==============================================================================
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Entra a https://script.google.com con tu cuenta (jose.cataldo@redq.cl).
 * 2. Crea un "Nuevo Proyecto" y nómbralo "MinuteFlow Drive Sync".
 * 3. Borra el código que aparezca y pega TODO este archivo.
 * 4. Haz clic en "Implementar" (arriba a la derecha) > "Nueva implementación".
 * 5. Tipo: "Aplicación web".
 * 6. Configuración:
 *    - Descripción: "MinuteFlow Webhook"
 *    - Ejecutar como: "Yo" (jose.cataldo@redq.cl)
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone)
 * 7. Haz clic en "Implementar" y autoriza los permisos de Google Drive.
 * 8. Copia la "URL de la aplicación web" (termina en /exec) y pégala en MinuteFlow.
 */

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "online", message: "MinuteFlow Google Drive Sync Activo y Conectado" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : null;
    if (!rawData) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(rawData);

    // 1. Obtener o crear la carpeta principal y la subcarpeta de categoría
    var rootFolderName = "MinuteFlow - Actas Ejecutivas";
    var rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), rootFolderName);
    
    var targetFolderName = data.directory || "Reuniones Generales";
    var targetFolder = getOrCreateFolder(rootFolder, targetFolderName);

    // 2. Crear el Documento de Google con el contenido del acta
    var docTitle = (data.title || "Acta de Reunión") + " - " + (data.date || new Date().toISOString().split('T')[0]);
    var doc = DocumentApp.create(docTitle);
    var body = doc.getBody();

    // Estilos y Encabezado
    body.setMarginTop(54);
    body.setMarginBottom(54);
    body.setMarginLeft(54);
    body.setMarginRight(54);

    // Título Principal
    var titlePar = body.appendParagraph(data.title || "Acta de Reunión Ejecutiva");
    titlePar.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    titlePar.setForegroundColor("#1e1b4b");

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
        body.appendListItem(att.name + " — " + (att.role || "Miembro") + " (" + (att.email || "") + ")");
      }
    }

    // Puntos Tratados y Acuerdos
    body.appendParagraph("\n3. PUNTOS TRATADOS Y ACUERDOS ADOPTADOS").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(data.pointsTreated || "Sin notas registradas.");

    // Compromisos y Tareas (Action Items)
    if (data.actionItems && data.actionItems.length > 0) {
      body.appendParagraph("\n4. COMPROMISOS Y TAREAS DERIVADAS").setHeading(DocumentApp.ParagraphHeading.HEADING2);
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

    // 3. Mover el archivo a la carpeta correspondiente en Google Drive
    var file = DriveApp.getFileById(doc.getId());
    targetFolder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "success",
        message: "Acta guardada correctamente en Google Drive",
        fileUrl: doc.getUrl(),
        fileId: doc.getId(),
        folderName: targetFolderName
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
