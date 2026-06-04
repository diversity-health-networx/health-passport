export type QuestionType = 'likert' | 'scale_1_10' | 'text' | 'numerical' | 'boolean'
export type TextRegexFormat = 'email' | 'phone' | 'custom'

export interface FormTableColumns {
  id: string;                 // UUIDv7
  name: string;               // Unique form name
  user_id_format: string;     // Format string for identifying users
  allow_overwrite: number;    // 0 or 1 (SQLite has no boolean type)
  submissions_expiry: number | null; // Nullable UNIX timestamp
  questions_json: string;     // JSON string
  created_at: number;         // UNIX timestamp
}


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

export interface SubmissionRequestBody {
  formId: string
  userId: string
  formName: string
  answers: unknown
}

export interface SubmissionResponse {
  id: string
  userId: string
  submittedAt: number
  fields: FormField[]
  answers: Record<string, any>
}