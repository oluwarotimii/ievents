/**
 * Validates if a string is a valid 4-digit event code
 */
export function isValidEventCode(code: string): boolean {
  return /^\d{4}$/.test(code)
}

/**
 * Generates a random 4-digit event code
 */
export function generateEventCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

/**
 * Checks if an event code exists in storage
 */
export function eventCodeExists(code: string): boolean {
  if (typeof window === "undefined") return false

  const storedForms = localStorage.getItem("eventForms")
  const forms = storedForms ? JSON.parse(storedForms) : {}

  return !!forms[code]
}

/**
 * Gets form data for a specific event code
 */
export function getFormByCode(code: string) {
  if (typeof window === "undefined") return null

  const storedForms = localStorage.getItem("eventForms")
  const forms = storedForms ? JSON.parse(storedForms) : {}

  return forms[code] || null
}

/**
 * Saves form data for a specific event code
 */
export function saveFormByCode(code: string, formData: any): void {
  if (typeof window === "undefined") return

  const storedForms = localStorage.getItem("eventForms")
  const forms = storedForms ? JSON.parse(storedForms) : {}

  forms[code] = {
    ...formData,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem("eventForms", JSON.stringify(forms))
}

