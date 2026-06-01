export type QuestionType = 'likert' | 'scale_1_10' | 'text' | 'numerical' | 'boolean'
export type TextRegexFormat = 'email' | 'phone' | 'custom'

export interface FormFieldSettings {
  required: boolean
  // Configuration parameters specific to 'text' types
  minLength?: number
  maxLength?: number
  regexType?: TextRegexFormat
  customRegexPattern?: string
  qrScanPopulate?: boolean // Toggles QR code capture button visibility
  // Dynamic Query String tracking configuration parameters
  autoPopulateFromUrl?: boolean
  targetQueryParameterName?: string
}

export interface FormField {
  id: string // Internal standard component identifier
  machineSlug: string // Database processing column layout mapping target
  displayLabel: string // Rendered description text
  fieldType: QuestionType
  metaSettings: FormFieldSettings
}

export interface DynamicFormSchema {
  id: string // Generated using UUIDv7
  formName: string // Friendly access route reference slug
  userIdConstraint: 'user_id' // User identification format
  allowOverwrite?: boolean
  submissionsExpiry?: number | null // UNIX timestamp for expiry
  fieldCollection: FormField[]
}