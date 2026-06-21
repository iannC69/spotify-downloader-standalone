import { useEffect, useRef, useState } from 'react';
import './MatrixRain.css';

export default function MatrixRain({ active }) {
  const canvasRef = useRef(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!active) return;

    // Trigger matrix theme globally
    document.documentElement.setAttribute('data-theme', 'lime');
    
    // Show modal shortly after rain starts
    const timer = setTimeout(() => setShowModal(true), 2500);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~';
    const matrix = letters.split('');

    const fontSize = 16;
    const columns = canvas.width / fontSize;

    const drops = [];
    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0';
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = matrix[Math.floor(Math.random() * matrix.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="matrix-overlay">
      <canvas ref={canvasRef} className="matrix-canvas"></canvas>
      
      {showModal && (
        <div className="matrix-modal-wrapper">
          <div className="matrix-modal-content">
            <h2 className="glitch-text" data-text="ACCESS GRANTED">ACCESS GRANTED</h2>
            <p className="typewriter-text">{'>'} Welcome back, Admin. System is fully operational.</p>
            <div className="matrix-btn-group">
              <button className="matrix-btn" onClick={() => window.location.href='/admin'}>
                [ ENTER_COMMAND_CENTER ]
              </button>
              <button className="matrix-btn outline" onClick={() => window.location.reload()}>
                [ DISCONNECT ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
