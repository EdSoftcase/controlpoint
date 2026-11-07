import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  Download,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  Info,
  Camera,
  MapPin,
  FileCode
} from 'lucide-react';
import { dispararDownloadTexto } from '../utils/erpExporters';

export function ModuloAppMobileKiosk() {
  const [copiado, setCopiado] = useState(false);
  const [guiaSelecionado, setGuiaSelecionado] = useState<'APK_DIRETO' | 'KIOSK_TABLET' | 'PLAY_STORE'>('APK_DIRETO');

  const capacitorConfigCode = `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.controlpoint.app',
  appName: 'Control Point',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#090d16',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#090d16'
    }
  }
};

export default config;`;

  const androidManifestCode = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="br.com.controlpoint.app">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Control Point"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="Control Point"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

    <!-- Permissões Oficiais para REP-P e Reconhecimento Facial -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.camera" android:required="true" />
</manifest>`;

  const handleCopiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleBaixarManifest = () => {
    dispararDownloadTexto('AndroidManifest.xml', androidManifestCode, 'application/xml');
  };

  const handleBaixarConfig = () => {
    dispararDownloadTexto('capacitor.config.ts', capacitorConfigCode, 'text/typescript');
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Smartphone className="w-4 h-4" />
              Empacotamento Mobile & Kiosk Totem
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Control Point para Celulares e Tablets</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Configuração nativa via Capacitor com pacote oficial <strong>br.com.controlpoint.app</strong>. Pronto para instalação direta via APK ou publicação nas lojas Google Play Store e Apple App Store.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Capacitor 7.x Configurado
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Cartões de Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Identificador do Aplicativo</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-mono text-sm font-bold text-white">br.com.controlpoint.app</div>
          <div className="text-[11px] text-slate-400">Nome Oficial: <strong>Control Point</strong></div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Permissões Nativas de Hardware</span>
            <Camera className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Câmera Facial + GPS Geofencing
          </div>
          <div className="text-[11px] text-slate-400">Mapeadas no AndroidManifest e Info.plist</div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Modo Totem / Kiosk Tablet</span>
            <Tablet className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
            <Lock className="w-4 h-4" /> Tela Cheia com Bloqueio de Saída
          </div>
          <div className="text-[11px] text-slate-400">Ideal para tablets na parede da recepção</div>
        </div>
      </div>

      {/* Seletor de Guias Práticos */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
        <div className="flex items-center gap-2 p-1 bg-slate-800/80 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setGuiaSelecionado('APK_DIRETO')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              guiaSelecionado === 'APK_DIRETO'
                ? 'bg-indigo-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            1. Instalação Direta via APK (Tablet / Celular)
          </button>
          <button
            onClick={() => setGuiaSelecionado('KIOSK_TABLET')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              guiaSelecionado === 'KIOSK_TABLET'
                ? 'bg-indigo-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            2. Modo Totem Kiosk (Tablet Fixo na Parede)
          </button>
          <button
            onClick={() => setGuiaSelecionado('PLAY_STORE')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              guiaSelecionado === 'PLAY_STORE'
                ? 'bg-indigo-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            3. Publicação Google Play & App Store
          </button>
        </div>

        {/* Conteúdo do Guia 1: APK Direto */}
        {guiaSelecionado === 'APK_DIRETO' && (
          <div className="space-y-4 text-xs text-slate-300">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" />
              Como compilar e instalar o APK do Control Point no Tablet ou Celular
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-1">
                <span className="font-bold text-white block">Passo 1: Gerar a Pasta Nativa</span>
                <p className="text-[11px] text-slate-400">
                  No terminal do projeto, execute <code>npx cap add android</code> e em seguida <code>npx cap sync</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-1">
                <span className="font-bold text-white block">Passo 2: Compilar o APK</span>
                <p className="text-[11px] text-slate-400">
                  Abra no Android Studio ou rode <code>./gradlew assembleDebug</code> na pasta android para gerar o <code>controlpoint.apk</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-1">
                <span className="font-bold text-white block">Passo 3: Instalar no Aparelho</span>
                <p className="text-[11px] text-slate-400">
                  Envie o arquivo APK para o tablet ou celular corporativo e clique para instalar.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={handleBaixarConfig}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-md active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar capacitor.config.ts
              </button>
              <button
                onClick={handleBaixarManifest}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all border border-slate-700 active:scale-95"
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                Baixar AndroidManifest.xml
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo do Guia 2: Modo Totem Kiosk */}
        {guiaSelecionado === 'KIOSK_TABLET' && (
          <div className="space-y-4 text-xs text-slate-300">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-400" />
              Configuração do Tablet Fixo de Parede (Totem REP-P)
            </h4>

            <p className="leading-relaxed text-slate-300">
              Para tablets fixados na recepção ou entrada da fábrica, o objetivo é que nenhum colaborador consiga sair da tela de ponto, usar o navegador ou desativar o aplicativo.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-1">
                <strong className="text-white">Opção A: Fixação de Tela Nativa do Android (App Pinning / Bloqueio de App)</strong>
                <p className="text-[11px] text-slate-400">
                  No Android: Vá em <em>Configurações ➔ Segurança ➔ Fixação de Aplicativo (Pin App)</em>. Abra o <strong>Control Point</strong> e fixe a tela. Para sair, exige a senha de PIN do administrador da empresa.
                </p>
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-1">
                <strong className="text-white">Opção B: Aplicativo Kiosk Launcher (Fully Kiosk Browser)</strong>
                <p className="text-[11px] text-slate-400">
                  Instale o <em>Fully Kiosk</em> no tablet Android e aponte para a URL do Control Point. Ele desativa botões físicos de volume/ligar, mantém a tela acesa 24 horas ligada na tomada e reinicia o app sozinho se o tablet reiniciar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo do Guia 3: Lojas Oficiais */}
        {guiaSelecionado === 'PLAY_STORE' && (
          <div className="space-y-4 text-xs text-slate-300">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              Checklist de Publicação na Google Play Store e Apple App Store
            </h4>

            <ul className="space-y-2 list-disc list-inside text-slate-300">
              <li><strong>Conta Google Play Console</strong>: Taxa única de US$ 25 (vitalícia). Envio do arquivo <code>.aab</code> (Android App Bundle).</li>
              <li><strong>Conta Apple Developer Program</strong>: Anuidade de US$ 99/ano. Envio do arquivo <code>.ipa</code> via Xcode.</li>
              <li><strong>Política de Privacidade</strong>: Documento que descreve que a biometria facial é utilizada exclusivamente para registro de ponto do empregado conforme a Portaria MTP 671/2021 e LGPD.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Caixa de Código de Exemplo */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-mono text-indigo-400 font-bold">capacitor.config.ts</span>
          <button
            onClick={() => handleCopiar(capacitorConfigCode)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiado ? 'Copiado!' : 'Copiar Configuração'}</span>
          </button>
        </div>
        <pre className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-emerald-400/90 overflow-x-auto">
          {capacitorConfigCode}
        </pre>
      </div>
    </div>
  );
}
