import * as React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radii } from './tokens';
import { Text } from './Text';

type FieldProps = Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'maxLength' | 'autoFocus' | 'returnKeyType' | 'onSubmitEditing' | 'autoCapitalize'> & {
  label: string;
};

/** A labelled text field. The label stays visible (never placeholder-only). 16 px text so iOS does not zoom on focus. */
export function Field({ label, ...input }: FieldProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={[styles.field, focused && styles.focused]}>
      <Text variant="caption" color="mutedForeground" style={styles.label}>
        {label}
      </Text>
      <TextInput
        {...input}
        accessibilityLabel={label}
        placeholderTextColor={colors.mutedForeground}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { minHeight: 60, borderRadius: radii.input, backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, boxShadow: 'inset 0 1px 2px rgba(26,16,51,0.07), 0 0 0 1px rgba(26,16,51,0.05)' } as any,
  focused: { boxShadow: '0 0 0 2.5px #1A1033' } as any,
  label: { fontFamily: fonts.ui600 },
  input: { fontFamily: fonts.ui600, fontSize: 16, lineHeight: 22, color: colors.foreground, padding: 0, outlineStyle: 'none' } as any,
});
