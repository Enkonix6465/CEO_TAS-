import { LoginForm } from "../components/login-form";
import { useEffect, useState } from "react";
import { useThemeStore } from "../store/themeStore";

export default function LoginPage() {
  const { theme } = useThemeStore();
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [trails, setTrails] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [clickEffects, setClickEffects] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [hoverEffects, setHoverEffects] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [particleEffects, setParticleEffects] = useState<Array<{ x: number; y: number; id: number; vx: number; vy: number }>>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      
      // Enhanced trail effect with varying sizes
      const newTrail = { x: e.clientX, y: e.clientY, id: Date.now() };
      setTrails(prev => [...prev.slice(-8), newTrail]);

      // Random hover particles
      if (Math.random() < 0.08) {
        const particle = {
          x: e.clientX + (Math.random() - 0.5) * 30,
          y: e.clientY + (Math.random() - 0.5) * 30,
          id: Date.now() + Math.random(),
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5
        };
        setParticleEffects(prev => [...prev.slice(-10), particle]);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const newEffect = { x: e.clientX, y: e.clientY, id: Date.now() };
      setClickEffects(prev => [...prev, newEffect]);
      
      // Create ripple effects
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          const ripple = { 
            x: e.clientX + (Math.random() - 0.5) * 15, 
            y: e.clientY + (Math.random() - 0.5) * 15, 
            id: Date.now() + i 
          };
          setHoverEffects(prev => [...prev, ripple]);
        }, i * 80);
      }
      
      setTimeout(() => {
        setClickEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
      }, 600);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    const hoverCleanup = setInterval(() => {
      setHoverEffects(prev => prev.filter(effect => Date.now() - effect.id < 800));
      setParticleEffects(prev => prev.filter(effect => Date.now() - effect.id < 1500));
    }, 100);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      clearInterval(hoverCleanup);
    };
  }, []);

  return (
    <div className={`min-h-screen relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
      {/* Liquid Glass Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary Liquid Glass Blob */}
        <div className={`liquid-glass-blob liquid-glass-primary ${theme === 'dark' ? 'dark' : ''}`}></div>
        
        {/* Secondary Flowing Glass Elements */}
        <div className={`liquid-glass-blob liquid-glass-secondary ${theme === 'dark' ? 'dark' : ''}`}></div>
        
        {/* Tertiary Glass Morphs */}
        <div className={`liquid-glass-blob liquid-glass-tertiary ${theme === 'dark' ? 'dark' : ''}`}></div>
        
        {/* Ambient Glass Orbs */}
        <div className={`liquid-glass-orb liquid-glass-orb-1 ${theme === 'dark' ? 'dark' : ''}`}></div>
        <div className={`liquid-glass-orb liquid-glass-orb-2 ${theme === 'dark' ? 'dark' : ''}`}></div>
        <div className={`liquid-glass-orb liquid-glass-orb-3 ${theme === 'dark' ? 'dark' : ''}`}></div>
        
        {/* Flowing Glass Streams */}
        <div className={`liquid-glass-stream liquid-glass-stream-1 ${theme === 'dark' ? 'dark' : ''}`}></div>
        <div className={`liquid-glass-stream liquid-glass-stream-2 ${theme === 'dark' ? 'dark' : ''}`}></div>
        
        {/* Glass Particle System */}
        <div className="glass-particles">
          {Array.from({ length: 12 }).map((_, i) => (
            <div 
              key={i} 
              className={`glass-particle glass-particle-${i + 1} ${theme === 'dark' ? 'dark' : ''}`}
              style={{ animationDelay: `${i * 0.8}s` }}
            ></div>
          ))}
        </div>
        
        {/* Dynamic Glass Waves */}
        <div className={`glass-wave glass-wave-1 ${theme === 'dark' ? 'dark' : ''}`}></div>
        <div className={`glass-wave glass-wave-2 ${theme === 'dark' ? 'dark' : ''}`}></div>
        <div className={`glass-wave glass-wave-3 ${theme === 'dark' ? 'dark' : ''}`}></div>
      </div>

      {/* Enhanced Cursor with Glass Effect */}
      <div 
        className="cursor-liquid-glass"
        style={{ 
          left: cursorPos.x - 10, 
          top: cursorPos.y - 10,
          transform: `translate3d(0, 0, 0)`
        }}
      />

      {/* Liquid Glass Cursor Trails */}
      {trails.map((trail, index) => (
        <div
          key={trail.id}
          className="cursor-trail-liquid"
          style={{
            left: trail.x - (2 + index * 0.3),
            top: trail.y - (2 + index * 0.3),
            opacity: (index + 1) / trails.length * 0.6,
            transform: `scale(${0.4 + (index + 1) / trails.length * 0.6})`
          }}
        />
      ))}

      {/* Glass Particle Effects */}
      {particleEffects.map((particle, index) => (
        <div
          key={particle.id}
          className="particle-glass-effect"
          style={{
            left: particle.x - 1.5,
            top: particle.y - 1.5,
            opacity: 0.7,
            transform: `translate(${particle.vx * 8}px, ${particle.vy * 8}px) scale(${Math.random() * 0.6 + 0.4})`
          }}
        />
      ))}

      {/* Enhanced Glass Click Effects */}
      {clickEffects.map((effect) => (
        <div
          key={effect.id}
          className="cursor-click-glass"
          style={{
            left: effect.x - 12,
            top: effect.y - 12
          }}
        />
      ))}

      {/* Glass Ripple Effects */}
      {hoverEffects.map((effect) => (
        <div
          key={effect.id}
          className="glass-ripple-effect"
          style={{
            left: effect.x - 6,
            top: effect.y - 6
          }}
        />
      ))}
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <LoginForm />
      </div>
    </div>
  );
}
