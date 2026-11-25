// Abre automáticamente el Side Panel de PactaCloud al hacer clic en el ícono de la extensión
if (chrome?.sidePanel?.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('PactaCloud sidePanel error:', err));
}
