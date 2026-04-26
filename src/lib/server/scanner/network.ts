import tls from 'tls';
import type { DNSRecord, SSLCertificate, SecurityHeader } from '../../types';

// Helper for fetch with timeout
async function fetchWithTimeout(url: string, options: any = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export async function fetchDNS(domain: string): Promise<DNSRecord[]> {
  const records: DNSRecord[] = [];
  
  // Use Cloudflare DNS-over-HTTPS API for better reliability in serverless environments
  // Node's native 'dns' module often fails or is restricted in serverless runtimes
  const fetchDNSRecords = async (type: string) => {
    try {
      const res = await fetchWithTimeout(`https://cloudflare-dns.com/dns-query?name=${domain}&type=${type}`, {
        headers: { 'Accept': 'application/dns-json' }
      }, 4000);
      
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.Answer) return [];
      
      return data.Answer.map((ans: any) => ({
        type,
        value: ans.data.replace(/"/g, '') // Clean up TXT records
      }));
    } catch (err) {
      console.error(`DNS fetch error for ${type}:`, err);
      return [];
    }
  };

  const [a, mx, txt, ns] = await Promise.all([
    fetchDNSRecords('A'),
    fetchDNSRecords('MX'),
    fetchDNSRecords('TXT'),
    fetchDNSRecords('NS')
  ]);

  return [...a, ...mx, ...txt, ...ns];
}

export async function fetchSSL(domain: string): Promise<SSLCertificate | undefined> {
  return new Promise((resolve) => {
    try {
      // tls.connect is generally supported in Vercel Serverless (Node) functions
      // but might fail in Edge functions.
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
        socket.destroy();
      });

      socket.on('error', (err) => {
        console.error('SSL socket error:', err);
        resolve(undefined);
      });
      
      socket.setTimeout(4000, () => {
        socket.destroy();
        resolve(undefined);
      });
    } catch (err) {
      console.error('SSL connection error:', err);
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
    // Using ipapi.co as it supports HTTPS for free and is generally reliable
    const res = await fetchWithTimeout(`https://ipapi.co/${ip}/json/`, {}, 4000);
    if (!res.ok) throw new Error('IP API returned error');
    const data = await res.json();
    return {
      provider: data.org || data.asn || 'Unknown Provider',
      location: data.city && data.country_name ? `${data.city}, ${data.country_name}` : 'Unknown Location'
    };
  } catch (err) {
    console.error('IP Info fetch error:', err);
    return { provider: 'Unknown Provider', location: 'Unknown Location' };
  }
}
