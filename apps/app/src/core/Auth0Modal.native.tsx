import React, { useRef } from 'react';
import { Modal, SafeAreaView, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { TextButton, colors } from '@hub/ui';

export interface Auth0ModalProps {
  visible: boolean;
  authUrl: string;
  onSuccess: (token: string, hint?: { name?: string; email?: string; picture?: string }) => void;
  onClose: () => void;
}

function parseJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function Auth0Modal({ visible, authUrl, onSuccess, onClose }: Auth0ModalProps) {
  const handledRef = useRef(false);

  if (!visible || !authUrl) {
    handledRef.current = false;
    return null;
  }

  const handleIntercept = (url: string): boolean => {
    if (!url || handledRef.current) return false;

    if (url.includes('access_token=') || url.includes('id_token=')) {
      handledRef.current = true;
      const hash = url.split('#')[1] || url.split('?')[1] || '';
      const params = new URLSearchParams(hash);
      const idToken = params.get('id_token') || '';
      const accessToken = params.get('access_token') || '';
      const token = accessToken || idToken;

      let hint: { name?: string; email?: string; picture?: string } | undefined;
      if (idToken) {
        const claims = parseJwt(idToken);
        if (claims) {
          hint = {
            name: claims.name || claims.nickname,
            email: claims.email,
            picture: claims.picture
          };
        }
      }

      if (token) {
        onSuccess(token, hint);
        return true;
      }
    }
    return false;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TextButton label="Cancel" onPress={onClose} />
        </View>
        <WebView
          source={{ uri: authUrl }}
          incognito={true}
          userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          onShouldStartLoadWithRequest={(request) => {
            if (handleIntercept(request.url)) {
              return false; // Stop WebView from navigating to localhost:8081
            }
            return true;
          }}
          onNavigationStateChange={(navState) => {
            handleIntercept(navState.url);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            if (nativeEvent?.url) {
              handleIntercept(nativeEvent.url);
            }
          }}
          startInLoadingState={true}
          style={styles.webview}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { height: 48, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 16 },
  webview: { flex: 1 },
});
