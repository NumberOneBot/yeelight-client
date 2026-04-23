import { Newline, Text } from 'ink'

const lanHint = ' Make sure LAN Control is enabled.'

export function ErrorText({ message }: { message: string }) {
  const hintIdx = message.indexOf(lanHint)
  if (hintIdx === -1)
    return (
      <Text color="red">
        <Newline />
        {message}
      </Text>
    )
  return (
    <Text>
      <Newline />
      <Text color="red">{message.slice(0, hintIdx)}</Text>
      {' Make sure '}
      <Text bold>LAN Control</Text>
      {' is enabled.'}
    </Text>
  )
}
