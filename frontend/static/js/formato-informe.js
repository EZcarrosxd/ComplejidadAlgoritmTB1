export const formatoInforme = new Intl.NumberFormat('fr-FR');
export const formatoSegundosInforme = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 });

export function metros(milimetros) {
    const peso = BigInt(milimetros);
    const metrosEnteros = formatoInforme.format(peso / 1000n);
    const fraccion = String(peso % 1000n).padStart(3, '0');
    return `${metrosEnteros},${fraccion} m`;
}
