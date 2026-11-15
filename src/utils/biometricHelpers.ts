// Utilitários seguros para leitura e validação de template biométrico facial (ISO/IEC 19794-5)

export interface ParsedBiometricEnvelope {
  email?: string;
  telefone?: string;
  pretensaoDepto?: string;
  pretensaoCargo?: string;
  standard?: string;
  encryption?: string;
  lgpd_compliant?: boolean;
  consent_timestamp?: string;
  template?: string;
  enrolled?: boolean;
  vector?: number[];
  capturedAt?: string;
  livenessScore?: number;
  lightingCondition?: string;
  [key: string]: any;
}

export function parseBiometricTemplate(raw?: unknown): ParsedBiometricEnvelope | null {
  if (!raw) return null;
  if (typeof raw === 'object') {
    return raw as ParsedBiometricEnvelope;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as ParsedBiometricEnvelope;
        }
        if (Array.isArray(parsed) && parsed.length === 64) {
          return { vector: parsed.map(Number), enrolled: true };
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function extractStoredBiometricVector(raw?: unknown): number[] | null {
  const parsed = parseBiometricTemplate(raw);
  if (!parsed) return null;

  if (Array.isArray(parsed.vector) && parsed.vector.length === 64) {
    const nums = parsed.vector.map(Number);
    if (nums.every((n) => Number.isFinite(n))) return nums;
  }

  if (typeof parsed.template === 'string') {
    const inner = parseBiometricTemplate(parsed.template);
    if (inner && Array.isArray(inner.vector) && inner.vector.length === 64) {
      const nums = inner.vector.map(Number);
      if (nums.every((n) => Number.isFinite(n))) return nums;
    }
  }

  return null;
}

export function hasRealBiometricTemplate(colabOrRaw?: any): boolean {
  if (!colabOrRaw) return false;

  const raw =
    typeof colabOrRaw === 'object' && 'biometriaHashTemplate' in colabOrRaw
      ? colabOrRaw.biometriaHashTemplate
      : typeof colabOrRaw === 'object' && 'biometric_template' in colabOrRaw
      ? colabOrRaw.biometric_template
      : colabOrRaw;

  const flagExplicit =
    typeof colabOrRaw === 'object' &&
    ('biometriaCadastrada' in colabOrRaw || 'biometria_cadastrada' in colabOrRaw)
      ? Boolean(colabOrRaw.biometriaCadastrada ?? colabOrRaw.biometria_cadastrada)
      : undefined;

  if (flagExplicit === false && !raw) return false;
  if (!raw || typeof raw !== 'string') {
    if (Array.isArray(extractStoredBiometricVector(raw))) return true;
    return false;
  }

  const trimmed = raw.trim();
  if (!trimmed) return false;

  // Placeholder antigo que nunca representou biometria facial real
  if (trimmed === 'ISO19794-5:AES-256' || trimmed === 'ISO19794-5') {
    return false;
  }

  // Contingência auditada explícita
  if (trimmed.startsWith('CONTINGENCIA_AUDITADA_')) {
    return true;
  }

  const parsed = parseBiometricTemplate(trimmed);
  if (parsed) {
    // Se tem vetor facial de 64 dimensões real, está cadastrada
    if (extractStoredBiometricVector(parsed)) return true;

    // Se tem marcador explícito de template biométrico cadastrado (e não apenas {email, telefone})
    if (
      parsed.enrolled === true ||
      (parsed.standard === 'ISO/IEC 19794-5' && typeof parsed.template === 'string' && parsed.template.length > 20)
    ) {
      return true;
    }

    // JSON contendo apenas email, telefone, pretensaoDepto/Cargo NÃO é biometria cadastrada
    return false;
  }

  // Fallback para tokens encriptados legacy AES-256 com formato iv:tag:ciphertext (3 partes hex)
  const parts = trimmed.split(':');
  if (parts.length === 3 && parts.every((p) => /^[0-9a-f]+$/i.test(p) && p.length >= 16)) {
    return true;
  }

  return false;
}
