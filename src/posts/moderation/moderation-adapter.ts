import { Injectable } from "@nestjs/common"
import { legacyModerationApi } from "@/posts/legacy-moderation.client"
import { ModerationResult } from "@/posts/moderation/moderation.types"

/**
 * Adapter Pattern — convierte la salida inconsistente de legacyModerationApi
 * (string | number | object) en un ModerationResult uniforme.
 *
 * El controlador solo interactúa con este adapter; si la API legacy cambia
 * en el futuro, el único archivo a tocar es este.
 */
@Injectable()
export class ModerationAdapter {
    review(content: string): ModerationResult {
        const raw = legacyModerationApi.review(content)

        // Caso 1: string "BLOCK" → bloqueado sin razón adicional
        if (raw === "BLOCK") {
            return { blocked: true, reason: "blocked-by-legacy-rule" }
        }

        // Caso 2: string "OK" → permitido
        if (raw === "OK") {
            return { blocked: false }
        }

        // Caso 3: número → bloqueado si es menor a 1
        if (typeof raw === "number") {
            return {
                blocked: raw < 1,
                reason: raw < 1 ? "legacy-numeric-block" : undefined,
            }
        }

        // Caso 4: objeto { pass: boolean, reason?: string }
        if (typeof raw === "object" && raw !== null) {
            const passed = "pass" in raw && raw.pass === true
            return {
                blocked: !passed,
                reason: !passed ? (raw as any).reason ?? "legacy-object-block" : undefined,
            }
        }

        // Fallback defensivo: permitir si no se reconoce el tipo
        return { blocked: false }
    }
}
