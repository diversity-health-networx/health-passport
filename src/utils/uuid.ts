import { uuid_generate_v7 as uuidv7, uuid_decode_v7 as uuidv7obj } from 'uuidv7-isomorphic'

/**
 * Generates a standard UUIDv7 format string token
 */
export function generateId(): string {
  return uuidv7()
}

/**
 * Extracts the embedded millisecond UNIX timestamp from a valid UUIDv7 token
 * @param id standard 36-character UUIDv7 string payload
 */
export function extractTimestampFromUUIDv7(id: string): number {
  try {
    const parsedObj = uuidv7obj(id)
    // uuidv7-isomorphic returns structural object containing internal timestamp components
    return Math.floor(parsedObj.timestamp / 1000)
  } catch (error) {
    console.error('Failed to decode token sequence timestamp:', error)
    return Math.floor(Date.now() / 1000)
  }
}