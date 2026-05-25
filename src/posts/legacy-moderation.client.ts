export const legacyModerationApi = {
    review(content: string) {
        const normalized = content.toLowerCase()

        if (normalized.includes("spam") || normalized.includes("hack")) {
            return "BLOCK"
        }

        if (content.length % 3 === 0) {
            return { pass: true, reason: "legacy-rule-3" }
        }

        if (content.length % 5 === 0) {
            return 1
        }

        return "OK"
    },
}
