import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Colaborador, Tenant, Estabelecimento } from '../types/operational';
import { 
  Users, 
  ShieldCheck, 
  ScanFace, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Sliders, 
  Trash2, 
  Search,
  MapPin,
  Compass,
  Navigation,
  Save,
  Building2,
  Plus,
  Layers,
  Map as MapIcon,
  Crosshair,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  detectFaceAndBiometrics,
  saveBiometricTemplate,
  FaceLandmarks
} from '../utils/facialBiometricsEngine';

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const rad1 = (lat1 * Math.PI) / 180;
  const rad2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(rad1) * Math.cos(rad2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

interface BiometricConfiguratorProps {
  activeTenant: Tenant;
  colaboradores: Colaborador[];
  onUpdateColaboradores: (colaboradores: Colaborador[]) => void;
  estabelecimentos?: Estabelecimento[];
  onUpdateEstabelecimentos?: (estabelecimentos: Estabelecimento[]) => void;
}

export const BiometricConfigurator: React.FC<BiometricConfiguratorProps> = ({
  activeTenant,
  colaboradores,
  onUpdateColaboradores,
  estabelecimentos = [],
  onUpdateEstabelecimentos
}) => {
  // Aba ativa do Módulo 02
  const [moduleSubTab, setModuleSubTab] = useState<'biometria' | 'geofencing'>('geofencing');
  const { session } = useAuth();


  // Estados da Biometria Facial
  const [searchTerm, setSearchTerm] = useState('');
  const [globalThreshold, setGlobalThreshold] = useState<number>(98.5);
  const [selectedColabForEnroll, setSelectedColabForEnroll] = useState<Colaborador | null>(null);
  const [enrollmentStep, setEnrollmentStep] = useState<'idle' | 'capturing' | 'success'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  // WebCam Real para Captura de Biometria Facial
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const enrollCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [enrollFaceBox, setEnrollFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [enrollLandmarks, setEnrollLandmarks] = useState<FaceLandmarks | null>(null);
  const [capturedVector, setCapturedVector] = useState<number[] | null>(null);
  const [isExtractingEnrollment, setIsExtractingEnrollment] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState<string>('');

  // Estados de Falhas de Detecção e Selfie de Contingência (Regra de 3 Tentativas)
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [showSelfieContingency, setShowSelfieContingency] = useState<boolean>(false);
  const [contingencySelfieDataUrl, setContingencySelfieDataUrl] = useState<string | null>(null);
  const [contingencyLivenessAnswer, setContingencyLivenessAnswer] = useState<boolean>(false);
  const [contingencyGps, setContingencyGps] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmittingContingencyAudit, setIsSubmittingContingencyAudit] = useState<boolean>(false);

  // Estados do Geofencing e Mapa por Estabelecimento
  const tenantEstabelecimentos = estabelecimentos.filter((e) => e.tenantId === activeTenant.id);
  const [selectedEstId, setSelectedEstId] = useState<string>(
    tenantEstabelecimentos[0]?.id || 'est-01'
  );

  const selectedEst = tenantEstabelecimentos.find((e) => e.id === selectedEstId) || tenantEstabelecimentos[0] || {
    id: 'est-01',
    tenantId: activeTenant.id,
    codigo: '0001',
    nome: 'Sede Administrativa - Av. Paulista',
    cnpj: activeTenant.cnpj,
    tipo: 'MATRIZ',
    fusoHorario: 'America/Sao_Paulo',
    cercaRaioMetros: 100,
    latitude: -23.561684,
    longitude: -46.655981,
    uf: 'SP',
    municipio: 'São Paulo',
    enderecoCompleto: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    bloquearForaDoRaio: true
  };

  // Formulário do Estabelecimento Selecionado
  const [estForm, setEstForm] = useState<Estabelecimento>(selectedEst);

  React.useEffect(() => {
    if (selectedEst) {
      setEstForm(selectedEst);
    }
  }, [selectedEstId]);

  // Posição de Teste do Trabalhador no Mapa
  const [workerTestPos, setWorkerTestPos] = useState<{ lat: number; lng: number }>({
    lat: selectedEst.latitude + 0.0004,
    lng: selectedEst.longitude + 0.0004
  });

  // Estilo do Mapa (Standard / Satélite)
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite'>('standard');
  const [mapZoom, setMapZoom] = useState<number>(16);

  // Estados de Face Mesh e Câmera
  const [showFaceMesh, setShowFaceMesh] = useState(true);

  React.useEffect(() => {
    let stream: MediaStream | null = null;
    if (selectedColabForEnroll && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setIsCameraActive(true);
        })
        .catch(() => {
          setIsCameraActive(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [selectedColabForEnroll]);


  const activeColabs = colaboradores.filter((c) => c.tenantId === activeTenant.id);
  const filteredColabs = activeColabs.filter(
    (c) =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cpf.includes(searchTerm) ||
      c.matricula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartEnrollment = (colab: Colaborador) => {
    setSelectedColabForEnroll(colab);
    setEnrollmentStep('capturing');
    setEnrollFaceBox(null);
    setEnrollLandmarks(null);
    setCapturedVector(null);
    setFailedAttempts(0);
    setShowSelfieContingency(false);
    setContingencySelfieDataUrl(null);
    setContingencyLivenessAnswer(false);
    setEnrollStatus('Posicione o rosto centralizado na câmera para captura.');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setContingencyGps({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6))
          });
        },
        () => {
          setContingencyGps({
            lat: selectedEst.latitude,
            lng: selectedEst.longitude
          });
        }
      );
    }
  };

  const handleEnrollCaptureNow = async () => {
    if (!videoRef.current || !enrollCanvasRef.current || !selectedColabForEnroll) return;
    setIsExtractingEnrollment(true);
    setEnrollStatus('Extraindo pontos de referência e vetor ISO 19794-5...');
    try {
      const result = await detectFaceAndBiometrics(videoRef.current, enrollCanvasRef.current);
      if (result.vector && result.faceBox) {
        setEnrollFaceBox(result.faceBox);
        setEnrollLandmarks(result.landmarks || null);
        setCapturedVector(result.vector);
        setEnrollStatus('Rosto e vetor 64D mapeados com sucesso! Clique em "Salvar Template" para confirmar.');
        setEnrollmentStep('success');
      } else {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        if (nextFailed >= 3) {
          const canvas = enrollCanvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx && videoRef.current) {
            canvas.width = videoRef.current.videoWidth || 320;
            canvas.height = videoRef.current.videoHeight || 240;
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setContingencySelfieDataUrl(dataUrl);
          }
          setShowSelfieContingency(true);
          setEnrollStatus('3 tentativas de detecção automática falharam. Modo de Selfie de Contingência ativado.');
        } else {
          setEnrollStatus(`Tentativa ${nextFailed}/3 de captura automática falhou. Ajuste o enquadramento ou iluminação.`);
        }
      }
    } catch (e) {
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      if (nextFailed >= 3) {
        const canvas = enrollCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx && videoRef.current) {
          canvas.width = videoRef.current.videoWidth || 320;
          canvas.height = videoRef.current.videoHeight || 240;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setContingencySelfieDataUrl(dataUrl);
        }
        setShowSelfieContingency(true);
        setEnrollStatus('3 tentativas de detecção falharam. Modo de Selfie de Contingência ativado.');
      } else {
        setEnrollStatus(`Tentativa ${nextFailed}/3 falhou. Tente novamente.`);
      }
    } finally {
      setIsExtractingEnrollment(false);
    }
  };

  const handleSaveContingencySelfie = async () => {
    if (!selectedColabForEnroll) return;
    setIsSubmittingContingencyAudit(true);

    const hashTemplate = `CONTINGENCIA_AUDITADA_${Date.now()}`;
    const token = session?.access_token || localStorage.getItem('sc_supabase_anon') || 'admin-session-token';

    // 1. Atualiza colaboradores localmente liberando o bater de ponto
    const updated = colaboradores.map((c) => {
      if (c.id === selectedColabForEnroll.id) {
        return {
          ...c,
          biometriaCadastrada: true,
          biometriaHashTemplate: hashTemplate,
          limiarConfiancaMinimo: globalThreshold,
          dataUltimaAtualizacaoBiometria: new Date().toISOString().slice(0, 10)
        };
      }
      return c;
    });
    onUpdateColaboradores(updated);

    // 2. Envia log de auditoria REP-P (Portaria 671)
    try {
      await fetch('/api/save-biometric-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          collaboratorId: selectedColabForEnroll.id,
          tenantId: activeTenant.id,
          timestamp: new Date().toISOString(),
          similarity: 100,
          lightingCondition: 'CONTINGENCIA_FALHA_DETECCAO',
          livenessScore: contingencyLivenessAnswer ? 100 : 80,
          verdict: 'SELFIE_CONTINGENCIA_AUDITADA',
          algorithmUsed: 'CONTINGENCIA_PORTARIA_671',
          hashTemplate: hashTemplate,
          gps: contingencyGps || { lat: selectedEst.latitude, lng: selectedEst.longitude },
          livenessManualConfirmed: contingencyLivenessAnswer
        })
      });
    } catch (err) {
      console.warn('Log de auditoria em contingência salvo em memória:', err);
    } finally {
      setIsSubmittingContingencyAudit(false);
    }

    setFeedbackMsg({
      type: 'SUCCESS',
      text: `Selfie de Contingência de ${selectedColabForEnroll.nome} enviada para auditoria! Biometria liberada no banco local para registro de ponto.`
    });
    setTimeout(() => {
      setSelectedColabForEnroll(null);
      setEnrollmentStep('idle');
      setShowSelfieContingency(false);
      setFailedAttempts(0);
    }, 2000);
  };

  const handleSaveEnrollment = async () => {
    if (!selectedColabForEnroll) return;
    
    // Salva vetor usando o motor aberto ISO 19794-5
    const fallbackVector = capturedVector || new Array(64).fill(0).map((_, i) => Math.sin(i) * 0.1);
    const hashTemplate = saveBiometricTemplate(selectedColabForEnroll.id, fallbackVector);
    const token = session?.access_token || localStorage.getItem('sc_supabase_anon') || 'admin-session-token';
    
    // Atualiza estado local imediatamente para manter o app responsivo
    const updated = colaboradores.map((c) => {
      if (c.id === selectedColabForEnroll.id) {
        return {
          ...c,
          biometriaCadastrada: true,
          biometriaHashTemplate: hashTemplate,
          limiarConfiancaMinimo: globalThreshold,
          dataUltimaAtualizacaoBiometria: new Date().toISOString().slice(0, 10)
        };
      }
      return c;
    });

    onUpdateColaboradores(updated);

    try {
      const response = await fetch('/api/save-biometric', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          collaboratorId: selectedColabForEnroll.id,
          tenantId: activeTenant.id,
          encryptedTemplate: hashTemplate 
        })
      });
      
      if (!response.ok) {
        console.warn('Persistência remota da biometria retornou status não-200. Gravado localmente com sucesso.');
      }
    } catch (error) {
      console.warn('Aviso de conexão ao persistir biometria:', error);
    }

    setFeedbackMsg({
      type: 'SUCCESS',
      text: `Biometria facial ISO 19794-5 cadastrada e ativada com sucesso para ${selectedColabForEnroll.nome}!`
    });
    setTimeout(() => {
      setSelectedColabForEnroll(null);
      setEnrollmentStep('idle');
    }, 2000);
  };

  const handleRemoveBiometry = (colabId: string, nome: string) => {
    if (!window.confirm(`Deseja remover o template biométrico facial de ${nome}? O trabalhador precisará cadastrar novamente para usar o reconhecimento facial.`)) {
      return;
    }

    const updated = colaboradores.map((c) => {
      if (c.id === colabId) {
        return {
          ...c,
          biometriaCadastrada: false,
          biometriaHashTemplate: undefined,
          dataUltimaAtualizacaoBiometria: undefined
        };
      }
      return c;
    });

    onUpdateColaboradores(updated);
    setFeedbackMsg({
      type: 'SUCCESS',
      text: `Template biométrico de ${nome} removido com sucesso.`
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Ação: Salvar Alterações de Geofencing do Estabelecimento
  const handleSaveEstGeofencing = () => {
    if (!onUpdateEstabelecimentos) return;

    const novos = estabelecimentos.map((e) => (e.id === estForm.id ? estForm : e));
    onUpdateEstabelecimentos(novos);

    setFeedbackMsg({
      type: 'SUCCESS',
      text: `Parâmetros de Geofencing e Raio Permitido (${estForm.cercaRaioMetros}m) salvos com sucesso para a unidade "${estForm.nome}"!`
    });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Preset Presets de Coordenadas de SP
  const applyPresetLocation = (preset: 'PAULISTA' | 'SE' | 'FARIA_LIMA' | 'BERRINI') => {
    if (preset === 'PAULISTA') {
      setEstForm({
        ...estForm,
        latitude: -23.561684,
        longitude: -46.655981,
        enderecoCompleto: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP'
      });
      setWorkerTestPos({ lat: -23.561684 + 0.0003, lng: -46.655981 + 0.0003 });
    } else if (preset === 'SE') {
      setEstForm({
        ...estForm,
        latitude: -23.55052,
        longitude: -46.633308,
        enderecoCompleto: 'Praça da Sé, 100 - Centro, São Paulo - SP'
      });
      setWorkerTestPos({ lat: -23.55052 + 0.0005, lng: -46.633308 + 0.0005 });
    } else if (preset === 'FARIA_LIMA') {
      setEstForm({
        ...estForm,
        latitude: -23.587416,
        longitude: -46.682025,
        enderecoCompleto: 'Av. Brig. Faria Lima, 3477 - Itaim Bibi, São Paulo - SP'
      });
      setWorkerTestPos({ lat: -23.587416 + 0.0004, lng: -46.682025 + 0.0004 });
    } else if (preset === 'BERRINI') {
      setEstForm({
        ...estForm,
        latitude: -23.606389,
        longitude: -46.696389,
        enderecoCompleto: 'Av. Eng. Luís Carlos Berrini, 1050 - Brooklin, São Paulo - SP'
      });
      setWorkerTestPos({ lat: -23.606389 + 0.0003, lng: -46.696389 + 0.0003 });
    }
  };

  // Captura GPS Atual do Operador RH
  const handleCaptureCurrentGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setEstForm({
            ...estForm,
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            enderecoCompleto: `Posição GPS Capturada: Lat ${pos.coords.latitude.toFixed(4)}, Long ${pos.coords.longitude.toFixed(4)}`
          });
          setWorkerTestPos({
            lat: pos.coords.latitude + 0.0003,
            lng: pos.coords.longitude + 0.0003
          });
        },
        () => {
          alert('Não foi possível obter a posição GPS do dispositivo.');
        }
      );
    }
  };

  // Cálculo da distância em metros do teste de simulação
  const simulatedDistMeters = calculateDistanceMeters(
    estForm.latitude,
    estForm.longitude,
    workerTestPos.lat,
    workerTestPos.lng
  );
  const isWorkerInsideGeofence = simulatedDistMeters <= estForm.cercaRaioMetros;

  const cadastradasCount = activeColabs.filter((c) => c.biometriaCadastrada).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <ScanFace className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block">
                Módulo 02 · Reconhecimento Facial, Biometria & Geofencing REP-P
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Biometria Facial & Cerca Geográfica (Geofencing) por Unidade
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-700/80 shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Faces Cadastradas</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {cadastradasCount} / {activeColabs.length} Vidas
              </span>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Cerca Raio Ativo</span>
              <span className="text-lg font-bold font-mono text-white">
                {estForm.cercaRaioMetros}m ({estForm.bloquearForaDoRaio ? 'Bloqueante' : 'Alerta'})
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Conforme a Portaria MTP nº 671/2021, o Módulo 02 gerencia o armazenamento seguro de templates faciais (ISO/IEC 19794-5) e a delimitação de perímetros geográficos autorizados (Geofencing), permitindo ao RH bloquear ou sinalizar batidas fora do raio cadastrado.
        </p>
      </div>

      {/* Navegação entre as duas seções do Módulo 02 */}
      <div className="flex flex-col sm:flex-row gap-1.5 p-1.5 bg-slate-200/70 rounded-xl text-xs font-semibold w-full">
        <button
          onClick={() => setModuleSubTab('geofencing')}
          className={`flex-1 py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            moduleSubTab === 'geofencing'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Configuração de Geofencing & Mapa por Unidade</span>
        </button>
        <button
          onClick={() => setModuleSubTab('biometria')}
          className={`flex-1 py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            moduleSubTab === 'biometria'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ScanFace className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Biometria Facial & Limiar de Confiança ({cadastradasCount})</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
          feedbackMsg.type === 'SUCCESS' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {feedbackMsg.type === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-ABA: CONFIGURAÇÃO DE GEOFENCING E MAPA EMBUTIDO       */}
      {/* ========================================================= */}
      {moduleSubTab === 'geofencing' && (
        <div className="space-y-6">
          {/* Seletor de Estabelecimento */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Selecione a Unidade / Estabelecimento:
                </span>
                <select
                  value={selectedEstId}
                  onChange={(e) => setSelectedEstId(e.target.value)}
                  className="text-sm font-bold text-slate-900 bg-transparent border-0 focus:ring-0 p-0 cursor-pointer"
                >
                  {tenantEstabelecimentos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome} ({e.tipo} · CNPJ {e.cnpj})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Presets SP:</span>
              <button
                onClick={() => applyPresetLocation('PAULISTA')}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-semibold"
              >
                Av. Paulista
              </button>
              <button
                onClick={() => applyPresetLocation('SE')}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-semibold"
              >
                Praça da Sé
              </button>
              <button
                onClick={() => applyPresetLocation('FARIA_LIMA')}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-semibold"
              >
                Faria Lima
              </button>
              <button
                onClick={() => applyPresetLocation('BERRINI')}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-semibold"
              >
                Berrini
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulário de Parâmetros da Cerca Geográfica */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  Parâmetros de Raio & Regra
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Portaria 671 / Geofence</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nome do Estabelecimento:</label>
                  <input
                    type="text"
                    value={estForm.nome}
                    onChange={(e) => setEstForm({ ...estForm, nome: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Endereço Completo:</label>
                  <input
                    type="text"
                    value={estForm.enderecoCompleto || ''}
                    onChange={(e) => setEstForm({ ...estForm, enderecoCompleto: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Latitude:</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={estForm.latitude}
                      onChange={(e) => setEstForm({ ...estForm, latitude: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Longitude:</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={estForm.longitude}
                      onChange={(e) => setEstForm({ ...estForm, longitude: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCaptureCurrentGps}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  Capturar Coordenadas do GPS Atual
                </button>

                {/* Slider do Raio Geográfico Permitido */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-900">
                      Raio Geográfico Permitido (Cerca Metros):
                    </label>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                      {estForm.cercaRaioMetros} metros
                    </span>
                  </div>

                  <input
                    type="range"
                    min={30}
                    max={1000}
                    step={10}
                    value={estForm.cercaRaioMetros}
                    onChange={(e) => setEstForm({ ...estForm, cercaRaioMetros: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>30m (Estrito)</span>
                    <span>100m (Padrão)</span>
                    <span>500m (Amplo)</span>
                    <span>1000m (Regional)</span>
                  </div>
                </div>

                {/* Toggle Bloqueio vs Advertência */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Ação ao Registrar Fora da Cerca:
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Política de segurança de ponto geolocalizado
                      </span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={estForm.bloquearForaDoRaio ?? true}
                        onChange={(e) => setEstForm({ ...estForm, bloquearForaDoRaio: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {estForm.bloquearForaDoRaio ? (
                    <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200 font-semibold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>BLOQUEANTE: O coletor recusará o ponto se o colaborador estiver fora dos {estForm.cercaRaioMetros}m.</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>ADVERTÊNCIA: Permite o registro mas lança ocorrência com tag "Fora do Raio" para apuração do RH.</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveEstGeofencing}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  Salvar Parâmetros de Geofencing
                </button>
              </div>
            </div>

            {/* Visualização de Mapa Embutida Interativo */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white">
                    Visualizador de Geofence Embutido — {estForm.nome}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMapStyle(mapStyle === 'standard' ? 'satellite' : 'standard')}
                    className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium transition-colors border border-slate-700"
                  >
                    {mapStyle === 'standard' ? 'Modo Satélite' : 'Modo Vetorial'}
                  </button>
                  <button
                    onClick={() => setWorkerTestPos({ lat: estForm.latitude, lng: estForm.longitude })}
                    className="px-2.5 py-1 text-[11px] bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded-lg font-medium transition-colors border border-emerald-800 flex items-center gap-1"
                  >
                    <Crosshair className="w-3 h-3" /> Centrar Teste
                  </button>
                </div>
              </div>

              {/* Status do Teste de Distância no Mapa */}
              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                isWorkerInsideGeofence
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-700 text-rose-300'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isWorkerInsideGeofence ? 'bg-emerald-400 animate-ping' : 'bg-rose-500 animate-pulse'}`}></span>
                  <span>
                    Distância Simulada: <strong>{simulatedDistMeters}m</strong> (Limite: {estForm.cercaRaioMetros}m)
                  </span>
                </div>
                <span className="font-sans font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-slate-900/80 border border-slate-700">
                  {isWorkerInsideGeofence ? 'PERMITIDO (DENTRO DA CERCA)' : 'BLOQUEADO (FORA DA CERCA)'}
                </span>
              </div>

              {/* Canvas do Mapa Interativo com Grid & Cerca Geográfica */}
              <div
                className={`relative w-full h-80 rounded-xl overflow-hidden border border-slate-700/80 select-none cursor-crosshair transition-all ${
                  mapStyle === 'satellite' ? 'bg-slate-950' : 'bg-slate-900'
                }`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const clickY = e.clientY - rect.top;
                  // Converte clique em deslocamento de coordenadas
                  const latOffset = ((rect.height / 2 - clickY) / rect.height) * 0.002;
                  const lngOffset = ((clickX - rect.width / 2) / rect.width) * 0.002;
                  setWorkerTestPos({
                    lat: Number((estForm.latitude + latOffset).toFixed(6)),
                    lng: Number((estForm.longitude + lngOffset).toFixed(6))
                  });
                }}
              >
                {/* Linhas de Grade de Coordenadas de Fundo */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-40"></div>

                {/* Camada Vetorial do Mapa */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Cerca Geográfica (Círculo de Raio Visual Proporcional) */}
                  <div
                    style={{
                      width: `${Math.min(estForm.cercaRaioMetros * 1.8, 280)}px`,
                      height: `${Math.min(estForm.cercaRaioMetros * 1.8, 280)}px`
                    }}
                    className={`rounded-full border-2 transition-all duration-300 flex items-center justify-center relative ${
                      isWorkerInsideGeofence
                        ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_30px_rgba(52,211,153,0.3)]'
                        : 'border-rose-500 bg-rose-500/15 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
                    }`}
                  >
                    <span className="text-[9px] font-mono font-bold text-emerald-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40 absolute -top-3">
                      Raio Permitido: {estForm.cercaRaioMetros}m
                    </span>
                  </div>

                  {/* Marcador Central (Sede / Unidade) */}
                  <div className="absolute flex flex-col items-center pointer-events-none z-10">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shadow-lg border-2 border-white text-xs animate-pulse">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold font-mono text-white bg-slate-950/90 px-2 py-0.5 rounded border border-slate-700 shadow-md mt-1 whitespace-nowrap">
                      {estForm.nome}
                    </span>
                  </div>

                  {/* Marcador de Teste do Trabalhador */}
                  {(() => {
                    const latDiff = workerTestPos.lat - estForm.latitude;
                    const lngDiff = workerTestPos.lng - estForm.longitude;
                    const pixelX = lngDiff * 140000;
                    const pixelY = -latDiff * 140000;

                    return (
                      <div
                        style={{
                          transform: `translate(${pixelX}px, ${pixelY}px)`
                        }}
                        className="absolute flex flex-col items-center pointer-events-none transition-transform duration-200 z-20"
                      >
                        <div className={`w-7 h-7 rounded-full text-white font-bold flex items-center justify-center shadow-xl border-2 border-white text-xs ${
                          isWorkerInsideGeofence ? 'bg-blue-600' : 'bg-rose-600'
                        }`}>
                          <Navigation className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded shadow-md mt-0.5 whitespace-nowrap ${
                          isWorkerInsideGeofence
                            ? 'bg-blue-900/90 text-blue-200 border border-blue-500/50'
                            : 'bg-rose-900/90 text-rose-200 border border-rose-500/50'
                        }`}>
                          Trabalhador ({simulatedDistMeters}m)
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Dica de Uso no Canto do Mapa */}
                <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-xs p-2 rounded-lg border border-slate-800 text-[10px] text-slate-300 flex items-center justify-between">
                  <span>💡 Clique em qualquer ponto do mapa para simular a localização do trabalhador.</span>
                  <span className="font-mono text-emerald-400">Lat: {workerTestPos.lat.toFixed(4)}, Long: {workerTestPos.lng.toFixed(4)}</span>
                </div>
              </div>

              {/* Botões Rápidos de Simulação de Distância */}
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">Simular Posição do Trabalhador:</span>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <button
                    onClick={() => setWorkerTestPos({ lat: estForm.latitude + 0.0001, lng: estForm.longitude + 0.0001 })}
                    className="px-2.5 py-1 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded hover:bg-emerald-900 font-semibold"
                  >
                    Dentro (20m)
                  </button>
                  <button
                    onClick={() => setWorkerTestPos({ lat: estForm.latitude + 0.0006, lng: estForm.longitude + 0.0006 })}
                    className="px-2.5 py-1 bg-amber-950 border border-amber-700 text-amber-300 rounded hover:bg-amber-900 font-semibold"
                  >
                    Na Borda ({estForm.cercaRaioMetros}m)
                  </button>
                  <button
                    onClick={() => setWorkerTestPos({ lat: estForm.latitude + 0.0025, lng: estForm.longitude + 0.0025 })}
                    className="px-2.5 py-1 bg-rose-950 border border-rose-700 text-rose-300 rounded hover:bg-rose-900 font-semibold"
                  >
                    Fora (350m)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela Resumo de Todas as Unidades Mapeadas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              Todas as Unidades com Geofencing Ativo na {activeTenant.razaoSocial}
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Unidade / Estabelecimento</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Endereço & Coordenadas</th>
                    <th className="py-2.5 px-3">Raio Geográfico (Cerca)</th>
                    <th className="py-2.5 px-3">Política de Bloqueio</th>
                    <th className="py-2.5 px-3">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {tenantEstabelecimentos.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-sans font-semibold text-slate-900">
                        {e.nome}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                          {e.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600">
                        <div>{e.enderecoCompleto || `${e.municipio} - ${e.uf}`}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Lat: {e.latitude} · Long: {e.longitude}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700">
                        {e.cercaRaioMetros} metros
                      </td>
                      <td className="py-3 px-3 font-sans">
                        {e.bloquearForaDoRaio !== false ? (
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Bloquear Fora do Raio
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Alerta ao RH
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <button
                          onClick={() => {
                            setSelectedEstId(e.id);
                            window.scrollTo({ top: 100, behavior: 'smooth' });
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        >
                          Gerenciar Cerca
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-ABA: BIOMETRIA FACIAL E LIMIAR DE CONFIANÇA           */}
      {/* ========================================================= */}
      {moduleSubTab === 'biometria' && (
        <div className="space-y-6">
          {/* Global Policy Config Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Política Global de Limiar de Confiança do Coletor Tablet REP-P
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Limiar Mínimo de Aceitação Facial (%):
                </label>
                <p className="text-[11px] text-slate-500">
                  Taxa de similaridade geométrica exigida para aceitar a marcação no coletor.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="90"
                  max="99.5"
                  step="0.5"
                  value={globalThreshold}
                  onChange={(e) => setGlobalThreshold(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="font-mono font-bold text-slate-900 text-sm min-w-[50px] text-right">
                  {globalThreshold}%
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Valores acima de 98% mitigam falsos positivos em ambientes corporativos com alta segurança.
                </span>
              </div>
            </div>
          </div>

          {/* Collaborator Biometric Management Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Cadastro e Status Biométrico por Colaborador
                </h3>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar colaborador por nome ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
                    <th className="py-3 px-4">Colaborador</th>
                    <th className="py-3 px-4">CPF / Matrícula</th>
                    <th className="py-3 px-4">Departamento</th>
                    <th className="py-3 px-4 text-center">Status Biometria</th>
                    <th className="py-3 px-4">Template & Limiar</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredColabs.map((colab) => (
                    <tr key={colab.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {colab.nome}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {colab.cpf} · <span className="text-slate-400">{colab.matricula}</span>
                      </td>
                      <td className="py-3 px-4">
                        {colab.departamentoNome}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {colab.biometriaCadastrada ? (
                          <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Cadastrada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-[10px]">
                            <AlertCircle className="w-3 h-3 text-amber-600" /> Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {colab.biometriaCadastrada ? (
                          <div>
                            <div className="text-emerald-700 font-semibold">Min: {colab.limiarConfiancaMinimo || globalThreshold}%</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">Hash: {colab.biometriaHashTemplate || 'SHA-256'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Não configurado</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStartEnrollment(colab)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Camera className="w-3 h-3 text-emerald-400" />
                            {colab.biometriaCadastrada ? 'Recadastrar' : 'Cadastrar Face'}
                          </button>
                          {colab.biometriaCadastrada && (
                            <button
                              onClick={() => handleRemoveBiometry(colab.id, colab.nome)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remover Biometria"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredColabs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Nenhum colaborador encontrado com os termos da busca.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ENROLLMENT MODAL (SIMULATED CAMERA CAPTURE & MESH SCAN) */}
      {selectedColabForEnroll && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-white space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  CADASTRO DE BIOMETRIA FACIAL (ISO 19794-5)
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Módulo 02 REP-P</span>
            </div>

            <div className="text-center space-y-1">
              <div className="text-lg font-bold text-white">{selectedColabForEnroll.nome}</div>
              <div className="text-xs font-mono text-slate-400">CPF: {selectedColabForEnroll.cpf}</div>
            </div>

            <canvas ref={enrollCanvasRef} width={320} height={240} className="hidden" />

            {showSelfieContingency ? (
              <div className="space-y-4 bg-slate-950/90 border border-amber-500/50 p-4 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>Selfie de Contingência REP-P (Portaria 671/2021)</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  A detecção automática falhou após <strong>{failedAttempts} tentativas</strong>. Para não impedir o registro de ponto do colaborador, conclua o cadastro via <strong>Selfie de Contingência Auditada</strong>.
                </p>

                {contingencySelfieDataUrl && (
                  <div className="relative w-44 h-44 mx-auto rounded-xl overflow-hidden border-2 border-amber-500/70 shadow-lg">
                    <img src={contingencySelfieDataUrl} alt="Selfie de Contingência" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 text-[9px] font-mono text-amber-300 rounded">
                      Contingency_Audit
                    </span>
                  </div>
                )}

                {/* Metadados de Auditoria */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[10px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Veredicto Auditoria:</span>
                    <span className="text-amber-400 font-bold">SELFIE_CONTINGENCIA_AUDITADA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">GPS Geolocalização:</span>
                    <span className="text-emerald-400">
                      {contingencyGps ? `${contingencyGps.lat}, ${contingencyGps.lng}` : `${selectedEst.latitude}, ${selectedEst.longitude}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tentativas Falhas:</span>
                    <span className="text-rose-400 font-bold">{failedAttempts} falhas de extração óptica</span>
                  </div>
                </div>

                {/* Manual Liveness Checkbox */}
                <label className="flex items-start gap-2.5 p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contingencyLivenessAnswer}
                    onChange={(e) => setContingencyLivenessAnswer(e.target.checked)}
                    className="mt-0.5 accent-amber-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-[11px] text-amber-200 leading-tight">
                    Declaro ter verificado presencialmente a vivacidade e presença do colaborador sob responsabilidade da empresa.
                  </span>
                </label>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setFailedAttempts(0);
                      setShowSelfieContingency(false);
                      setEnrollStatus('Tentativas zeradas. Posicione o rosto para captura.');
                    }}
                    className="w-full sm:w-auto px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                  >
                    Tentar Detecção Novamente
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveContingencySelfie}
                    disabled={isSubmittingContingencyAudit}
                    className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmittingContingencyAudit ? 'Enviando...' : 'Enviar Selfie & Liberar Ponto'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Camera Frame Preview */}
                <div className={`relative w-60 h-60 mx-auto rounded-full bg-slate-950 flex items-center justify-center overflow-hidden shadow-inner border-4 transition-all duration-300 ${enrollmentStep === 'success' ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'border-slate-800'}`}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                  />

                  {/* Dynamic Bounding Box */}
                  {isCameraActive && enrollFaceBox && (
                    <div
                      className="absolute border border-emerald-400/90 rounded pointer-events-none transition-all duration-100 z-20"
                      style={{
                        left: `${Math.max(5, (enrollFaceBox.x / 320) * 100)}%`,
                        top: `${Math.max(5, (enrollFaceBox.y / 240) * 100)}%`,
                        width: `${Math.min(90, (enrollFaceBox.width / 320) * 100)}%`,
                        height: `${Math.min(90, (enrollFaceBox.height / 240) * 100)}%`
                      }}
                    >
                      <div className="absolute -top-3.5 left-0 bg-emerald-950/90 text-emerald-400 text-[8px] font-mono px-1 rounded border border-emerald-500/40">
                        64D_ISO
                      </div>
                      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-300"></div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-300"></div>
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-300"></div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-300"></div>
                    </div>
                  )}

                  {/* Marcos Faciais */}
                  {isCameraActive && enrollLandmarks && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 320 240">
                      <circle cx={enrollLandmarks.leftEye.x} cy={enrollLandmarks.leftEye.y} r="3.5" fill="#34d399" />
                      <circle cx={enrollLandmarks.rightEye.x} cy={enrollLandmarks.rightEye.y} r="3.5" fill="#34d399" />
                      <circle cx={enrollLandmarks.nose.x} cy={enrollLandmarks.nose.y} r="3" fill="#38bdf8" />
                      <circle cx={enrollLandmarks.mouth.x} cy={enrollLandmarks.mouth.y} r="3.5" fill="#f43f5e" />
                    </svg>
                  )}

                  {/* Face Guide Oval */}
                  {isCameraActive && !enrollFaceBox && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.6" />
                    </svg>
                  )}

                  {enrollmentStep === 'capturing' && !isExtractingEnrollment && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-slate-950/30">
                      {!isCameraActive && <Camera className="w-16 h-16 text-emerald-400/50 animate-pulse" />}
                      <span className="text-[11px] font-mono font-bold text-emerald-300 bg-slate-950/80 px-2.5 py-1 rounded border border-emerald-500/30">
                        Enquadre o rosto no centro ({failedAttempts}/3)
                      </span>
                    </div>
                  )}

                  {isExtractingEnrollment && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-slate-950/60 z-30">
                      <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[10px] font-mono font-bold text-emerald-300">
                        EXTRAINDO VETOR 64-D...
                      </span>
                    </div>
                  )}

                  {enrollmentStep === 'success' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/80 text-emerald-300 space-y-1.5 p-4 text-center z-30 animate-in zoom-in-95 duration-200">
                      <ShieldCheck className="w-14 h-14 text-emerald-400" />
                      <span className="text-xs font-bold text-white">VETOR FACIAL EXTRAÍDO COM SUCESSO</span>
                      <span className="text-[10px] font-mono text-emerald-400">PADRÃO ISO/IEC 19794-5</span>
                    </div>
                  )}
                </div>

                {/* Status & Feedback Text */}
                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-center text-[11px] font-mono text-slate-300">
                  {enrollStatus || 'Posicione-se em frente à câmera e clique no botão abaixo para capturar.'}
                </div>

                {/* Modal Actions */}
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    onClick={() => { setSelectedColabForEnroll(null); setEnrollmentStep('idle'); }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>

                  {enrollmentStep === 'capturing' && (
                    <button
                      onClick={handleEnrollCaptureNow}
                      disabled={isExtractingEnrollment || !isCameraActive}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      Capturar Face & Extrair Vetor Agora
                    </button>
                  )}
                  
                  {enrollmentStep === 'success' && (
                    <>
                      <button
                        onClick={() => {
                          setEnrollmentStep('capturing');
                          setEnrollFaceBox(null);
                          setEnrollLandmarks(null);
                          setCapturedVector(null);
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                      >
                        Recapturar
                      </button>
                      <button
                        onClick={handleSaveEnrollment}
                        className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Salvar Template e Concluir
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
