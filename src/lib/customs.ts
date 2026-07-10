/**
 * ===================================================================
 * Aduana de Uruguay: impuestos de un pedido de importación.
 *
 * Al recibir un pedido, Correo Uruguayo cobra:
 *
 *   Impuesto (IVA o Tributos) .... base × tasa
 *   Servicio de Correo Uruguayo .. cargo fijo
 *   Costo de Almacenamiento ...... si el paquete quedó demorado
 *   Saldo a favor ................ se descuenta
 *   ------------------------------------------------
 *   Total
 *
 * La tasa depende de si se usa FRANQUICIA (unas 3 encomiendas al año con
 * impuesto reducido) o no:
 *
 *   Con franquicia:  22% + US$ 2,60 de correo
 *   Sin franquicia:  60% + US$ 4,50 de correo
 *
 * Los porcentajes y cargos son configurables (cambian con el tiempo) y
 * cada pedido guarda los suyos como histórico.
 * ===================================================================
 */
import { money } from "@/lib/costs";

export type CustomsInput = {
  /** Valor sobre el que se calcula el impuesto (normalmente, el costo de los productos). */
  baseUsd: number;
  taxRatePct: number;
  postalFeeUsd: number;
  storageUsd: number;
  /** Saldo a favor: se resta del total. */
  creditUsd: number;
};

export type CustomsBreakdown = {
  baseUsd: number;
  /** Impuesto (IVA o Tributos). */
  taxUsd: number;
  postalFeeUsd: number;
  storageUsd: number;
  creditUsd: number;
  /** Lo que efectivamente se paga en la aduana. */
  totalUsd: number;
};

export function computeCustoms(i: CustomsInput): CustomsBreakdown {
  const taxUsd = money((i.baseUsd * i.taxRatePct) / 100);
  const totalUsd = money(taxUsd + i.postalFeeUsd + i.storageUsd - i.creditUsd);

  return {
    baseUsd: money(i.baseUsd),
    taxUsd,
    postalFeeUsd: money(i.postalFeeUsd),
    storageUsd: money(i.storageUsd),
    creditUsd: money(i.creditUsd),
    totalUsd,
  };
}

/** Valores por defecto según el régimen elegido. */
export function franchiseDefaults(
  usesFranchise: boolean,
  settings: {
    franchiseTaxPct: number;
    franchisePostalFeeUsd: number;
    standardTaxPct: number;
    standardPostalFeeUsd: number;
  },
) {
  return usesFranchise
    ? { taxRatePct: settings.franchiseTaxPct, postalFeeUsd: settings.franchisePostalFeeUsd }
    : { taxRatePct: settings.standardTaxPct, postalFeeUsd: settings.standardPostalFeeUsd };
}
