import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsModal = ({ isOpen, onClose, onSave, initialSettings }) => {
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: (name === 'openLinksIn' || name === 'pointsMetric') ? value : (parseFloat(value) || 0)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card"
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '1.5rem',
            position: 'relative'
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>

          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>Paramètres</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Objectif hebdomadaire (points)
              </label>
              <input
                type="number"
                name="weeklyTarget"
                value={settings.weeklyTarget}
                onChange={handleChange}
                step="0.5"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(0, 0, 0, 0.2)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Semaines de vacances (annuel)
              </label>
              <input
                type="number"
                name="vacationWeeks"
                value={settings.vacationWeeks}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(0, 0, 0, 0.2)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Comportement des liens
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { value: 'app', label: 'Application de bureau (clickup://)' },
                  { value: 'web', label: 'Navigateur Web (https://)' }
                ].map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      cursor: 'pointer',
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${settings.openLinksIn === option.value ? 'var(--accent-blue)' : 'var(--card-border)'}`,
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <input
                      type="radio"
                      name="openLinksIn"
                      value={option.value}
                      checked={settings.openLinksIn === option.value}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${settings.openLinksIn === option.value ? 'var(--accent-blue)' : 'var(--text-secondary)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {settings.openLinksIn === option.value && (
                        <motion.div
                          layoutId="link-radio"
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: 'var(--accent-blue)'
                          }}
                        />
                      )}
                    </div>
                    <span style={{ color: settings.openLinksIn === option.value ? 'white' : 'var(--text-secondary)', fontWeight: 500 }}>
                      {option.label}
                    </span>
                    {settings.openLinksIn === option.value && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'var(--accent-blue)',
                        opacity: 0.05,
                        pointerEvents: 'none'
                      }} />
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Affichage des points
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { value: 'total', label: 'Points totaux (avec multiplicateur)' },
                  { value: 'sprint', label: 'Points Sprint (ClickUp brut)' }
                ].map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      cursor: 'pointer',
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${settings.pointsMetric === option.value ? 'var(--accent-blue)' : 'var(--card-border)'}`,
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <input
                      type="radio"
                      name="pointsMetric"
                      value={option.value}
                      checked={settings.pointsMetric === option.value}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${settings.pointsMetric === option.value ? 'var(--accent-blue)' : 'var(--text-secondary)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {settings.pointsMetric === option.value && (
                        <motion.div
                          layoutId="metric-radio"
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: 'var(--accent-blue)'
                          }}
                        />
                      )}
                    </div>
                    <span style={{ color: settings.pointsMetric === option.value ? 'white' : 'var(--text-secondary)', fontWeight: 500 }}>
                      {option.label}
                    </span>
                    {settings.pointsMetric === option.value && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'var(--accent-blue)',
                        opacity: 0.05,
                        pointerEvents: 'none'
                      }} />
                    )}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent-blue)',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              <Save size={18} />
              Enregistrer
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsModal;
