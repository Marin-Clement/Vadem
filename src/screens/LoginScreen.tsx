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
    }}>
      <div style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: 'var(--accent)', margin: '0 auto 16px',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--ff-display)', fontSize: 24, fontWeight: 700, color: '#0a0613',
          }}>V</div>
          <div className="t-display" style={{ fontSize: 28, fontWeight: 600 }}>VADEM</div>
          <div style={{ color: 'var(--fg-3)', fontSize: 13, marginTop: 4 }}>
            League of Legends companion
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" /> Connect your account
            </div>
          </div>
          <div className="panel-body">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div className="t-eyebrow" style={{ marginBottom: 6 }}>RIOT ID</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{
                      flex: 2, padding: '8px 12px', borderRadius: 6,
                      background: 'var(--bg-3)', border: '1px solid var(--line-2)',
                      color: 'var(--fg-0)', fontFamily: 'var(--ff-body)', fontSize: 13,
                      outline: 'none',
                    }}
                    placeholder="Game name"
                    value={gameName}
                    onChange={e => setGameName(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--fg-3)', fontFamily: 'var(--ff-mono)', fontSize: 16 }}>#</div>
                  <input
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 6,
                      background: 'var(--bg-3)', border: '1px solid var(--line-2)',
                      color: 'var(--fg-0)', fontFamily: 'var(--ff-body)', fontSize: 13,
                      outline: 'none',
                    }}
                    placeholder="Tag"
                    value={tagLine}
                    onChange={e => setTagLine(e.target.value.replace(/^#/, ''))}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <div className="t-eyebrow" style={{ marginBottom: 6 }}>REGION</div>
                <select
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 6,
                    background: 'var(--bg-3)', border: '1px solid var(--line-2)',
                    color: 'var(--fg-0)', fontFamily: 'var(--ff-body)', fontSize: 13,
                    outline: 'none', cursor: 'pointer',
                  }}
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  disabled={isLoading}
                >
                  {REGIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: 6,
                  background: 'var(--red-soft)', border: '1px solid var(--red)',
                  fontSize: 12, color: 'var(--red)',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px 0', fontSize: 13 }}
                disabled={isLoading || !gameName.trim() || !tagLine.trim()}
              >
                {isLoading ? 'Connecting…' : 'Connect'}
              </button>
            </form>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--fg-4)' }}>
          Riot ID is looked up via the official Riot API. No password required.
        </div>
      </div>
    </div>
  );
}
