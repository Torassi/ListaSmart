import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import type {
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
} from 'react-native-webview/lib/WebViewTypes';

/**
 * Tela única: WebView em tela cheia carregando o mesmo front-end React servido
 * pelo Vite. As chamadas de API são feitas para /api na MESMA origem (proxy do
 * Vite → FastAPI), então cookies de sessão (httpOnly) e CSRF funcionam sem uma
 * segunda autenticação no app.
 *
 * A URL vem de EXPO_PUBLIC_WEB_URL (mobile/.env); o IP da LAN é só fallback.
 */
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://10.1.1.196:5173';

export default function HomeScreen() {
  const webRef = useRef<WebView>(null);
  const [errored, setErrored] = useState(false);

  const reload = useCallback(() => {
    setErrored(false);
    webRef.current?.reload();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="auto" />

      {errored ? (
        <View style={styles.center}>
          <Text style={styles.title}>Não foi possível carregar o ListaSmart</Text>
          <Text style={styles.subtitle}>
            Verifique se o servidor web está rodando em {WEB_URL} e se o iPhone está
            na mesma rede Wi‑Fi do computador.
          </Text>
          <Pressable style={styles.button} onPress={reload} accessibilityRole="button">
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          ref={webRef}
          source={{ uri: WEB_URL }}
          originWhitelist={['http://*', 'https://*']}
          // Mantém a sessão do navegador: cookie httpOnly de sessão + cookie CSRF
          // são preservados entre navegações. Sem segunda autenticação no mobile.
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          domStorageEnabled
          javaScriptEnabled
          startInLoadingState
          pullToRefreshEnabled
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#0E9F6E" />
            </View>
          )}
          // Falha ao carregar a PÁGINA (rede/host indisponível): mostra a tela
          // amigável. Erros HTTP de chamadas /api (ex.: 401 antes do login) são
          // tratados pelo próprio app e não derrubam a WebView.
          onError={(e: WebViewErrorEvent) => {
            console.warn('WebView load error:', e.nativeEvent.description);
            setErrored(true);
          }}
          onHttpError={(e: WebViewHttpErrorEvent) => {
            console.warn('WebView HTTP error:', e.nativeEvent.statusCode, e.nativeEvent.url);
          }}
          onRenderProcessGone={() => setErrored(true)}
          style={styles.webview}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E141F' },
  webview: { flex: 1, backgroundColor: '#0E141F' },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#0E141F',
  },
  title: { color: '#EEF2F7', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#AAB4C4', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  button: {
    marginTop: 8,
    backgroundColor: '#0E9F6E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
