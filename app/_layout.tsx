import { Stack } from "expo-router";

export default function RootLayout() {
  return ( 
    <Stack>
      <Stack.Screen name="(tabs)/index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)/main_menu" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)/agent_records_update" options={{ headerShown: false }} />
    </Stack>
  
  );
}
