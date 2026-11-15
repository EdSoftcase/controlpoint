export interface ViaCepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  enderecoCompleto: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  precision: 'EXATA' | 'RUA' | 'CEP' | 'MUNICIPIO';
}

export function formatCep(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepResult> {
  const clean = (cep || '').replace(/\D/g, '');
  if (clean.length !== 8) {
    throw new Error('Digite um CEP válido com 8 dígitos para consulta.');
  }

  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  if (!res.ok) {
    throw new Error('Falha ao consultar o serviço ViaCEP.');
  }

  const data = await res.json();
  if (data.erro) {
    throw new Error('CEP não encontrado na base dos Correios (ViaCEP).');
  }

  const logradouro = (data.logradouro || '').trim();
  const bairro = (data.bairro || '').trim();
  const municipio = (data.localidade || '').trim();
  const uf = (data.uf || '').trim().toUpperCase();
  const complemento = (data.complemento || '').trim();

  const parts = [logradouro, bairro].filter(Boolean).join(', ');
  const cityUf = [municipio, uf].filter(Boolean).join('/');
  const enderecoCompleto = [parts, cityUf].filter(Boolean).join(' - ');

  return {
    cep: formatCep(clean),
    logradouro,
    complemento,
    bairro,
    municipio,
    uf,
    enderecoCompleto
  };
}

async function queryNominatim(query: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json'
      }
    });
    if (!res.ok) return null;
    const list = await res.json();
    if (Array.isArray(list) && list.length > 0 && list[0].lat && list[0].lon) {
      const lat = Number(parseFloat(list[0].lat).toFixed(6));
      const lon = Number(parseFloat(list[0].lon).toFixed(6));
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        return { latitude: lat, longitude: lon };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function geocodeBrazilianAddress(params: {
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
}): Promise<GeocodeResult | null> {
  const logradouro = (params.logradouro || '').trim();
  const numero = (params.numero || '').trim();
  const bairro = (params.bairro || '').trim();
  const municipio = (params.municipio || '').trim();
  const uf = (params.uf || '').trim();
  const cepClean = (params.cep || '').replace(/\D/g, '');

  const attempts: Array<{ query: string; precision: GeocodeResult['precision'] }> = [];

  if (logradouro && numero && municipio && uf) {
    attempts.push({
      query: `${logradouro}, ${numero}, ${municipio}, ${uf}, Brasil`,
      precision: 'EXATA'
    });
  }

  if (logradouro && municipio && uf) {
    attempts.push({
      query: `${logradouro}, ${bairro ? `${bairro}, ` : ''}${municipio}, ${uf}, Brasil`,
      precision: 'RUA'
    });
  }

  if (cepClean.length === 8) {
    const formatted = `${cepClean.slice(0, 5)}-${cepClean.slice(5)}`;
    attempts.push({
      query: `${formatted}, Brasil`,
      precision: 'CEP'
    });
  }

  if (municipio && uf) {
    attempts.push({
      query: `${municipio}, ${uf}, Brasil`,
      precision: 'MUNICIPIO'
    });
  }

  for (const attempt of attempts) {
    const coords = await queryNominatim(attempt.query);
    if (coords) {
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        precision: attempt.precision
      };
    }
  }

  return null;
}
