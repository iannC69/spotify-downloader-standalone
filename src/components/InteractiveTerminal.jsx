import { useState, useRef, useEffect } from 'react';
import './InteractiveTerminal.css';

export default function InteractiveTerminal() {
  const [history, setHistory] = useState([
    { type: 'input', text: '/update title:"v2.4 Live"' },
    { type: 'output', text: '> Generând patch notes...' },
    { type: 'success', text: '> Succes! Trimis pe canal.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  const focusInput = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const newCmd = inputValue.trim();
    setHistory(prev => [...prev, { type: 'input', text: newCmd }]);
    setInputValue('');
    setIsTyping(true);

    // Mock processing logic
    setTimeout(() => {
      setHistory(prev => [...prev, { type: 'output', text: '> Analyzing request...' }]);
      
      setTimeout(() => {
        if (newCmd.includes('/update')) {
          setHistory(prev => [
            ...prev, 
            { type: 'output', text: '> Compiling patch notes...' },
            { type: 'success', text: '> SUCCESS. Sent to Discord channel.' }
          ]);
        } else if (newCmd.includes('ping')) {
          setHistory(prev => [...prev, { type: 'output', text: '> Pong! 12ms' }]);
        } else {
          setHistory(prev => [...prev, { type: 'error', text: `> Command not found: ${newCmd.split(' ')[0]}` }]);
        }
        setIsTyping(false);
      }, 800);
    }, 400);
  };

  return (
    <div className="interactive-terminal" onClick={focusInput}>
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot dot-red"></span>
          <span className="dot dot-yellow"></span>
          <span className="dot dot-green"></span>
        </div>
        <div className="terminal-title">bash - iannc@server</div>
      </div>
      <div className="terminal-body" ref={terminalRef}>
        {history.map((line, i) => (
          <div key={i} className={`terminal-line ${line.type}`}>
            {line.text}
          </div>
        ))}
        <form onSubmit={handleSubmit} className="terminal-input-row">
          <span className="terminal-prompt">iannc@cli:~$</span>
          <input 
            ref={inputRef}
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            spellCheck="false"
            autoComplete="off"
            className="terminal-input"
            autoFocus
          />
        </form>
      </div>
    </div>
  );
}
