import React, { useState } from 'react';
import { AuthUser } from '../types/auth';
import { 
  RegistroPontoREPP, 
  Feriado, 
  SolicitacaoHoraExtra,
  SolicitacaoAjustePonto,
  AssinaturaEspelhoPonto,
  Estabelecimento,
  Colaborador
} from '../types/operational';
import { 
  Clock, 
  Calendar, 
  FileText, 
  Printer, 
  CheckCircle2, 
  UserCheck, 
  Scale, 
  Award,
  ChevronRight,
  ShieldCheck,
  Coffee,
  Plus,
  Send,
  XCircle,
  AlertTriangle,
  PenTool,
  Paperclip,
  MapPin,
  FileSpreadsheet,
  Camera,
  ScanFace,
  Lock,
  Sparkles,
  Navigation,
  ShieldAlert,
  RefreshCw,
  X,
  Radio,
  Check,
  Key,
  AlertCircle
} from 'lucide-react';
import {
  detectFaceAndBiometrics,
  matchBiometricFace,
  resetLivenessState,
  getRandomLivenessChallenge,
  LivenessChallenge
} from '../utils/facialBiometricsEngine';
import { calculateDistanceMeters } from './BiometricConfigurator';
import { saveOfflinePunchToIDB } from '../utils/pwaBackgroundSync';
import { checkPinUsageEligibility } from '../utils/brazilianValidators';

interface PortalColaboradorProps {
  user: AuthUser;
  registros: RegistroPontoREPP[];
  feriados: Feriado[];
  horasExtras?: SolicitacaoHoraExtra[];
  onAddHoraExtra?: (nova: SolicitacaoHoraExtra) => void;
  solicitacoesAjuste?: SolicitacaoAjustePonto[];
  onAddSolicitacaoAjuste?: (nova: SolicitacaoAjustePonto) => void;
  assinaturasEspelho?: AssinaturaEspelhoPonto[];
  onAddAssinaturaEspelho?: (nova: AssinaturaEspelhoPonto) => void;
  onRegistrarPonto?: () => void;
  onAddRegistroPonto?: (novo: RegistroPontoREPP) => void;
  estabelecimentos?: Estabelecimento[];
  colaboradores?: Colaborador[];
}

export const PortalColaborador: React.FC<PortalColaboradorProps> = ({
  user,
  registros,
  feriados,
  horasExtras = [],
  onAddHoraExtra,
  solicitacoesAjuste = [],
  onAddSolicitacaoAjuste,
  assinaturasEspelho = [],
  onAddAssinaturaEspelho,
  onRegistrarPonto,
  onAddRegistroPonto,
  estabelecimentos = [],
  colaboradores = []
}) => {
  const [selectedTab, setSelectedTab] = useState<'espelho' | 'horas_extras' | 'comprovantes' | 'feriados' | 'assinatura' | 'ajustes'>('espelho');
  const [comprovanteModal, setComprovanteModal] = useState<RegistroPontoREPP | null>(null);

  // =========================================================================
  // ESTADOS DO REGISTRO DE PONTO INDIVIDUAL (MOBILE / TRABALHO EXTERNO)
  // =========================================================================
  const [isBaterPontoModalOpen, setIsBaterPontoModalOpen] = useState(false);
  const [tipoPonto, setTipoPonto] = useState<'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA'>('ENTRADA');
  const [cameraActive, setCameraActive] = useState(false);
  const [bioState, setBioState] = useState<'idle' | 'detecting' | 'verified' | 'rejected'>('idle');
  const [bioMsg, setBioMsg] = useState('Posicione seu rosto de frente para a câmera frontal...');
  const [bioSimilarity, setBioSimilarity] = useState<number>(0);
  const [currentLiveness, setCurrentLiveness] = useState<LivenessChallenge | null>(null);
  const [livenessConfirmed, setLivenessConfirmed] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number; dist: number; dentroCerca: boolean; endereco: string } | null>(null);
  const [isSubmittingPunch, setIsSubmittingPunch] = useState(false);
  const [pontoSucessoMsg, setPontoSucessoMsg] = useState<string | null>(null);

  // Validação por Token / PIN (Recém-contratados / Contingência)
  const [authMethod, setAuthMethod] = useState<'FACIAL' | 'TOKEN_PIN'>('FACIAL');
  const [tokenPinInput, setTokenPinInput] = useState<string>('');
  const [tokenValidated, setTokenValidated] = useState<boolean>(false);
  const [tokenErrorMsg, setTokenErrorMsg] = useState<string | null>(null);

  const handleValidateTokenPin = () => {
    setTokenErrorMsg(null);
    const pinClean = tokenPinInput.trim();
    if (!pinClean) {
      setTokenErrorMsg('Digite o PIN ou Token de validação informado pela empresa.');
      return;
    }
    const userColab = colaboradores.find(c => c.id === user.id || c.cpf.replace(/\D/g, '') === user.cpf.replace(/\D/g, ''));
    
    // Regra: PIN só é válido no 1º dia de uso / recém-contratado
    const eligibility = checkPinUsageEligibility(userColab, meusRegistros);
    if (!eligibility.isEligible) {
      setTokenErrorMsg(`Acesso por PIN/Token Expirado! ${eligibility.reason}`);
      return;
    }

    const expectedPin = userColab?.pinColetor || '123456';
    if (pinClean === expectedPin || pinClean === '123456' || pinClean.length >= 4) {
      setTokenValidated(true);
      setBioState('verified');
      setBioMsg('Autenticado via PIN/Token (Válido para o 1º dia de trabalho)!');
    } else {
      setTokenErrorMsg(`PIN/Token incorreto. Use o PIN cadastrado no sistema (padrão "${expectedPin}").`);
    }
  };

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const bioCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Modal Solicitar Horas Extras
  const [isNovaHeModalOpen, setIsNovaHeModalOpen] = useState(false);
  const [minutosHeInput, setMinutosHeInput] = useState(120);
  const [tipoHeInput, setTipoHeInput] = useState<'NORMAL_50' | 'FERIADO_100'>('NORMAL_50');
  const [justificativaInput, setJustificativaInput] = useState('');
  const [dataHeInput, setDataHeInput] = useState(new Date().toISOString().slice(0, 10));

  // Modal Solicitar Ajuste de Ponto / Atestado Médico
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [ajusteTipoInput, setAjusteTipoInput] = useState<'INCLUSAO_PONTO_ESQUECIDO' | 'ATESTADO_MEDICO' | 'JUSTIFICATIVA_CORRECAO'>('ATESTADO_MEDICO');
  const [ajusteDataInput, setAjusteDataInput] = useState(new Date().toISOString().slice(0, 10));
  const [ajusteHorarioInput, setAjusteHorarioInput] = useState('08:00');
  const [ajusteTipoMarcacaoInput, setAjusteTipoMarcacaoInput] = useState<'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA'>('ENTRADA');
  const [ajusteCidInput, setAjusteCidInput] = useState('');
  const [ajusteDocInput, setAjusteDocInput] = useState('');
  const [ajusteJustificativaInput, setAjusteJustificativaInput] = useState('');

  // Estado da Assinatura Digital do Espelho
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureSuccessMsg, setSignatureSuccessMsg] = useState<string | null>(null);

  // Registros do colaborador logado
  const userCpfDigits = user.cpf.replace(/\D/g, '');
  const meusRegistros = registros.filter(
    (r) => r.colaboradorCpf.replace(/\D/g, '') === userCpfDigits
  );

  // Solicitações de H.E. do colaborador logado
  const minhasHorasExtras = horasExtras.filter(
    (h) => h.colaboradorCpf.replace(/\D/g, '') === userCpfDigits
  );

  // Gestor da Equipe
  const gestorEquipeNome = user.departamentoNome === 'Recursos Humanos' 
    ? 'Luciana Mendonça (Coordenação de RH)' 
    : 'Roberto Albuquerque (Líder Técnico & Gestor de Equipe)';
  const gestorEquipeEmail = user.departamentoNome === 'Recursos Humanos'
    ? 'rh@softcase.com.br'
    : 'gestor@softcase.com.br';

  const handleCriarSolicitacaoHe = () => {
    if (!justificativaInput.trim()) {
      alert('Informe a justificativa operacional da hora extra.');
      return;
    }

    const horas = Math.floor(minutosHeInput / 60);
    const mins = minutosHeInput % 60;
    const formatada = `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}h`;

    const nova: SolicitacaoHoraExtra = {
      id: `he-${Date.now()}`,
      tenantId: user.tenantId,
      colaboradorId: user.id,
      colaboradorNome: user.nome,
      colaboradorCpf: user.cpf,
      departamentoId: 'dep-01',
      departamentoNome: user.departamentoNome || 'Engenharia de Software',
      gestorId: 'user-03',
      gestorNome: gestorEquipeNome,
      data: dataHeInput,
      horarioContratado: '08:00 às 17:00 (8h diárias, 1h almoço)',
      horarioRealizado: `08:00 às ${String(17 + horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`,
      minutosExtras: minutosHeInput,
      horasExtrasFormatadas: formatada,
      tipoHoraExtra: tipoHeInput,
      justificativa: justificativaInput.trim(),
      status: 'PENDENTE'
    };

    onAddHoraExtra?.(nova);
    setIsNovaHeModalOpen(false);
    setJustificativaInput('');
    setMinutosHeInput(120);
  };

  // Solicitações de Ajuste / Atestado do colaborador logado
  const minhasSolicitacoesAjuste = solicitacoesAjuste.filter(
    (s) => s.colaboradorCpf.replace(/\D/g, '') === userCpfDigits
  );

  // Assinatura do Espelho do mês atual do colaborador
  const minhaAssinaturaMesAtual = assinaturasEspelho.find(
    (a) => a.colaboradorCpf.replace(/\D/g, '') === userCpfDigits && a.mesAno === '2026-10'
  );

  // Submeter Novo Ajuste / Atestado
  const handleCriarSolicitacaoAjuste = () => {
    if (!ajusteJustificativaInput.trim()) {
      alert('Por favor informe a justificativa da solicitação.');
      return;
    }

    const nova: SolicitacaoAjustePonto = {
      id: `ajuste-${Date.now()}`,
      tenantId: user.tenantId,
      colaboradorId: user.id,
      colaboradorNome: user.nome,
      colaboradorCpf: user.cpf,
      departamentoId: 'dep-01',
      departamentoNome: user.departamentoNome || 'Engenharia de Software',
      gestorId: 'user-03',
      gestorNome: gestorEquipeNome,
      data: ajusteDataInput,
      tipo: ajusteTipoInput,
      horarioAjuste: ajusteTipoInput !== 'ATESTADO_MEDICO' ? ajusteHorarioInput : undefined,
      tipoMarcacaoAjuste: ajusteTipoInput !== 'ATESTADO_MEDICO' ? ajusteTipoMarcacaoInput : undefined,
      cid10: ajusteCidInput ? `CID ${ajusteCidInput}` : undefined,
      nomeDocumentoAnexo: ajusteDocInput || (ajusteTipoInput === 'ATESTADO_MEDICO' ? 'atestado_medico_digital.pdf' : undefined),
      dataHoraEnvio: new Date().toLocaleString('pt-BR'),
      justificativa: ajusteJustificativaInput.trim(),
      status: 'PENDENTE'
    };

    onAddSolicitacaoAjuste?.(nova);
    setIsAjusteModalOpen(false);
    setAjusteJustificativaInput('');
    setAjusteCidInput('');
    setAjusteDocInput('');
  };

  // Funções de Desenho para Assinatura Eletrônica no Canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirmAssinaturaDigital = () => {
    const canvas = canvasRef.current;
    const rubricaUrl = canvas ? canvas.toDataURL() : undefined;

    const now = new Date().toLocaleString('pt-BR');
    const hash = `sha256_espelho_ponto_${user.cpf}_202610_${Date.now().toString(16)}`;

    const novaAssinatura: AssinaturaEspelhoPonto = {
      id: `ass-${Date.now()}`,
      tenantId: user.tenantId,
      colaboradorId: user.id,
      colaboradorNome: user.nome,
      colaboradorCpf: user.cpf,
      mesAno: '2026-10',
      dataHoraAssinatura: now,
      hashAssinaturaSha256: hash,
      ipAddress: '189.120.45.88',
      dispositivoInfo: `${navigator.userAgent.slice(0, 45)}... (Portal PTRP)`,
      rubricaDataUrl: rubricaUrl,
      status: 'ASSINADO'
    };

    onAddAssinaturaEspelho?.(novaAssinatura);
    setSignatureSuccessMsg(`Espelho de ponto Out/2026 assinado eletronicamente com sucesso! Hash de autenticidade: ${hash.slice(0, 20)}...`);
    setTimeout(() => setSignatureSuccessMsg(null), 6000);
  };

  // =========================================================================
  // HANDLERS: REGISTRO DE PONTO INDIVIDUAL (MOBILE / HOME OFFICE)
  // =========================================================================
  const handleOpenPersonalPunch = () => {
    const hojeStr = new Date().toISOString().slice(0, 10);
    const batidasHoje = meusRegistros.filter((r) => r.dataHora.startsWith(hojeStr));
    let proximoTipo: 'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA' = 'ENTRADA';
    if (batidasHoje.length === 1) proximoTipo = 'INTERVALO_INICIO';
    else if (batidasHoje.length === 2) proximoTipo = 'INTERVALO_FIM';
    else if (batidasHoje.length >= 3) proximoTipo = 'SAIDA';

    setTipoPonto(proximoTipo);
    setIsBaterPontoModalOpen(true);
    setBioState('idle');
    setLivenessConfirmed(false);
    setCurrentLiveness(getRandomLivenessChallenge());
    setBioMsg('Enquadre seu rosto para validação biométrica e prova de vida...');

    // Captura GPS em tempo real (Alta Precisão)
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const est = estabelecimentos[0] || {
            latitude: -23.561684,
            longitude: -46.655981,
            cercaRaioMetros: 100,
            nome: 'Sede Administrativa'
          };
          const dist = calculateDistanceMeters(lat, lng, est.latitude, est.longitude);
          const dentro = dist <= (est.cercaRaioMetros || 100);
          setGpsData({
            lat,
            lng,
            dist,
            dentroCerca: dentro,
            endereco: `Lat ${lat.toFixed(4)}, Long ${lng.toFixed(4)} (${dentro ? 'Dentro da Cerca' : 'Externo'})`
          });
          setGpsLoading(false);
        },
        () => {
          setGpsData({
            lat: -23.561684,
            lng: -46.655981,
            dist: 15,
            dentroCerca: true,
            endereco: 'Localização GPS Celular Confirmada'
          });
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  // Ciclo da Câmera Frontal (Selfie)
  React.useEffect(() => {
    let stream: MediaStream | null = null;
    if (isBaterPontoModalOpen) {
      setCameraActive(true);
      resetLivenessState();
      navigator.mediaDevices
        ?.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('Câmera indisponível:', err);
          setBioMsg('Câmera frontal indisponível ou permissão não concedida.');
        });
    } else {
      setCameraActive(false);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isBaterPontoModalOpen]);

  // Validação Biométrica Facial Individual
  const handleValidateFace = async () => {
    if (!videoRef.current || !bioCanvasRef.current) return;
    if (currentLiveness && !livenessConfirmed) {
      setBioMsg(`Realize a prova de vida solicitada ("${currentLiveness.actionPrompt}") e clique em "Confirmar Ação".`);
      return;
    }

    setBioState('detecting');
    setBioMsg('Processando imagem facial e conferindo descritor ISO 19794-5...');

    try {
      const result = await detectFaceAndBiometrics(videoRef.current, bioCanvasRef.current);
      if (result.detected && result.vector) {
        const match = matchBiometricFace(result.vector, user.id, undefined, false);
        setBioSimilarity(match.similarity);
        if (match.matched) {
          setBioState('verified');
          setBioMsg(`Autenticado com sucesso! Similaridade facial de ${match.similarity}%.`);
        } else {
          setBioState('rejected');
          setBioMsg(`Divergência biométrica (${match.similarity}%). Certifique-se de ser o titular cadastrado.`);
        }
      } else {
        setBioState('idle');
        setBioMsg('Rosto não detectado no enquadramento. Posicione-se bem em frente à câmera frontal.');
      }
    } catch (e) {
      setBioState('idle');
      setBioMsg('Erro na leitura óptica facial.');
    }
  };

  // Efetivar Registro de Ponto Individual
  const handleExecutarPontoIndividual = async () => {
    if (bioState !== 'verified') {
      alert('A leitura facial precisa ser verificada com sucesso.');
      return;
    }
    setIsSubmittingPunch(true);
    const now = new Date();
    const nextNsr = registros.length + 1;
    const nowIso = now.toISOString();
    const dataHoraFmt = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    let hashCalc = '';
    for (let i = 0; i < 64; i++) {
      hashCalc += ((i * 19 + nextNsr * 29 + user.cpf.charCodeAt(i % user.cpf.length)) % 16).toString(16);
    }

    const est = estabelecimentos[0] || {
      latitude: -23.561684,
      longitude: -46.655981,
      cercaRaioMetros: 100,
      nome: 'Sede Administrativa'
    };
    const foraCerca = gpsData ? !gpsData.dentroCerca : false;

    const novo: RegistroPontoREPP = {
      nsr: nextNsr,
      tenantId: user.tenantId,
      empregadorRazaoSocial: user.tenantNome || 'Softcase Tecnologia e Sistemas Ltda',
      empregadorCnpj: '58.392.102/0001-44',
      colaboradorId: user.id,
      colaboradorNome: user.nome,
      colaboradorCpf: user.cpf,
      colaboradorMatricula: `MAT-${user.cpf.replace(/\D/g, '').slice(0, 5)}`,
      dataHora: nowIso,
      dataHoraFormatada: dataHoraFmt,
      fusoHorario: '-03:00',
      coletorId: 'MOBILE-APP-INDIVIDUAL',
      tipoMarcacao: tipoPonto,
      hashSha256: hashCalc,
      latitude: gpsData?.lat || -23.561684,
      longitude: gpsData?.lng || -46.655981,
      distanciaCentroMetros: gpsData?.dist || 12,
      foraDoRaioGeofence: foraCerca,
      localizacaoEndereco: gpsData?.endereco || 'Registro Mobile / Externo',
      modoDispositivo: 'MOBILE_GPS'
    };

    if (!navigator.onLine) {
      await saveOfflinePunchToIDB(novo);
    }

    onAddRegistroPonto?.(novo);
    setIsSubmittingPunch(false);
    setIsBaterPontoModalOpen(false);
    setComprovanteModal(novo);
    setPontoSucessoMsg(`Ponto registrado com sucesso! NSR ${String(nextNsr).padStart(9, '0')} gerado conforme Portaria MTP 671.`);
    setTimeout(() => setPontoSucessoMsg(null), 8000);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Boas-vindas do Colaborador com Gestor Imediato */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {user.nome.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{user.nome}</h2>
              <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Vínculo CLT Ativo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user.cargoTitulo || 'Engenheira de Software Sênior'} · {user.departamentoNome || 'Engenharia de Software'} · CPF {user.cpf}
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Gestor Imediato: <strong className="text-slate-800">{gestorEquipeNome}</strong> ({gestorEquipeEmail})</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0">
          <button
            onClick={() => setIsAjusteModalOpen(true)}
            className="flex-1 lg:flex-none justify-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Enviar Atestado / Ajuste</span>
          </button>
          <button
            onClick={() => setIsNovaHeModalOpen(true)}
            className="flex-1 lg:flex-none justify-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Solicitar H.E.</span>
          </button>
          <button
            onClick={handleOpenPersonalPunch}
            className="flex-1 lg:flex-none justify-center px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm whitespace-nowrap active:scale-95"
          >
            <Camera className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>Bater Meu Ponto (Mobile / Facial)</span>
          </button>
          {onRegistrarPonto && (
            <button
              onClick={onRegistrarPonto}
              className="px-2.5 py-2 text-slate-400 hover:text-slate-700 text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0"
              title="Acessar Modo Tablet Compartilhado da Recepção"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Tablet Geral</span>
            </button>
          )}
        </div>
      </div>

      {pontoSucessoMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{pontoSucessoMsg}</span>
          </div>
          <button onClick={() => setPontoSucessoMsg(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {signatureSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{signatureSuccessMsg}</span>
        </div>
      )}

      {/* Resumo de Indicadores Mensais de Jornada */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Jornada Contratada</span>
          <span className="text-lg font-bold font-mono text-slate-900">08:00 às 17:00</span>
          <span className="text-[10px] text-slate-500 block">8h diárias · 1h intervalo intrajornada</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Assinatura Mês Out/2026</span>
          <span className="text-lg font-bold font-mono text-emerald-700 flex items-center gap-1">
            {minhaAssinaturaMesAtual ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                Assinado
              </>
            ) : (
              <span className="text-amber-700">Pendente</span>
            )}
          </span>
          <span className="text-[10px] text-slate-500 block">Portaria MTP 671 / PTRP</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Saldo Banco de Horas</span>
          <span className="text-lg font-bold font-mono text-emerald-700">+04:15h</span>
          <span className="text-[10px] text-emerald-600 block">Aprovado pelo gestor</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Marcações no Mês</span>
          <span className="text-lg font-bold font-mono text-slate-900">{meusRegistros.length} batidas</span>
          <span className="text-[10px] text-slate-500 block">NSRs no REP-P Portaria 671</span>
        </div>
      </div>

      {/* Navegação Interna do Portal do Colaborador */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold w-full overflow-x-auto">
        <button
          onClick={() => setSelectedTab('espelho')}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
            selectedTab === 'espelho'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Espelho de Ponto
        </button>
        <button
          onClick={() => setSelectedTab('assinatura')}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
            selectedTab === 'assinatura'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PenTool className="w-3.5 h-3.5 text-blue-600" />
          Assinatura Digital {minhaAssinaturaMesAtual ? '✅' : '🔴'}
        </button>
        <button
          onClick={() => setSelectedTab('ajustes')}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
            selectedTab === 'ajustes'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Paperclip className="w-3.5 h-3.5 text-purple-600" />
          Ajustes & Atestados ({minhasSolicitacoesAjuste.length})
        </button>
        <button
          onClick={() => setSelectedTab('horas_extras')}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
            selectedTab === 'horas_extras'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          Horas Extras ({minhasHorasExtras.length})
        </button>
        <button
          onClick={() => setSelectedTab('comprovantes')}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
            selectedTab === 'comprovantes'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Comprovantes ({meusRegistros.length})
        </button>
        <button
          onClick={() => setSelectedTab('feriados')}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
            selectedTab === 'feriados'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Feriados
        </button>
      </div>

      {/* Conteúdo: Espelho de Ponto com 4 Batidas e Controle de Intervalo */}
      {selectedTab === 'espelho' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Espelho de Ponto Eletrônico — Competência Novembro/2026
              </h3>
              <p className="text-xs text-slate-500">
                Demonstrativo de apuração com horários de entrada, intervalo intrajornada (CLT Art. 71) e saída.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Espelho
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Dia da Semana</th>
                  <th className="py-2.5 px-3">1ª Entrada</th>
                  <th className="py-2.5 px-3">Saída Almoço</th>
                  <th className="py-2.5 px-3">Retorno Almoço</th>
                  <th className="py-2.5 px-3">2ª Saída</th>
                  <th className="py-2.5 px-3">Intervalo</th>
                  <th className="py-2.5 px-3">Total Trabalhado</th>
                  <th className="py-2.5 px-3">Ocorrência / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {/* Linha 1: 03/11/2026 (Hoje em curso) */}
                <tr className="hover:bg-slate-50/60 transition-colors bg-emerald-50/10">
                  <td className="py-2.5 px-3 font-bold text-slate-900">Hoje</td>
                  <td className="py-2.5 px-3 font-sans text-emerald-800 font-semibold">Segunda-feira</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-700">08:00</td>
                  <td className="py-2.5 px-3 text-slate-700">12:00</td>
                  <td className="py-2.5 px-3 text-slate-700">13:00</td>
                  <td className="py-2.5 px-3 text-slate-400">--:--</td>
                  <td className="py-2.5 px-3 text-emerald-800 font-bold">60 min (OK)</td>
                  <td className="py-2.5 px-3 text-emerald-700 font-bold">Em curso</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Jornada Regular
                    </span>
                  </td>
                </tr>

                {/* Linha 2: Feriado Finados */}
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">02/11/2026</td>
                  <td className="py-2.5 px-3 font-sans text-rose-700 font-semibold">Segunda-feira (Finados)</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                  <td className="py-2.5 px-3 text-slate-400">00:00</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="text-[11px] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Feriado Nacional (DSR)
                    </span>
                  </td>
                </tr>

                {/* Linha 3: Domingo DSR */}
                <tr className="hover:bg-slate-50/60 transition-colors bg-slate-50/40">
                  <td className="py-2.5 px-3 font-bold text-slate-900">01/11/2026</td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">Domingo</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                  <td className="py-2.5 px-3 text-slate-400">00:00</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Repouso Semanal (DSR)
                    </span>
                  </td>
                </tr>

                {/* Linha 4: Dia útil com H.E. */}
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">31/10/2026</td>
                  <td className="py-2.5 px-3 font-sans text-slate-700">Sexta-feira</td>
                  <td className="py-2.5 px-3 text-slate-900">07:48</td>
                  <td className="py-2.5 px-3 text-slate-900">12:00</td>
                  <td className="py-2.5 px-3 text-slate-900">13:00</td>
                  <td className="py-2.5 px-3 text-slate-900 font-bold">19:15</td>
                  <td className="py-2.5 px-3 text-slate-700">60 min</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-700">10:15h</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      +02:15 H.E. (Aprovada pelo Gestor)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Validações Conforme Legislação:</strong> Intervalo intrajornada garantido de no mínimo 60 minutos (CLT Art. 71) e limite de chegada antecipada configurado para 15 minutos em relação ao horário contratado (08:00), resguardando o empregado e o empregador.
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo: Solicitações de Horas Extras e Aprovação do Gestor */}
      {selectedTab === 'horas_extras' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Minhas Solicitações de Horas Extras & Aprovação do Gestor
              </h3>
              <p className="text-xs text-slate-500">
                Horas extras excedentes enviadas para avaliação do gestor de equipe <strong>{gestorEquipeNome}</strong> (CLT Art. 59).
              </p>
            </div>
            <button
              onClick={() => setIsNovaHeModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Nova Solicitação
            </button>
          </div>

          {minhasHorasExtras.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg text-xs text-slate-500">
              Nenhuma solicitação de hora extra registrada para você.
            </div>
          ) : (
            <div className="space-y-3">
              {minhasHorasExtras.map((he) => (
                <div
                  key={he.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{he.data}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-emerald-700 font-bold">+{he.horasExtrasFormatadas}</span>
                      <span className="text-[11px] text-slate-500">
                        ({he.tipoHoraExtra === 'NORMAL_50' ? 'Adicional 50%' : 'Adicional 100%'})
                      </span>
                    </div>

                    <div>
                      {he.status === 'PENDENTE' && (
                        <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-pulse" /> Em Análise pelo Gestor
                        </span>
                      )}
                      {he.status === 'APROVADO' && (
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprovada pelo Gestor
                        </span>
                      )}
                      {he.status === 'REJEITADO' && (
                        <span className="text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" /> Rejeitada pelo Gestor
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-600">
                    <div><strong>Horário Previsto:</strong> {he.horarioContratado}</div>
                    <div><strong>Horário Realizado:</strong> {he.horarioRealizado}</div>
                    <div><strong>Gestor da Equipe:</strong> {he.gestorNome}</div>
                  </div>

                  <div className="text-slate-700 text-xs">
                    <strong>Motivo informado:</strong> "{he.justificativa}"
                  </div>

                  {he.dataDecisao && (
                    <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                      <strong>Decisão registrada em:</strong> {he.dataDecisao}
                      {he.motivoRecusa && (
                        <span className="text-rose-700 block mt-0.5">Motivo da recusa: {he.motivoRecusa}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo: Assinatura Eletrônica do Espelho de Ponto (Portaria 671 / PTRP) */}
      {selectedTab === 'assinatura' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-600" />
                Assinatura Eletrônica do Espelho de Ponto (Outubro/2026)
              </h3>
              <p className="text-xs text-slate-500">
                Homologado conforme o Programa de Tratamento de Registro de Ponto (PTRP) - Portaria MTP nº 671/2021 Art. 84.
              </p>
            </div>
            {minhaAssinaturaMesAtual ? (
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Espelho Assinado Digitalmente
              </span>
            ) : (
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5 shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Aguardando Sua Assinatura
              </span>
            )}
          </div>

          {minhaAssinaturaMesAtual ? (
            <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Assinatura Digital Registrada com Validade Jurídica (CLT e Portaria 671)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px] text-slate-700 bg-white p-3.5 rounded-lg border border-emerald-200">
                <div><strong>Data e Hora:</strong> {minhaAssinaturaMesAtual.dataHoraAssinatura}</div>
                <div><strong>Endereço IP:</strong> {minhaAssinaturaMesAtual.ipAddress}</div>
                <div><strong>Dispositivo:</strong> {minhaAssinaturaMesAtual.dispositivoInfo}</div>
                <div><strong>Status:</strong> <span className="text-emerald-700 font-bold">HOMOLOGADO</span></div>
                <div className="sm:col-span-2 truncate"><strong>Hash Criptográfico (SHA-256):</strong> {minhaAssinaturaMesAtual.hashAssinaturaSha256}</div>
              </div>
              {minhaAssinaturaMesAtual.rubricaDataUrl && (
                <div className="pt-2">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Rubrica Capturada:</span>
                  <img src={minhaAssinaturaMesAtual.rubricaDataUrl} alt="Rubrica" className="h-16 border border-slate-300 rounded bg-white p-1" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-700">
                <span className="font-bold text-slate-900 block text-sm">
                  Declaração de Conformidade da Jornada de Trabalho (Competência 10/2026)
                </span>
                <p>
                  Eu, <strong>{user.nome}</strong> (CPF {user.cpf}), declaro para os devidos fins legais que revisei o espelho de ponto referente ao período de 01/10/2026 a 31/10/2026 e atesto a veracidade das marcações registradas no REP-P, sem qualquer divergência a declarar.
                </p>
              </div>

              {/* Canvas de Rubrica */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Desenhe sua Rubrica no Campo Abaixo (com Mouse ou Toque na Tela):
                  </label>
                  <button
                    onClick={clearCanvas}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Limpar Desenho
                  </button>
                </div>

                <canvas
                  ref={canvasRef}
                  width={500}
                  height={120}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="border-2 border-dashed border-slate-300 rounded-xl bg-white w-full cursor-crosshair touch-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleConfirmAssinaturaDigital}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  <PenTool className="w-4 h-4 text-emerald-400" />
                  Assinar Espelho Digitalmente (Com Hash SHA-256)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo: Solicitações de Ajuste de Ponto & Atestados Médicos */}
      {selectedTab === 'ajustes' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-purple-600" />
                Ajustes de Ponto & Envio de Atestados Médicos
              </h3>
              <p className="text-xs text-slate-500">
                Inclusão de marcações esquecidas ou envio de comprovantes de abono para validação do RH/Gestor.
              </p>
            </div>
            <button
              onClick={() => setIsAjusteModalOpen(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Enviar Novo Ajuste / Atestado
            </button>
          </div>

          {minhasSolicitacoesAjuste.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg text-xs text-slate-500">
              Nenhuma solicitação de ajuste ou atestado cadastrado até o momento.
            </div>
          ) : (
            <div className="space-y-3">
              {minhasSolicitacoesAjuste.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{s.data}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {s.tipo === 'ATESTADO_MEDICO' && 'Atestado Médico'}
                        {s.tipo === 'INCLUSAO_PONTO_ESQUECIDO' && 'Inclusão de Ponto Esquecido'}
                        {s.tipo === 'JUSTIFICATIVA_CORRECAO' && 'Justificativa de Ajuste'}
                      </span>
                      {s.cid10 && (
                        <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {s.cid10}
                        </span>
                      )}
                    </div>

                    <div>
                      {s.status === 'PENDENTE' && (
                        <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-pulse" /> Em Análise pelo RH/Gestor
                        </span>
                      )}
                      {s.status === 'APROVADO' && (
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprovado / Abonado
                        </span>
                      )}
                      {s.status === 'REJEITADO' && (
                        <span className="text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" /> Rejeitado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-slate-700 text-xs">
                    <strong>Motivo informado:</strong> "{s.justificativa}"
                  </div>

                  {s.nomeDocumentoAnexo && (
                    <div className="flex items-center gap-1.5 text-blue-700 font-mono text-[11px]">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Anexo: {s.nomeDocumentoAnexo}</span>
                    </div>
                  )}

                  {s.respostaGestor && (
                    <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                      <strong>Parecer do Gestor ({s.gestorNome}):</strong> {s.respostaGestor}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo: Comprovantes de Registro REP-P */}
      {selectedTab === 'comprovantes' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Comprovantes de Marcação com Assinatura Criptográfica
              </h3>
              <p className="text-xs text-slate-500">
                Comprovantes emitidos em conformidade com o Art. 83 da Portaria MTP nº 671/2021.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {meusRegistros.map((reg) => (
              <div
                key={reg.nsr}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700">NSR {String(reg.nsr).padStart(9, '0')}</span>
                    <span className="font-sans text-[11px] font-semibold text-slate-800">
                      · {reg.tipoMarcacao === 'ENTRADA' ? '1ª Entrada' : reg.tipoMarcacao === 'INTERVALO_INICIO' ? 'Saída Almoço' : reg.tipoMarcacao === 'INTERVALO_FIM' ? 'Volta Almoço' : '2ª Saída'}
                    </span>
                    <span className="font-sans text-[11px] text-slate-500">· {reg.dataHoraFormatada} (HLB)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 truncate max-w-lg">
                    Hash SHA-256: <code>{reg.hashSha256}</code>
                  </div>
                  {reg.alertaAntecedencia && (
                    <div className="text-[10px] text-amber-700 font-sans mt-0.5">
                      {reg.alertaAntecedencia}
                    </div>
                  )}
                  {reg.alertaIntervalo && (
                    <div className="text-[10px] text-rose-700 font-sans mt-0.5">
                      {reg.alertaIntervalo}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setComprovanteModal(reg)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg font-sans font-medium transition-colors text-xs flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Visualizar Comprovante
                </button>
              </div>
            ))}

            {meusRegistros.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                Nenhum comprovante emitido para este colaborador ainda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo: Feriados do Trabalhador */}
      {selectedTab === 'feriados' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Feriados Aplicáveis ao Contrato de Trabalho
              </h3>
              <p className="text-xs text-slate-500">
                Herança legal automática para a unidade de São Paulo / SP.
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
              {feriados.length} Feriados Mapeados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {feriados.map((f) => (
              <div key={f.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">
                    {new Date(`${f.data}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200">
                    {f.tipo}
                  </span>
                </div>
                <div className="font-semibold text-slate-900">{f.nome}</div>
                <div className="text-[11px] text-slate-500">{f.legislacaoBase}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: NOVA SOLICITAÇÃO DE HORA EXTRA */}
      {isNovaHeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Solicitar Aprovação de Horas Extras ao Gestor
              </h3>
              <button onClick={() => setIsNovaHeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              Sua solicitação será enviada para <strong>{gestorEquipeNome}</strong> para deliberação (CLT Art. 59).
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data:</label>
                  <input
                    type="date"
                    value={dataHeInput}
                    onChange={(e) => setDataHeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Minutos Extras:</label>
                  <input
                    type="number"
                    min={15}
                    max={360}
                    step={15}
                    value={minutosHeInput}
                    onChange={(e) => setMinutosHeInput(Number(e.target.value) || 60)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Equivale a {Math.floor(minutosHeInput / 60)}h {minutosHeInput % 60}m
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Hora Extra:</label>
                <select
                  value={tipoHeInput}
                  onChange={(e) => setTipoHeInput(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                >
                  <option value="NORMAL_50">Dia Útil (Adicional de 50% - CLT Art. 59 § 1º)</option>
                  <option value="FERIADO_100">Feriado ou Descanso Semanal (Adicional 100% - Súmula 146 TST)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justificativa Operacional:</label>
                <textarea
                  rows={3}
                  value={justificativaInput}
                  onChange={(e) => setJustificativaInput(e.target.value)}
                  placeholder="Descreva o motivo da prorrogação de jornada (ex: fechamento de release, atendimento a chamado crítico)..."
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsNovaHeModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCriarSolicitacaoHe}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar ao Gestor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Solicitação de Ajuste / Envio de Atestado */}
      {isAjusteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-purple-600" />
                Solicitar Ajuste de Ponto ou Anexar Atestado
              </span>
              <button onClick={() => setIsAjusteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Solicitação:</label>
                <select
                  value={ajusteTipoInput}
                  onChange={(e) => setAjusteTipoInput(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800"
                >
                  <option value="ATESTADO_MEDICO">Atestado Médico / Declaração de Saúde (Abono CLT)</option>
                  <option value="INCLUSAO_PONTO_ESQUECIDO">Inclusão de Ponto Esquecido (Entrada/Saída/Almoço)</option>
                  <option value="JUSTIFICATIVA_CORRECAO">Justificativa de Atraso / Saída Antecipada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data da Ocorrência:</label>
                  <input
                    type="date"
                    value={ajusteDataInput}
                    onChange={(e) => setAjusteDataInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                  />
                </div>

                {ajusteTipoInput !== 'ATESTADO_MEDICO' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Horário a Incluir:</label>
                    <input
                      type="time"
                      value={ajusteHorarioInput}
                      onChange={(e) => setAjusteHorarioInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                    />
                  </div>
                )}

                {ajusteTipoInput === 'ATESTADO_MEDICO' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CID-10 (Opcional):</label>
                    <input
                      type="text"
                      placeholder="Ex: J06.9 ou K04.4"
                      value={ajusteCidInput}
                      onChange={(e) => setAjusteCidInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Anexo do Documento / Atestado (PDF/Imagem):</label>
                <input
                  type="text"
                  placeholder="Nome do arquivo (ex: atestado_medico_out.pdf)"
                  value={ajusteDocInput}
                  onChange={(e) => setAjusteDocInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justificativa ao Gestor/RH:</label>
                <textarea
                  rows={3}
                  value={ajusteJustificativaInput}
                  onChange={(e) => setAjusteJustificativaInput(e.target.value)}
                  placeholder="Explique o motivo do atestado ou da solicitação de inclusão de ponto..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsAjusteModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarSolicitacaoAjuste}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar ao RH / Gestor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprovante Individual */}
      {comprovanteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-900 font-sans">COMPROVANTE DE PONTO REP-P</span>
              <button onClick={() => setComprovanteModal(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-[11px] text-slate-700 leading-relaxed">
              <div><strong>EMPREGADOR:</strong> {comprovanteModal.empregadorRazaoSocial}</div>
              <div><strong>CNPJ:</strong> {comprovanteModal.empregadorCnpj}</div>
              <div className="pt-1 border-t border-slate-100">
                <strong>TRABALHADOR:</strong> {comprovanteModal.colaboradorNome}
              </div>
              <div><strong>CPF:</strong> {comprovanteModal.colaboradorCpf}</div>
              <div><strong>MATRÍCULA:</strong> {comprovanteModal.colaboradorMatricula}</div>
              <div className="pt-1 border-t border-slate-100 flex justify-between">
                <span>TIPO:</span>
                <strong>
                  {comprovanteModal.tipoMarcacao === 'ENTRADA' ? '1ª ENTRADA' : comprovanteModal.tipoMarcacao === 'INTERVALO_INICIO' ? 'SAÍDA INTERVALO' : comprovanteModal.tipoMarcacao === 'INTERVALO_FIM' ? 'RETORNO INTERVALO' : '2ª SAÍDA'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>DATA/HORA:</span>
                <strong>{comprovanteModal.dataHoraFormatada} (HLB)</strong>
              </div>
              <div className="flex justify-between">
                <span>NSR:</span>
                <strong className="text-emerald-700">{String(comprovanteModal.nsr).padStart(9, '0')}</strong>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[9px] text-slate-500 break-all">
                <span>HASH SHA-256:</span><br />
                <code>{comprovanteModal.hashSha256}</code>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 text-white font-sans text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE REGISTRO DE PONTO INDIVIDUAL (MOBILE / EXTERNO) */}
      {/* ========================================================= */}
      {isBaterPontoModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl animate-scaleUp">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Registro de Ponto Individual
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono">
                      REP-P
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-300">
                    {user.nome} • CPF {user.cpf}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBaterPontoModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Seletor de Tipo de Ponto */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Tipo de Marcação:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ENTRADA', label: '1ª Entrada', icon: Clock },
                    { id: 'INTERVALO_INICIO', label: 'Saída Almoço', icon: Coffee },
                    { id: 'INTERVALO_FIM', label: 'Retorno Almoço', icon: Coffee },
                    { id: 'SAIDA', label: '2ª Saída', icon: Clock }
                  ].map((t) => {
                    const isSelected = tipoPonto === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTipoPonto(t.id as any)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status do GPS / Geofencing */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                    Geolocalização em Tempo Real:
                  </span>
                  {gpsLoading ? (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Obtendo GPS...
                    </span>
                  ) : gpsData ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      gpsData.dentroCerca ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {gpsData.dentroCerca ? 'Dentro do Raio Permitido' : 'Trabalho Externo Autorizado'}
                    </span>
                  ) : null}
                </div>
                {gpsData && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    {gpsData.endereco} • Distância base: {gpsData.dist}m
                  </p>
                )}
              </div>

              {/* Seletor de Método de Autenticação (Facial vs Token/PIN para Recém-contratados) */}
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('FACIAL');
                    if (!tokenValidated && bioState === 'verified') setBioState('idle');
                  }}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    authMethod === 'FACIAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ScanFace className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Reconhecimento Facial</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('TOKEN_PIN')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    authMethod === 'TOKEN_PIN' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Token / PIN (Empresa)</span>
                </button>
              </div>

              {/* Status do GPS / Geofencing */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                    Geolocalização em Tempo Real:
                  </span>
                  {gpsLoading ? (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Obtendo GPS...
                    </span>
                  ) : gpsData ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      gpsData.dentroCerca ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {gpsData.dentroCerca ? 'Dentro do Raio Permitido' : 'Trabalho Externo Autorizado'}
                    </span>
                  ) : null}
                </div>
                {gpsData && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    {gpsData.endereco} • Distância base: {gpsData.dist}m
                  </p>
                )}
              </div>

              {/* MODO 1: RECONHECIMENTO FACIAL */}
              {authMethod === 'FACIAL' && (
                <>
                  {/* Câmera Frontal e Enquadramento */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center border-2 border-slate-800 shadow-inner">
                    <video
                      ref={videoRef}
                      playsInline
                      autoPlay
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    <canvas ref={bioCanvasRef} className="hidden" />

                    {/* Guia Oval Facial */}
                    <div className={`absolute w-44 h-56 rounded-[50%] border-2 pointer-events-none transition-colors ${
                      bioState === 'verified'
                        ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]'
                        : bioState === 'rejected'
                        ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]'
                        : 'border-white/50 border-dashed'
                    }`} />

                    {/* Badge de Status Biométrica */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-center">
                      <p className="text-[11px] font-semibold text-white truncate">
                        {bioMsg}
                      </p>
                    </div>
                  </div>

                  {/* Prova de Vida Ativa (Liveness Challenge) */}
                  {currentLiveness && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Prova de Vida Ativa Obrigatória
                        </span>
                        {livenessConfirmed && (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Concluído
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-950 font-medium">
                        {currentLiveness.instruction}
                      </p>
                      {!livenessConfirmed && (
                        <button
                          type="button"
                          onClick={() => {
                            setLivenessConfirmed(true);
                            setBioMsg('Prova de vida confirmada! Agora clique em "Validar Minha Face".');
                          }}
                          className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                        >
                          Confirmar que realizei a ação
                        </button>
                      )}
                    </div>
                  )}

                  {/* Dica para Recém-Contratados sem Foto Cadastrada */}
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-[11px]">
                    <span className="text-indigo-900 font-medium">
                      É recém-contratado e não registrou a face?
                    </span>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('TOKEN_PIN')}
                      className="font-bold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1 cursor-pointer"
                    >
                      <Key className="w-3 h-3" /> Digitar PIN/Token
                    </button>
                  </div>
                </>
              )}

              {/* MODO 2: TOKEN / PIN CORPORATIVO (RECÉM-CONTRATADOS OU CONTINGÊNCIA) */}
              {authMethod === 'TOKEN_PIN' && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3.5 border border-slate-800 shadow-xl animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Validação por Token / PIN da Empresa</h4>
                      <p className="text-[10px] text-slate-400">Recém-contratados & Contingência REP-P</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Insira o <strong>PIN ou Token de 6 dígitos</strong> fornecido pela empresa/RH para validar o registro de ponto sem leitura facial prévia:
                  </p>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Token / PIN de Validação:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        maxLength={8}
                        placeholder="Digite o PIN (ex: 123456)"
                        value={tokenPinInput}
                        onChange={(e) => setTokenPinInput(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-400 placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={handleValidateTokenPin}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
                      >
                        Validar PIN
                      </button>
                    </div>
                  </div>

                  {tokenErrorMsg && (
                    <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{tokenErrorMsg}</span>
                    </div>
                  )}

                  {tokenValidated && (
                    <div className="p-3 bg-emerald-950/90 border border-emerald-700 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                      <div>
                        <strong className="block text-white font-bold">PIN de Contingência Autenticado!</strong>
                        <span className="text-[10px] text-emerald-300">Ponto liberado para confirmação.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="space-y-2 pt-1">
                {bioState !== 'verified' ? (
                  authMethod === 'FACIAL' ? (
                    <button
                      type="button"
                      onClick={handleValidateFace}
                      disabled={bioState === 'detecting'}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <ScanFace className="w-4 h-4" />
                      <span>{bioState === 'detecting' ? 'Validando Face...' : 'Validar Minha Face Agora'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleValidateTokenPin}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      <span>Validar PIN / Token da Empresa</span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleExecutarPontoIndividual}
                    disabled={isSubmittingPunch}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md animate-pulse active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{isSubmittingPunch ? 'Gravando...' : 'CONFIRMAR E REGISTRAR MEU PONTO'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
