// Header for P4's dark screens. The root layout hides headers by default (P1's light design),
// so without this the screens have no title and no back button on native.
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
