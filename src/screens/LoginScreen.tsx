import { useState, FormEvent } from 'react';
import { useAuthStore } from '../store/authStore';

const REGIONS = [
  { value: 'euw1', label: 'EUW — Europe West' },
  { value: 'eun1', label: 'EUNE — Europe Nordic & East' },
  { value: 'na1',  label: 'NA — North America' },
  { value: 'kr',   label: 'KR — Korea' },
  { value: 'br1',  label: 'BR — Brazil' },
  { value: 'jp1',  label: 'JP — Japan' },
  { value: 'oc1',  label: 'OCE — Oceania' },
  { value: 'tr1',  label: 'TR — Turkey' },
  { value: 'ru1',  label: 'RU — Russia' },
  { value: 'me1',  label: 'ME — Middle East' },
];

export function LoginScreen() {
  const { connect, isLoading, error, clearError } = useAuthStore();
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [region, setRegion] = useState('euw1');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = gameName.trim();
    const tag = tagLine.replace(/^#/, '').trim();
    if (!name || !tag) return;
    clearError();
    connect(name, tag, region);
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'grid', placeItems: 'center',
      background: 'var(--bg-0)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.68 0.20 295 / 0.07) 0%, transparent 70%)',
      }} />

      <div style={{ width: 420, position: 'relative' }}>
        {/* logo + wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 68, height: 68,
            background: 'var(--accent)',
            borderRadius: 16,
            margin: '0 auto 20px',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 0 0 1px oklch(0.68 0.20 295 / 0.5), 0 0 32px oklch(0.68 0.20 295 / 0.35), 0 8px 24px rgba(0,0,0,0.5)',
          }}>
            <span style={{
              fontFamily: 'var(--ff-display)', fontSize: 28, fontWeight: 700, color: '#0a0613',
              letterSpacing: '-0.04em',
            }}>V</span>
          </div>

          <div className="t-display" style={{
            fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em',
            lineHeight: 1, color: 'var(--fg-0)',
          }}>VADEM</div>

          <div style={{
            fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: 'var(--fg-3)', marginTop: 8,
          }}>
            League of Legends companion
          </div>
        </div>

        {/* card */}
        <div className="panel tactical" style={{
          boxShadow: 'var(--shadow-2)',
          border: '1px solid var(--line-2)',
        }}>
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" /> Connect your account
            </div>
          </div>

          <div className="panel-body" style={{ padding: 20 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Riot ID */}
              <div>
                <div className="t-eyebrow" style={{ marginBottom: 8 }}>Riot ID</div>
                <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                  <input
                    className="login-input"
                    style={{ flex: 2, borderRadius: 'var(--r-2) 0 0 var(--r-2)', borderRight: 0 }}
                    placeholder="Game name"
                    value={gameName}
                    onChange={e => setGameName(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, flexShrink: 0,
                    background: 'var(--bg-4)', border: '1px solid var(--line-2)', borderLeft: 0, borderRight: 0,
                    color: 'var(--accent)', fontFamily: 'var(--ff-mono)', fontSize: 15, fontWeight: 700,
                  }}>#</div>
                  <input
                    className="login-input"
                    style={{ flex: 1, borderRadius: '0 var(--r-2) var(--r-2) 0', borderLeft: 0 }}
                    placeholder="Tag"
                    value={tagLine}
                    onChange={e => setTagLine(e.target.value.replace(/^#/, ''))}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Region */}
              <div>
                <div className="t-eyebrow" style={{ marginBottom: 8 }}>Region</div>
                <select
                  className="login-select"
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  disabled={isLoading}
                >
                  {REGIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--r-2)',
                  background: 'oklch(0.68 0.22 25 / 0.12)', border: '1px solid oklch(0.68 0.22 25 / 0.5)',
                  fontSize: 12, color: 'var(--red)', lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%', height: 42, fontSize: 12,
                  fontFamily: 'var(--ff-mono)', letterSpacing: '0.12em',
                  textTransform: 'uppercase', fontWeight: 700,
                  boxShadow: isLoading || !gameName.trim() || !tagLine.trim()
                    ? 'none'
                    : '0 0 16px oklch(0.68 0.20 295 / 0.3)',
                  transition: 'all 140ms',
                }}
                disabled={isLoading || !gameName.trim() || !tagLine.trim()}
              >
                {isLoading ? 'Connecting…' : 'Connect'}
              </button>
            </form>
          </div>
        </div>

        {/* footer note */}
        <div style={{
          textAlign: 'center', marginTop: 18,
          fontFamily: 'var(--ff-mono)', fontSize: 10,
          color: 'var(--fg-4)', letterSpacing: '0.06em',
        }}>
          Riot ID is looked up via the official Riot API — no password required.
        </div>
      </div>
    </div>
  );
}
