import { uuid_decode_v7, UUIDv7} from 'uuidv7-isomorphic'
/**
 * Extracts the embedded millisecond UNIX timestamp from a valid UUIDv7 token
 * @param id standard 36-character UUIDv7 string payload
 */
export function extractTimestampFromUUIDv7(id: UUIDv7): number {
  try {
    const ms = uuid_decode_v7(id)
    // uuidv7-isomorphic returns milliseconds
    return Math.floor(ms / 1000)
  } catch (error) {
    console.error('Failed to decode token sequence timestamp:', error)
    return Math.floor(Date.now() / 1000)
  }
}