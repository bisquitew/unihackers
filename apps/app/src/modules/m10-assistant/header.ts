// Header for the assistant's dark screen. The root layout hides headers by default (P1's light
// design), so without this the screen has no title and no back button on native.
export function darkHeader(title: string) {
  return {
    title,
    headerShown: true,
    headerStyle: { backgroundColor: '#09090b' },
    headerTintColor: '#ffffff',
    headerTitleStyle: { fontWeight: 'bold' as const },
    contentStyle: { backgroundColor: '#09090b' },
  };
}
