export type FieldType = "text" | "textarea" | "select" | "radio" | "email" | "phone" | "date" | "number" | "payment"

export interface FormField {
  id: string
  type: FieldType
  label: string
  required: boolean
  options?: string[]
  min?: number
  max?: number
  step?: number
}

export interface PaymentField extends FormField {
  type: "payment"
  currency: string
}

