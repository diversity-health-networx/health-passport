import { UUIDv7 } from "uuidv7-isomorphic";

export interface FormRow {
  id: string & UUIDv7;                     // UUIDv7
  name: string;                   // Unique form name
  user_id_format: string;         // Format for identifying users
  allow_overwrite: number;        // 0 or 1 (SQLite boolean)
  submissions_expiry: number | null; // Nullable UNIX timestamp
  questions_json: string;         // JSON string
  created_at: number;             // UNIX timestamp
}

export interface SubmissionRow {
  id: string & UUIDv7;              // UUIDv7
  form_id: string;         // FK to forms.id
  form_name: string;       // Cached form name
  user_id: string;         // User identifier
  answers_json: string;    // JSON string of answers
  submitted_at: number;    // UNIX timestamp (epoch seconds)
}

export interface GlobalSettingRow {
  key: string;     // Primary key
  value: string;   // Stored as TEXT
}