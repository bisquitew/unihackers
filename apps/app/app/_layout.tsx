import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#09090b',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#09090b',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Timișoara Hub',
          }}
        />
        <Stack.Screen
          name="m/forum/index"
          options={{
            title: 'Comunitate & Forum',
          }}
        />
        <Stack.Screen
          name="m/events/index"
          options={{
            title: 'Evenimente Culturale',
          }}
        />
        <Stack.Screen
          name="m/buddy/index"
          options={{
            title: 'Cu Cine? (Buddy Finder)',
          }}
        />
        <Stack.Screen
          name="m/wallet/index"
          options={{
            title: 'Portofel & Bilete Solana',
          }}
        />
      </Stack>
    </>
  );
}
