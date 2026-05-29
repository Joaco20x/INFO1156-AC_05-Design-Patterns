/**
 * Resultado normalizado de moderación.
 * Independiente de la implementación del cliente legacy.
 */
export interface ModerationResult {
    blocked: boolean
    reason?: string
}
