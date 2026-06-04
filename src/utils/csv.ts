import { FormField } from "~/types/form";
import { FormRow, SubmissionRow } from "~/types/tables";


export function compileCSV(formFields: FormField[], submissions: SubmissionRow[], includeTimestamp?: boolean): string {
    // Construct CSV headers from form schema definition
    const headers = [
        'Submission UUIDv7',
        'User ID',
        ...(!includeTimestamp ? [] : ['Timestamp']),
        ...formFields.map((f: any) => `"${(f.displayLabel || 'Untitled Question').replace(/"/g, '""')}"`),
    ]
    // Compile the CSV string payload
    const rowMatrix = [headers.join(',')]
    for (const submission of submissions) {
        const responses = JSON.parse(submission.answers_json || '{}')
        // Use the unique machineSlug to pull the correct answer from the JSON without including slug in CSV output
        const matchingRow = [
            `"${submission.id}"`,
            `"${submission.user_id}"`,
            ...(!includeTimestamp ? [] : [`"${new Date(submission.submitted_at * 1000).toISOString()}"`]),
            ...formFields.map(
                (f: any) => `"${String(responses[f.machineSlug] ?? '').replace(/"/g, '""')}"`
            ),
        ]
        rowMatrix.push(matchingRow.join(','))
    }
    return rowMatrix.join('\n');
}

export function nameCSV(formName: string) {
    return `submissions_${formName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString()}.csv`
}