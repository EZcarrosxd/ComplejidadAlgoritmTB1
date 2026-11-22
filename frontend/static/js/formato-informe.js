export const formatoInforme = new Intl.NumberFormat('fr-FR');
export const formatoSegundosInforme = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 });

export function longitudEnMetros(milimetros, compacto = false) {
    const peso = BigInt(milimetros);
    const metrosEnteros = formatoInforme.format(peso / 1000n);
    let fraccion = String(peso % 1000n).padStart(3, '0');
    if (compacto) fraccion = fraccion.replace(/0+$/, '');
    return fraccion ? `${metrosEnteros},${fraccion}` : metrosEnteros;
}

export const metros = (milimetros) => `${longitudEnMetros(milimetros)} m`;
