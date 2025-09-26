import pRetry from "p-retry";

export async function safeJson<T>(url: string, init?: RequestInit): Promise<T|null> {
  try { 
    const r = await pRetry(() => fetch(url, { cache: "no-store", ...init }), { retries: 2 }); 
    if (!r.ok) return null; 
    return await r.json(); 
  }
  catch { 
    return null; 
  }
}

export function now(){ 
  return Date.now(); 
}

export function pct(a: number, b: number){ 
  if(!isFinite(a)||!isFinite(b)||b===0) return 0; 
  return (a-b)/Math.abs(b); 
}
