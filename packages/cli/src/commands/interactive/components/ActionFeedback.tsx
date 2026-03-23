import { Box, Text } from 'ink'
import { Dots } from '../../../components/Dots'

export function ActionFeedback({
  executing,
  done,
  error
}: {
  executing: boolean
  done: boolean
  error: string | null
}) {
  return (
    <Box marginTop={1} minHeight={1}>
      {executing ? (
        <Box marginLeft={2}>
          <Text dimColor>
            <Dots />
          </Text>
        </Box>
      ) : (
        <>
          {done && <Text color="green">✓ Done</Text>}
          {error && <Text color="red">✗ {error}</Text>}
        </>
      )}
    </Box>
  )
}
