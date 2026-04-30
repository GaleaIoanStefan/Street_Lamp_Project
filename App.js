import React, { useState, useEffect, useRef } from 'react';

const LOLIN_IP = "10.181.157.83"; 

function App() {
  const [data, setData] = useState({ lumina: 0, avg: 0, threshold: 50 });
  const [inputVal, setInputVal] = useState(50);
  const [status, setStatus] = useState("Connecting...");
  
  const ws = useRef(null);
  const watchdogTimer = useRef(null);

  useEffect(() => {
    const connect = () => {
      console.log("Attempting connection...");
      ws.current = new WebSocket(`ws://${LOLIN_IP}/ws`);

      const resetWatchdog = () => {
        if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
        watchdogTimer.current = setTimeout(() => {
          console.warn("Watchdog: No data received for 5 seconds. Reconnecting...");
          if (ws.current) ws.current.close(); 
        }, 5000); 
      };

      ws.current.onopen = () => {
        setStatus("Connected to Lolin32");
        resetWatchdog();
      };

      ws.current.onclose = () => {
        setStatus("Disconnected. Retrying...");
        if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
        setTimeout(connect, 2000);
      };

      ws.current.onmessage = (event) => {
        try {
          const incoming = JSON.parse(event.data);
          setData(prev => ({ ...prev, ...incoming }));
          resetWatchdog(); 
        } catch (e) {
          console.error("JSON Error:", e);
        }
      };

      ws.current.onerror = (err) => {
        console.error("WebSocket Error:", err);
        if (ws.current) ws.current.close();
      };
    };

    connect();
    return () => {
      if (ws.current) ws.current.close();
      if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    };
  }, []);

  const sendUpdate = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ threshold: parseInt(inputVal) }));
    } else {
      alert("No connection established!");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Smart Street Lamp Monitor</h1>
      <p style={{ ...styles.status, color: status.includes("Connected") ? "#0fefad" : "#ff4d4d" }}>{status}</p>
      
      <div style={styles.cardMain}>
        <h2 style={styles.avgTitle}>Light Intensity: <span style={styles.highlight}>{data.avg}%</span></h2>
        <p style={styles.rawText}>Instant Sensor Reading: {data.lumina}%</p>
        <div style={styles.progressContainer}>
          <div style={{ ...styles.progressBar, width: `${data.avg}%`, boxShadow: `0 0 15px ${data.avg > 0 ? '#0fefad' : 'transparent'}` }} />
        </div>
        <div style={styles.scaleLabels}>
          <span>0% (Darkness)</span>
          <span>100% (Light)</span>
        </div>
      </div>

      <div style={styles.cardSettings}>
        <h3 style={styles.settingsTitle}>Threshold Level: {data.threshold}%</h3>
        <p style={styles.infoText}>The lamp turns on when the average falls below this level</p>
        <div style={styles.inputGroup}>
          <input 
            type="number" 
            min="0" 
            max="100" 
            value={inputVal} 
            onChange={(e) => setInputVal(e.target.value)} 
            style={styles.input} 
          />
          <span style={styles.percentSymbol}>%</span>
          <button onClick={sendUpdate} style={styles.button}>UPDATE</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
    container: { backgroundColor: '#1a1a2e', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '20px' },
    title: { color: '#e94560', fontSize: '2.5rem', marginBottom: '10px' },
    status: { fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '30px' },
    cardMain: { border: '2px solid #0fefad', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '500px', backgroundColor: '#16213e', marginBottom: '20px' },
    avgTitle: { fontSize: '1.8rem', margin: '0 0 10px 0' },
    highlight: { color: '#0fefad', fontSize: '2.2rem' },
    rawText: { color: '#95a5a6', marginBottom: '20px' },
    progressContainer: { width: '100%', backgroundColor: '#0f3460', height: '25px', borderRadius: '12px', overflow: 'hidden' },
    progressBar: { backgroundColor: '#0fefad', height: '100%', borderRadius: '12px', transition: 'width 0.4s ease-out' },
    scaleLabels: { display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.8rem', color: '#95a5a6' },
    cardSettings: { border: '1px solid #e94560', borderRadius: '20px', padding: '25px', width: '100%', maxWidth: '500px', backgroundColor: 'rgba(233, 69, 96, 0.05)' },
    settingsTitle: { margin: '0 0 5px 0', fontSize: '1.4rem' },
    infoText: { fontSize: '0.9rem', color: '#95a5a6', marginBottom: '20px' },
    inputGroup: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
    input: { width: '80px', padding: '12px', borderRadius: '10px', border: 'none', fontSize: '1.2rem', textAlign: 'center' },
    percentSymbol: { fontSize: '1.5rem', fontWeight: 'bold' },
    button: { padding: '12px 25px', backgroundColor: '#e94560', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }
};

export default App;