import React, { useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';

interface CertificateViewProps {
  userName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  score?: number;
  onClose?: () => void;
}

const G  = '#C9A84C';   // gold
const GL = '#E8C96B';   // gold light
const GD = '#8B6914';   // gold dark
const BG = '#FDFAF0';   // cream parchment
const INK = '#2C1A00';  // dark brown ink

const CertificateView: React.FC<CertificateViewProps> = ({
  userName, courseName, completionDate, certificateId, score, onClose
}) => {
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Playfair+Display:wght@700&family=IM+Fell+English:ital@1&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const handleDownload = async () => {
    if (!certRef.current) return;
    await document.fonts.ready;
    const canvas = await html2canvas(certRef.current, {
      scale: 2,
      backgroundColor: BG,
      logging: false,
      useCORS: true,
    });
    const a = document.createElement('a');
    a.download = `certificado-${certificateId}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', background: 'rgba(0,0,0,0.88)',
      backdropFilter: 'blur(6px)',
    }}>

      {/* ── Certificate ───────────────────────────────────────── */}
      <div
        ref={certRef}
        style={{
          background: BG,
          width: '100%',
          maxWidth: '760px',
          fontFamily: 'Cinzel, Georgia, serif',
          border: `1px solid ${G}`,
          borderRadius: '4px',
          padding: '6px',
          boxShadow: '0 12px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Middle border */}
        <div style={{ border: `2px solid ${G}`, padding: '4px', borderRadius: '2px' }}>

          {/* Inner border + content */}
          <div style={{ border: `1px solid ${GL}`, borderRadius: '1px', padding: '26px 36px 20px', position: 'relative', overflow: 'hidden' }}>

            {/* ── Corner ornaments ── */}
            {(['tl','tr','bl','br'] as const).map(pos => {
              const top  = pos.startsWith('t') ? '5px' : undefined;
              const bot  = pos.startsWith('b') ? '5px' : undefined;
              const left = pos.endsWith('l')   ? '5px' : undefined;
              const right= pos.endsWith('r')   ? '5px' : undefined;
              const bt = pos.startsWith('t') ? 'border-top' : 'border-bottom';
              const bl = pos.endsWith('l')   ? 'border-left' : 'border-right';
              const path = pos === 'tl' ? 'M4 36 L4 4 L36 4'
                : pos === 'tr' ? 'M36 36 L36 4 L4 4'
                : pos === 'bl' ? 'M4 4 L4 36 L36 36'
                : 'M36 4 L36 36 L4 36';
              const path2 = pos === 'tl' ? 'M8 36 L8 8 L36 8'
                : pos === 'tr' ? 'M32 36 L32 8 L4 8'
                : pos === 'bl' ? 'M8 4 L8 32 L36 32'
                : 'M32 4 L32 32 L4 32';
              const cx = pos.endsWith('l') ? 4 : 36;
              const cy = pos.startsWith('t') ? 4 : 36;
              void bt; void bl;
              return (
                <svg key={pos} style={{ position:'absolute', top, bottom:bot, left, right, width:'44px', height:'44px' }} viewBox="0 0 40 40">
                  <path d={path}  stroke={G}  strokeWidth="1.8" fill="none"/>
                  <path d={path2} stroke={GL} strokeWidth="0.7" fill="none"/>
                  <circle cx={cx} cy={cy} r="2.5" fill={G}/>
                </svg>
              );
            })}

            {/* ── Top decorative bar ── */}
            <div style={{ textAlign:'center', marginBottom:'8px' }}>
              <svg width="340" height="14" viewBox="0 0 340 14">
                <line x1="0"   y1="7" x2="150" y2="7" stroke={G} strokeWidth="0.8"/>
                <polygon points="155,7 163,3 171,7 163,11" fill={G}/>
                <line x1="175" y1="7" x2="340" y2="7" stroke={G} strokeWidth="0.8"/>
              </svg>
            </div>

            {/* ── Superscript ── */}
            <p style={{ textAlign:'center', fontFamily:'Cinzel,serif', fontSize:'8.5px', letterSpacing:'.38em', color:GD, textTransform:'uppercase', margin:'0 0 10px' }}>
              CapacitaPro &nbsp;·&nbsp; SoldesP S.A.
            </p>

            {/* ── Title ── */}
            <h1 style={{ textAlign:'center', fontFamily:'Cinzel,serif', fontSize:'32px', fontWeight:600, color:INK, letterSpacing:'.1em', lineHeight:1, margin:'0 0 4px' }}>
              CERTIFICADO
            </h1>
            <p style={{ textAlign:'center', fontFamily:'Cinzel,serif', fontSize:'9.5px', letterSpacing:'.38em', color:G, textTransform:'uppercase', margin:'0 0 14px' }}>
              De Finalización &nbsp;·&nbsp; Certificate of Completion
            </p>

            {/* ── Gold separator ── */}
            <div style={{ textAlign:'center', marginBottom:'14px' }}>
              <svg width="280" height="10" viewBox="0 0 280 10">
                <line x1="0"   y1="5" x2="120" y2="5" stroke={G} strokeWidth="0.8"/>
                <circle cx="140" cy="5" r="4" fill="none" stroke={G} strokeWidth="1.2"/>
                <circle cx="140" cy="5" r="1.8" fill={G}/>
                <line x1="160" y1="5" x2="280" y2="5" stroke={G} strokeWidth="0.8"/>
              </svg>
            </div>

            {/* ── Recipient ── */}
            <p style={{ textAlign:'center', fontFamily:'Cinzel,serif', fontSize:'8.5px', letterSpacing:'.3em', color:GD, textTransform:'uppercase', margin:'0 0 7px' }}>
              OTORGADO A
            </p>
            <h2 style={{ textAlign:'center', fontFamily:'"Playfair Display",Georgia,serif', fontSize:'26px', fontWeight:700, color:INK, margin:'0 0 2px', letterSpacing:'.01em' }}>
              {userName}
            </h2>
            <div style={{ width:'180px', height:'1.5px', background:G, margin:'8px auto 14px' }}/>

            {/* ── Course ── */}
            <p style={{ textAlign:'center', fontFamily:'"IM Fell English",Georgia,serif', fontStyle:'italic', fontSize:'13.5px', color:'#5C4A1A', margin:'0 0 5px' }}>
              Por completar exitosamente el programa
            </p>
            <p style={{ textAlign:'center', fontFamily:'Cinzel,serif', fontSize:'13px', fontWeight:600, color:INK, letterSpacing:'.04em', margin:'0 0 14px' }}>
              {courseName}
            </p>

            {/* ── Score badge ── */}
            {score !== undefined && score > 0 && (
              <div style={{ textAlign:'center', marginBottom:'16px' }}>
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:'6px',
                  background:'#FEF3C7', border:`1px solid ${G}`,
                  borderRadius:'20px', padding:'4px 18px',
                  fontSize:'10.5px', fontWeight:600, color:'#78350F',
                  fontFamily:'Cinzel,serif', letterSpacing:'.06em',
                }}>
                  ★ PUNTUACIÓN: {score}%
                </span>
              </div>
            )}

            {/* ── Footer: date | seal | id ── */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:'6px' }}>

              {/* Date */}
              <div style={{ textAlign:'center' }}>
                <div style={{ width:'110px', height:'0.5px', background:G, marginBottom:'5px' }}/>
                <p style={{ fontFamily:'Cinzel,serif', fontSize:'7.5px', letterSpacing:'.18em', color:GD, margin:0, textTransform:'uppercase' }}>
                  {completionDate}
                </p>
              </div>

              {/* Circular seal */}
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="30" fill="none" stroke={G} strokeWidth="1.5" strokeDasharray="5 2.5"/>
                <circle cx="32" cy="32" r="24" fill={BG} stroke={G} strokeWidth="1"/>
                <circle cx="32" cy="32" r="20" fill="none" stroke={GL} strokeWidth="0.5"/>
                <text x="32" y="27" textAnchor="middle" fontFamily="Cinzel,serif" fontSize="8" fill={GD} fontWeight="600">CAPACITA</text>
                <text x="32" y="36" textAnchor="middle" fontFamily="Cinzel,serif" fontSize="7" fill={G}>✦ PRO ✦</text>
                <text x="32" y="44" textAnchor="middle" fontFamily="Cinzel,serif" fontSize="6" fill={GD}>2026</text>
              </svg>

              {/* Verification */}
              <div style={{ textAlign:'center' }}>
                <div style={{ width:'110px', height:'0.5px', background:G, marginBottom:'5px' }}/>
                <p style={{ fontFamily:'Cinzel,serif', fontSize:'7.5px', letterSpacing:'.1em', color:GD, margin:0, textTransform:'uppercase' }}>
                  {certificateId}
                </p>
              </div>
            </div>

            {/* ── Bottom decorative bar ── */}
            <div style={{ textAlign:'center', marginTop:'10px' }}>
              <svg width="340" height="14" viewBox="0 0 340 14">
                <line x1="0"   y1="7" x2="150" y2="7" stroke={G} strokeWidth="0.8"/>
                <polygon points="155,7 163,3 171,7 163,11" fill={G}/>
                <line x1="175" y1="7" x2="340" y2="7" stroke={G} strokeWidth="0.8"/>
              </svg>
            </div>

          </div>
        </div>
      </div>

      {/* ── Action buttons ─────────────────────────────────────── */}
      <div style={{
        position:'absolute', bottom:'2rem', left:'50%', transform:'translateX(-50%)',
        display:'flex', gap:'12px', alignItems:'center',
      }}>
        <button
          onClick={handleDownload}
          style={{
            display:'flex', alignItems:'center', gap:'8px',
            padding:'11px 26px',
            background: G, color: INK,
            fontFamily:'Cinzel,serif', fontWeight:600, fontSize:'12px',
            letterSpacing:'.1em', textTransform:'uppercase',
            border:'none', borderRadius:'6px', cursor:'pointer',
            boxShadow:`0 4px 20px rgba(201,168,76,0.35)`,
          }}
        >
          ↓ Descargar Certificado
        </button>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding:'11px 20px',
              background:'rgba(255,255,255,0.08)',
              color:'rgba(255,255,255,0.8)',
              fontFamily:'Cinzel,serif', fontSize:'11px', letterSpacing:'.1em',
              border:'1px solid rgba(255,255,255,0.15)',
              borderRadius:'6px', cursor:'pointer',
            }}
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
};

export default CertificateView;
