import { TetrisGame } from './components/TetrisGame';

export default function App() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #000000, #1a0033, #000000)'
    }}>
      <div 
        style={{
          position: 'fixed',
          inset: '0',
          opacity: '0.2',
          backgroundImage: `
            linear-gradient(rgba(3, 225, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(3, 225, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
      
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '80px',
        width: '384px',
        height: '384px',
        borderRadius: '50%',
        filter: 'blur(100px)',
        backgroundColor: 'rgba(3, 225, 255, 0.2)',
        animation: 'pulse 2s ease-in-out infinite'
      }} />
      <div style={{
        position: 'fixed',
        bottom: '80px',
        right: '80px',
        width: '384px',
        height: '384px',
        borderRadius: '50%',
        filter: 'blur(100px)',
        backgroundColor: 'rgba(220, 31, 255, 0.2)',
        animation: 'pulse 2s ease-in-out infinite',
        animationDelay: '1s'
      }} />
      
      <div style={{
        position: 'relative',
        zIndex: '10',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 0'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 
            style={{ 
              fontSize: '3rem',
              fontFamily: 'monospace',
              color: 'transparent',
              backgroundImage: 'linear-gradient(to right, #03E1FF, #DC1FFF, #00FFA3)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              textShadow: '0 0 40px rgba(3,225,255,0.5)',
              marginBottom: '0.5rem'
            }}
          >
            ATOMIC TETRIS
          </h1>
          <p style={{ 
            fontFamily: 'monospace', 
            fontSize: '0.875rem',
            color: '#03E1FF' 
          }}>
            COSMIC DREAMS
          </p>
        </div>
        
        <TetrisGame />
      </div>
    </div>
  );
}
