import { Stack } from 'expo-router'

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="skills/[id]" options={{ title: 'Skill Detail' }} />
      <Stack.Screen name="skills/new" options={{ title: 'New Skill' }} />
      <Stack.Screen name="skills/edit/[id]" options={{ title: 'Edit Skill' }} />
      <Stack.Screen name="skills/request/[id]" options={{ title: 'Request Skill' }} />
      <Stack.Screen name="users/[id]" options={{ title: 'Profile' }} />
      <Stack.Screen name="my-skills" options={{ title: 'My Skills' }} />
      <Stack.Screen name="profile/edit" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="chat" options={{ title: 'AI Chat' }} />
      <Stack.Screen name="radar" options={{ title: 'Neighborhood Radar' }} />
      <Stack.Screen name="events/index" options={{ title: 'Events' }} />
      <Stack.Screen name="events/[id]"  options={{ title: 'Event Detail' }} />
      <Stack.Screen name="events/new"   options={{ title: 'New Event' }} />
      <Stack.Screen name="drives/index" options={{ title: 'Drives' }} />
      <Stack.Screen name="drives/[id]"  options={{ title: 'Drive Detail' }} />
      <Stack.Screen name="drives/new"   options={{ title: 'New Drive' }} />
    </Stack>
  )
}