import dns from 'dns/promises';
import tls from 'tls';
import type { DNSRecord, SSLCertificate, SecurityHeader } from '../../types';

export async function fetchDNS(domain: string): Promise<DNSRecord[]> {
  const records: DNSRecord[] = [];
  const types: (keyof typeof dns)[] = ['resolveA', 'resolveMx', 'resolveTxt', 'resolveNs'];
  
  const results = await Promise.allSettled([
    dns.resolve4(domain),
    dns.resolveMx(domain),
    dns.resolveTxt(domain),
    dns.resolveNs(domain)
  ]);

  if (results[0].status === 'fulfilled') {
    results[0].value.forEach(ip => records.push({ type: 'A', value: ip }));
  }
  if (results[1].status === 'fulfilled') {
    results[1].value.forEach(mx => records.push({ type: 'MX', value: `${mx.exchange} (${mx.priority})` }));
  }
  if (results[2].status === 'fulfilled') {
    results[2].value.forEach(txt => records.push({ type: 'TXT', value: txt.join(' ') }));
  }
  if (results[3].status === 'fulfilled') {
    results[3].value.forEach(ns => records.push({ type: 'NS', value: ns }));
  }

  return records;
}

export async function fetchSSL(domain: string): Promise<SSLCertificate | undefined> {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect({
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false
      }, () => {
        const cert = socket.getPeerCertificate();
        if (!cert || Object.keys(cert).length === 0) {
          resolve(undefined);
          return;
        }

        const validTo = new Date(cert.valid_to);
        const isExpired = new Date() > validTo;

        resolve({
          issuer: typeof cert.issuer === 'string' ? cert.issuer : cert.issuer.O || 'Unknown',
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          protocol: socket.getProtocol() || 'Unknown',
          subject: typeof cert.subject === 'string' ? cert.subject : cert.subject.CN || domain,
          isExpired,
          sans: cert.subjectaltname ? cert.subjectaltname.split(',').map(s => s.trim().replace('DNS:', '')) : []
        });
        socket.end();
      });

      socket.on('error', () => resolve(undefined));
      socket.setTimeout(5000, () => {
        socket.destroy();
        resolve(undefined);
      });
    } catch {
      resolve(undefined);
    }
  });
}

export function analyzeHeaders(headers: Headers): SecurityHeader[] {
  const security: SecurityHeader[] = [];
  const checks = [
    { name: 'Strict-Transport-Security', key: 'strict-transport-security' },
    { name: 'Content-Security-Policy', key: 'content-security-policy' },
    { name: 'X-Frame-Options', key: 'x-frame-options' },
    { name: 'X-Content-Type-Options', key: 'x-content-type-options' },
    { name: 'Referrer-Policy', key: 'referrer-policy' }
  ];

  checks.forEach(check => {
    const value = headers.get(check.key);
    if (value) {
      security.push({ name: check.name, value, status: 'secure' });
    } else {
      security.push({ name: check.name, value: 'Not Detected', status: 'missing' });
    }
  });

  return security;
}

export async function fetchIPInfo(ip: string): Promise<{ provider: string, location: string }> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await res.json();
    return {
      provider: data.isp || data.org || 'Unknown Provider',
      location: data.city && data.country ? `${data.city}, ${data.country}` : 'Unknown Location'
    };
  } catch {
    return { provider: 'Unknown Provider', location: 'Unknown Location' };
  }
}
