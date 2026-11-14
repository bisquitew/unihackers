import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useEngineBridge, type CityMapProps, type FromEngine, type ToEngine } from './bridge';
import { ENGINE_HTML } from './engine.generated';

/** Phones: the engine runs inside a WebView. Same props and behaviour as the web version (CityMap.tsx). */
export function CityMap(props: CityMapProps & { style?: React.ComponentProps<typeof View>['style'] }) {
  const webview = React.useRef<WebView>(null);

  const post = React.useCallback((message: ToEngine) => {
    const payload = JSON.stringify(JSON.stringify(message));
    webview.current?.injectJavaScript(`window.__hubMap && window.__hubMap.receive(${payload}); true;`);
  }, []);

  const { handleMessage } = useEngineBridge(props, post);

  const onMessage = React.useCallback(
    (event: WebViewMessageEvent) => {
      try {
        handleMessage(JSON.parse(event.nativeEvent.data) as FromEngine);
      } catch {
        /* ignore malformed messages */
      }
    },
    [handleMessage],
  );

  return (
    <View style={[styles.fill, props.style]}>
      <WebView
        ref={webview}
        // baseUrl gives the page a real origin so the CDN and tile requests are normal cross-origin fetches
        source={{ html: ENGINE_HTML, baseUrl: 'https://hop.local/' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        automaticallyAdjustContentInsets={false}
        onMessage={onMessage}
        style={styles.fill}
        accessibilityLabel="City map of Timișoara"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#F0ECF7' },
});
