import { Stack } from 'expo-router'

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Skills' }} />
      <Stack.Screen name="skills/[id]" options={{ title: 'Skill Detail' }} />
      <Stack.Screen name="my-requests" options={{ title: 'My Requests' }} />
    </Stack>
  )
}
