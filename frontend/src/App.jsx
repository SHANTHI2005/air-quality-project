import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Wind, 
  RefreshCw, 
  Clock, 
  AlertCircle, 
  Calendar,
  Info,
  ChevronRight,
  TrendingDown,
  Activity,
  Bot,
  Send,
  Sparkles
} from 'lucide-react'
import './App.css'

const API_URL = 'http://localhost:8081/api/air-quality/recent'
const AUTO_REFRESH_INTERVAL = 30000 // 30 seconds

function App() {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastFetchTime, setLastFetchTime] = useState(null)

  // Chat Assistant States
  const [chatHistory, setChatHistory] = useState([
    { 
      role: 'assistant', 
      content: 'Hello! I am your Hyderabad Air Quality Assistant. Ask me anything about the current air conditions, safety recommendations, or what the pollutant metrics mean.' 
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState(null)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory, chatLoading])

  const handleSendMessage = async (messageText) => {
    const textToSend = messageText || inputMessage
    if (!textToSend.trim()) return

    // Clear input if sending from input box
    if (!messageText) {
      setInputMessage('')
    }

    // Add user message to history
    const userMessage = { role: 'user', content: textToSend }
    const updatedHistory = [...chatHistory, userMessage]
    setChatHistory(updatedHistory)
    setChatLoading(true)
    setChatError(null)

    try {
      // 1. Fetch latest data first
      let currentReading = latestReading
      try {
        const response = await fetch(API_URL)
        if (response.ok) {
          const data = await response.json()
          setReadings(data)
          if (data && data.length > 0) {
            currentReading = data[0]
          }
        }
      } catch (fetchErr) {
        console.warn("Failed to fetch fresh data for chat assistant. Using existing data.", fetchErr)
      }

      // 2. Prepare system prompt with latest reading context
      const currentAqiInfo = currentReading ? getAqiInfo(currentReading.aqi) : null
      const systemPrompt = `You are a helpful Air Quality AI Assistant for Hyderabad.
Here is the latest air quality data from the monitor:
${currentReading ? `
- Timestamp: ${currentReading.timestamp}
- AQI Index: ${currentReading.aqi} (Classification: ${currentAqiInfo?.label || 'Unknown'})
- PM2.5: ${currentReading.pm2_5} µg/m³
- PM10: ${currentReading.pm10} µg/m³
- CO: ${currentReading.co} µg/m³
- NO2: ${currentReading.no2} µg/m³
- O3: ${currentReading.o3} µg/m³
` : 'No air quality data is currently available in the database.'}

Use this real-time data to answer the user's questions. Provide health recommendations if they ask about safety. If they ask general questions about air pollutants (like PM2.5, PM10, CO, NO2, O3), explain them clearly. Keep responses concise, clear, and formatted in markdown.`

      // 3. Prepare Anthropic payload
      const apiKey = import.meta.env.VITE_ANTHROPIC_KEY
      if (!apiKey) {
        throw new Error("Anthropic API key is missing. Please set VITE_ANTHROPIC_KEY in your .env file and restart the development server.")
      }

      // Format messages history for Claude (only role and content)
      const apiMessages = updatedHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages: apiMessages
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error?.message || `Claude API returned status ${response.status} ${response.statusText}`)
      }

      const resData = await response.json()
      if (resData.content && resData.content.length > 0 && resData.content[0].text) {
        const reply = resData.content[0].text
        setChatHistory(prev => [...prev, { role: 'assistant', content: reply }])
      } else {
        throw new Error("Invalid response format received from Claude API.")
      }
    } catch (err) {
      console.error("Chat assistant error:", err)
      setChatError(err.message || "Failed to communicate with the AI assistant.")
    } finally {
      setChatLoading(false)
    }
  }

  const renderMessageContent = (text) => {
    if (!text) return null
    // Simple markdown renderer for bold, lists, and paragraphs
    const paragraphs = text.split('\n\n')
    return paragraphs.map((pText, pIdx) => {
      const lines = pText.split('\n')
      
      // Check if it's a list
      const isList = lines.every(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))
      if (isList && lines.length > 0) {
        return (
          <ul key={pIdx} style={{ paddingLeft: '1.2rem', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
            {lines.map((line, lIdx) => {
              const cleanLine = line.trim().substring(2)
              const formatted = cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              return <li key={lIdx} dangerouslySetInnerHTML={{ __html: formatted }} style={{ marginBottom: '0.25rem' }} />
            })}
          </ul>
        )
      }
      
      // Standard paragraph
      const formatted = pText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />')
      return <p key={pIdx} dangerouslySetInnerHTML={{ __html: formatted }} style={{ marginBottom: '0.5rem' }} />
    })
  }

  const fetchAirQualityData = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      setReadings(data)
      setLastFetchTime(new Date())
    } catch (err) {
      console.error('Error fetching air quality data:', err)
      setError(err.message || 'Failed to fetch air quality data. Please check if backend is running.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial fetch and auto polling
  useEffect(() => {
    fetchAirQualityData()

    const intervalId = setInterval(() => {
      fetchAirQualityData()
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(intervalId)
  }, [fetchAirQualityData])

  const handleRefresh = () => {
    fetchAirQualityData(true)
  }

  // Get details for AQI ranges
  const getAqiInfo = (aqiValue) => {
    const val = Number(aqiValue)
    if (val === 1) {
      return {
        class: 'state-good',
        label: 'Good',
        desc: 'Air quality is satisfactory, and air pollution poses little or no risk.',
        pillClass: 'level-1'
      }
    } else if (val >= 2 && val <= 3) {
      return {
        class: 'state-mod',
        label: val === 2 ? 'Satisfactory' : 'Moderate',
        desc: 'Air quality is acceptable. However, there may be risk for some individuals, particularly those sensitive to air pollution.',
        pillClass: `level-${val}`
      }
    } else if (val >= 4 && val <= 5) {
      return {
        class: 'state-poor',
        label: val === 4 ? 'Poor' : 'Very Poor',
        desc: 'Health alert: Everyone may experience health effects. Sensitive groups should avoid outdoor exertion.',
        pillClass: `level-${val}`
      }
    }
    return {
      class: 'state-good',
      label: 'Unknown',
      desc: 'No AQI classification available.',
      pillClass: 'level-unknown'
    }
  }

  // Helper to format timestamp
  const formatTimestamp = (tsString) => {
    if (!tsString) return 'N/A'
    try {
      // Input is usually "YYYY-MM-DD HH:mm:ss"
      const date = new Date(tsString.replace(' ', 'T'))
      if (isNaN(date.getTime())) return tsString
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ', ' +
             date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    } catch (e) {
      return tsString
    }
  }

  // Helper to format last updated difference
  const formatLastUpdated = (date) => {
    if (!date) return 'Never'
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  // Extract latest reading
  const latestReading = readings && readings.length > 0 ? readings[0] : null
  const aqiInfo = latestReading ? getAqiInfo(latestReading.aqi) : null

  if (loading && readings.length === 0) {
    return (
      <div className="app-container" id="dashboard-app">
        <header className="dashboard-header">
          <div className="header-title-area">
            <Wind className="logo-icon" />
            <h1 className="dashboard-title">Air Quality Monitor - Hyderabad</h1>
          </div>
        </header>
        <div className="loader-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading real-time air quality metrics...</p>
        </div>
      </div>
    )
  }

  if (error && readings.length === 0) {
    return (
      <div className="app-container" id="dashboard-app">
        <header className="dashboard-header">
          <div className="header-title-area">
            <Wind className="logo-icon" />
            <h1 className="dashboard-title">Air Quality Monitor - Hyderabad</h1>
          </div>
        </header>
        <div className="error-container glass">
          <div className="error-icon-wrapper">
            <AlertCircle size={36} />
          </div>
          <h2 className="error-title">Connection Error</h2>
          <p className="error-message">
            {error}. Make sure the server is active on <code>http://localhost:8081</code> and database is initialized.
          </p>
          <button type="button" className="retry-btn" onClick={handleRefresh}>
            Try Connecting Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container" id="dashboard-app">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-title-area">
          <Wind className="logo-icon" />
          <h1 className="dashboard-title">Air Quality Monitor - Hyderabad</h1>
        </div>
        <div className="header-actions">
          {lastFetchTime && (
            <div className="last-updated">
              <Clock size={16} />
              <span>Refreshed: {formatLastUpdated(lastFetchTime)}</span>
            </div>
          )}
          <button 
            type="button" 
            className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh data"
          >
            <RefreshCw size={16} />
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="dashboard-grid">
        
        {/* Left Side: Current AQI overview */}
        {latestReading ? (
          <section className={`aqi-overview-card glass ${aqiInfo.class} animate-fade-in`} id="aqi-card">
            <span className="card-label">Current Status</span>
            
            <div className="aqi-gauge-container">
              <div className="aqi-gauge-circle"></div>
              <div className="aqi-gauge-value">
                <span className="aqi-number">{latestReading.aqi}</span>
                <span className="aqi-label">AQI INDEX</span>
              </div>
            </div>

            <div className="aqi-status-badge">
              {aqiInfo.label}
            </div>

            <p className="aqi-desc">
              {aqiInfo.desc}
            </p>

            {/* Pollutants subgrid */}
            <div className="metrics-subgrid">
              <div className="metric-mini-card">
                <span className="metric-mini-label">PM2.5 <span className="unit">µg/m³</span></span>
                <span className="metric-mini-val">{latestReading.pm2_5?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="metric-mini-card">
                <span className="metric-mini-label">PM10 <span className="unit">µg/m³</span></span>
                <span className="metric-mini-val">{latestReading.pm10?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="metric-mini-card">
                <span className="metric-mini-label">CO <span className="unit">µg/m³</span></span>
                <span className="metric-mini-val">{latestReading.co?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="metric-mini-card">
                <span className="metric-mini-label">NO₂ <span className="unit">µg/m³</span></span>
                <span className="metric-mini-val">{latestReading.no2?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="metric-mini-card">
                <span className="metric-mini-label">O₃ <span className="unit">µg/m³</span></span>
                <span className="metric-mini-val">{latestReading.o3?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="metric-mini-card">
                <span className="metric-mini-label">Status <span className="unit">Health</span></span>
                <span className="metric-mini-val" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Activity size={14} style={{ color: 'var(--color-primary)' }} /> Live Data
                </span>
              </div>
            </div>
          </section>
        ) : (
          <div className="glass empty-state animate-fade-in">
            <Info className="empty-icon" />
            <p>No recent readings found in the database.</p>
          </div>
        )}

        {/* Right Side: Readings History Table */}
        <section className="history-section animate-fade-in" id="history-section">
          <div className="section-header-row">
            <Calendar className="section-icon" />
            <h2 className="section-title">Recent Air Quality Readings</h2>
          </div>

          <div className="table-wrapper">
            <table className="readings-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'center' }}>AQI</th>
                  <th>PM2.5</th>
                  <th>PM10</th>
                  <th>CO</th>
                  <th>NO₂</th>
                  <th>O₃</th>
                </tr>
              </thead>
              <tbody>
                {refreshing && readings.length === 0 ? (
                  // Show skeletal loader rows if we are refreshing from scratch
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="skeleton-row">
                      <td colSpan="7"><div className="skeleton-text"></div></td>
                    </tr>
                  ))
                ) : readings.length > 0 ? (
                  readings.map((reading) => {
                    const rowInfo = getAqiInfo(reading.aqi)
                    return (
                      <tr key={reading.id || reading.timestamp}>
                        <td className="td-timestamp">{formatTimestamp(reading.timestamp)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`aqi-pill ${rowInfo.pillClass}`}>
                            Level {reading.aqi}
                          </span>
                        </td>
                        <td className="td-highlight">{reading.pm2_5?.toFixed(1) || '0.0'}</td>
                        <td>{reading.pm10?.toFixed(1) || '0.0'}</td>
                        <td>{reading.co?.toFixed(1) || '0.0'}</td>
                        <td>{reading.no2?.toFixed(1) || '0.0'}</td>
                        <td>{reading.o3?.toFixed(1) || '0.0'}</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <Info size={24} />
                        <span>No readings recorded yet</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* AI Chat Assistant Section */}
      <section className="chat-section animate-fade-in" id="chat-section">
        <div className="section-header-row">
          <Bot className="section-icon" />
          <h2 className="section-title">AQI AI Advisor</h2>
        </div>

        <div className="chat-box-glass glass">
          <div className="chat-header">
            <div className="chat-header-info">
              <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
              <span className="chat-title">Hyderabad AQI Advisor</span>
              <span className="chat-badge">Claude AI</span>
            </div>
            <div className="last-updated" style={{ margin: 0, padding: '0.25rem 0.75rem' }}>
              <Clock size={12} />
              <span style={{ fontSize: '0.75rem' }}>Context: {latestReading ? `AQI ${latestReading.aqi}` : 'Offline'}</span>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages-container">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                <span className="message-sender">
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </span>
                <div className="message-bubble">
                  {msg.role === 'user' ? (
                    <p>{msg.content}</p>
                  ) : (
                    renderMessageContent(msg.content)
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="chat-message assistant">
                <span className="message-sender">AI Assistant</span>
                <div className="message-bubble" style={{ padding: '0.5rem' }}>
                  <div className="chat-loading-bubble">
                    <div className="chat-loading-dot"></div>
                    <div className="chat-loading-dot"></div>
                    <div className="chat-loading-dot"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner */}
          {chatError && (
            <div className="chat-error-banner">
              <AlertCircle size={16} />
              <span>{chatError}</span>
            </div>
          )}

          {/* Suggestions */}
          <div className="suggestions-container">
            <button 
              type="button" 
              className="suggestion-chip" 
              onClick={() => handleSendMessage("Is it safe to go outside?")}
              disabled={chatLoading}
            >
              "Is it safe to go outside?"
            </button>
            <button 
              type="button" 
              className="suggestion-chip" 
              onClick={() => handleSendMessage("What does PM2.5 mean?")}
              disabled={chatLoading}
            >
              "What does PM2.5 mean?"
            </button>
            <button 
              type="button" 
              className="suggestion-chip" 
              onClick={() => handleSendMessage("How is Hyderabad's air today?")}
              disabled={chatLoading}
            >
              "How is Hyderabad's air today?"
            </button>
          </div>

          {/* Input Form */}
          <form 
            className="chat-input-form" 
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
          >
            <input
              type="text"
              className="chat-input-field"
              placeholder="Ask anything about Hyderabad's air quality..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={chatLoading}
              aria-label="Chat input query"
            />
            <button 
              type="submit" 
              className="chat-send-btn" 
              disabled={chatLoading || !inputMessage.trim()}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="dashboard-footer">
        <span className="footer-credits">Hyderabad Air Quality Station Dashboard</span>
        <span>Data auto-updates every 30 seconds • Powered by React & Spring Boot</span>
      </footer>
    </div>
  )
}

export default App
