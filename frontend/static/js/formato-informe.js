export const formatoInforme = new Intl.NumberFormat('fr-FR');
export const formatoMetros = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
export const formatoSegundosInforme = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 });

export const metros = (milimetros) => `${formatoMetros.format(milimetros / 1000)} m`;
