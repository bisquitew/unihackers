import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { getCity } from './city';
import { useEngineBridge, type CityMapProps, type FromEngine, type ToEngine } from './bridge';
import { ENGINE_HTML } from './engine.generated';

/** Web (and the default): the engine runs in an iframe. Phones use CityMap.native.tsx with a WebView; props are identical. */
export function CityMap(props: CityMapProps & { style?: React.ComponentProps<typeof View>['style'] }) {
  const frame = React.useRef<HTMLIFrameElement | null>(null);

  const post = React.useCallback((message: ToEngine) => {
    frame.current?.contentWindow?.postMessage({ hubMapCmd: message }, '*');
  }, []);

  const { handleMessage } = useEngineBridge(props, post);

  React.useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data as { hubMap?: boolean; msg?: FromEngine } | undefined;
      if (data?.hubMap && data.msg) handleMessage(data.msg);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [handleMessage]);

  return (
    <View style={[styles.fill, props.style]}>
      {React.createElement('iframe', {
        ref: frame,
        srcDoc: ENGINE_HTML,
        title: `City map of ${getCity().name}`,
        style: { border: 0, width: '100%', height: '100%', display: 'block' },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#F0ECF7' },
});
