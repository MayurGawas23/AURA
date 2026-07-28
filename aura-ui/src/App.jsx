import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Search, FileText, Code, BarChart2, Eye, Sparkles, Send, Paperclip, Loader2, CheckCircle2, Wrench, GitCommit, Copy, Check, Upload, X, History, Plus, MessageSquare, TrendingUp, Table, Activity, BarChart, FileCode, Trash2, Cpu, ArrowUpRight, User } from 'lucide-react';

const rawApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/$/, '');

// Helper to extract clean file name from full path
const getFileName = (pathStr) => {
  if (!pathStr) return '';
  const parts = String(pathStr).split(/[/\\]/);
  return parts[parts.length - 1];
};

// Markdown Content Sanitizer (Fixes single-line table formatting into clean multi-line tables)
const formatMarkdownContent = (rawText) => {
  if (!rawText) return '*(No content returned from server)*';
  let formatted = String(rawText);
  
  // Replace single-line markdown pipe table joins "| |" with "|\n|"
  formatted = formatted.replace(/\|\s*\|/g, '|\n|');
  
  return formatted;
};

const CodeBlock = ({ children }) => {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
        <span className="font-mono text-slate-300">Code Snippet</span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 hover:text-indigo-400 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
};

// Dual-Engine Interactive Visual Chart & Graph Renderer
const DataChartRenderer = ({ text }) => {
  if (!text) return null;
  let chartData = null;

  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      chartData = JSON.parse(jsonMatch[1]);
    }
  } catch (err) {
    console.error("JSON chart parse attempt:", err);
  }

  if (!chartData || !Array.isArray(chartData.data) || chartData.data.length === 0) {
    try {
      const tableLines = text.split('\n').filter((line) => line.trim().startsWith('|'));
      if (tableLines.length >= 3) {
        const rows = tableLines.slice(2);
        const extractedData = [];

        for (const row of rows) {
          const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
          if (cells.length >= 2) {
            const label = cells[0].replace(/_/g, ' ');
            const rawVal = cells[1];
            const numVal = parseFloat(rawVal);
            if (!isNaN(numVal) && isFinite(numVal)) {
              extractedData.push({ label, value: numVal });
            }
          }
        }

        if (extractedData.length > 0) {
          chartData = {
            title: "Tabular Dataset Metrics Visualization",
            x_label: "Column Categories",
            y_label: "Metric Values",
            data: extractedData.slice(0, 8)
          };
        }
      }
    } catch (err) {
      console.error("Markdown table parse attempt:", err);
    }
  }

  if (!chartData || !Array.isArray(chartData.data) || chartData.data.length === 0) {
    return null;
  }

  const values = chartData.data.map((d) => Number(d.value) || 0);
  const maxValue = Math.max(...values, 1);
  const avgValue = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
  const maxItem = chartData.data.reduce((prev, current) => (Number(current.value) > Number(prev.value) ? current : prev), chartData.data[0]);

  return (
    <div className="my-6 bg-slate-950 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
            <BarChart className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">{chartData.title || 'Interactive Data Visualization'}</h3>
            <p className="text-xs text-slate-400">{chartData.x_label || 'Category'} vs {chartData.y_label || 'Value'}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Visual Graph Active</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Highest Peak Metric</p>
          <p className="text-base font-bold text-emerald-400 truncate mt-1">{maxItem?.label}: {maxItem?.value}</p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Mean Average</p>
          <p className="text-base font-bold text-cyan-400 mt-1">{avgValue}</p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Total Categories</p>
          <p className="text-base font-bold text-indigo-400 mt-1">{chartData.data.length} Visualized</p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {chartData.data.map((item, idx) => {
          const val = Number(item.value) || 0;
          const pct = Math.min(100, Math.max(8, (val / maxValue) * 100));

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-200 capitalize font-medium truncate max-w-sm">{item.label}</span>
                <span className="text-indigo-400 font-mono font-bold">{val}</span>
              </div>
              <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-md"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('auto');
  const [prompt, setPrompt] = useState('');
  const [filePath, setFilePath] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentWorkingAgent, setCurrentWorkingAgent] = useState('');
  const [systemStatus, setSystemStatus] = useState(null);
  
  // Conversational Chat Messages State
  const [messages, setMessages] = useState([]);
  
  // Sidebar State
  const [sessionsList, setSessionsList] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions`);
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.sessions)) {
        setSessionsList(data.sessions.reverse());
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/system/status`);
      const data = await res.json();
      setSystemStatus(data);
    } catch (err) {
      console.error("Failed to fetch system status:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchSystemStatus();
  }, []);

  const getAgentLabel = (mode) => {
    switch (mode) {
      case 'research': return 'Research Agent';
      case 'rag': return 'RAG Document Agent';
      case 'code': return 'Code Agent';
      case 'data': return 'Data Analysis Agent';
      case 'vision': return 'Vision Agent';
      default: return 'AURA Auto Router & Reasoning Agent';
    }
  };

  const getAgentBadgeIcon = (agentType) => {
    switch (agentType) {
      case 'research': return { icon: Search, emoji: '🧠', color: 'text-cyan-400' };
      case 'rag': return { icon: FileText, emoji: '📚', color: 'text-amber-400' };
      case 'code': return { icon: Code, emoji: '💻', color: 'text-indigo-400' };
      case 'data': return { icon: BarChart2, emoji: '📊', color: 'text-emerald-400' };
      case 'vision': return { icon: Eye, emoji: '👁', color: 'text-rose-400' };
      default: return { icon: Sparkles, emoji: '⚡', color: 'text-purple-400' };
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-file-name': file.name,
        },
        body: file,
      });

      const data = await res.json();
      if (data.status === 'uploaded') {
        setFilePath(data.saved_path);
        setUploadedFileName(file.name);
        fetchSystemStatus();
      }
    } catch (err) {
      alert(`File upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const executeQuery = async (queryText, mode = activeTab, path = filePath) => {
    if (!queryText.trim()) return;

    const workingAgent = getAgentLabel(mode);
    const targetSid = activeSessionId || `session_${Date.now()}`;

    // Append User Prompt Message Bubble Immediately
    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: queryText,
      file_path: path,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);
    setCurrentWorkingAgent(workingAgent);

    let endpoint = `${API_BASE_URL}/api/chat`;
    let body = { prompt: queryText, file_path: path, session_id: targetSid };

    if (mode === 'research') {
      endpoint = `${API_BASE_URL}/api/research`;
      body = { topic: queryText, session_id: targetSid };
    } else if (mode === 'rag') {
      endpoint = `${API_BASE_URL}/api/rag`;
      body = { query: queryText, file_path: path, session_id: targetSid };
    } else if (mode === 'code') {
      endpoint = `${API_BASE_URL}/api/code`;
      body = { task: queryText, code_snippet: path, session_id: targetSid };
    } else if (mode === 'data') {
      endpoint = `${API_BASE_URL}/api/data`;
      body = { query: queryText, file_path: path, session_id: targetSid };
    } else if (mode === 'vision') {
      endpoint = `${API_BASE_URL}/api/vision`;
      body = { query: queryText, image_path: path, session_id: targetSid };
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      const responseContent = data.output || data.detail || (typeof data === 'string' ? data : JSON.stringify(data));

      const assistantMsg = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        agent_type: data.agent_type || 'chat',
        execution_plan: data.execution_plan,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setActiveSessionId(data.session_id || targetSid);
      fetchSessions();
      fetchSystemStatus();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: `Error connecting to backend API (${API_BASE_URL}): ${err.message}. Please check backend logs.`,
          agent_type: 'error',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeQuery(prompt);
  };

  const handleSelectToolTile = (mode, samplePrompt) => {
    setActiveTab(mode);
    setPrompt(samplePrompt);
  };

  const handleSelectSession = async (sessionItem) => {
    setActiveSessionId(sessionItem.session_id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionItem.session_id}`);
      const data = await res.json();
      if (data.status === 'success' && data.session && Array.isArray(data.session.chat_history)) {
        setMessages(data.session.chat_history);
      }
    } catch (err) {
      console.error("Failed to load session detail:", err);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setPrompt('');
    setFilePath('');
    setUploadedFileName('');
    setActiveTab('auto');
  };

  const handleResetVectorStore = async () => {
    if (!window.confirm("Are you sure you want to clear the ChromaDB Vector Database store?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/vectorstore/reset`, { method: 'DELETE' });
      const data = await res.json();
      alert(data.message || "Vector store cleared.");
      fetchSystemStatus();
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    }
  };

  const toolCapabilityTiles = [
    { mode: 'auto', icon: Sparkles, label: 'Auto Router', text: 'Intelligent reasoning agent that automatically selects the best tools for your query.', promptText: 'Analyze this complex workflow and determine the best approach' },
    { mode: 'research', icon: Search, label: 'Deep Research', text: 'Real-time web search and comparative synthesis on any topic.', promptText: 'Compare Python vs Rust performance, concurrency, and memory management' },
    { mode: 'rag', icon: FileText, label: 'RAG Document QA', text: 'Contextual QA over uploaded PDFs, DOCX, and text using ChromaDB vector search.', promptText: 'What are the main findings and contractual terms in the uploaded document?' },
    { mode: 'code', icon: Code, label: 'Code Engineer', text: 'Production-grade code generation, algorithm design, and unit testing.', promptText: 'Write an asynchronous LRU Cache class in Python with thread safety' },
    { mode: 'data', icon: BarChart2, label: 'Data Analysis', text: 'Pandas dataset profiling with descriptive metrics and visual graphs.', promptText: 'Analyze dataset statistical metrics and summarize key distribution metrics' },
    { mode: 'vision', icon: Eye, label: 'Vision & OCR', text: 'Inspect electrical schematics, circuit diagrams (CD), and technical diagrams.', promptText: 'Inspect this technical circuit diagram schematic and identify component nodes' },
  ];

  const isLandingPage = messages.length === 0 && !loading;

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 flex font-sans">
      {/* Fixed Sidebar */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-16'} h-full border-r border-slate-800 bg-slate-900/90 backdrop-blur transition-all duration-300 flex flex-col shrink-0`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={handleNewChat}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors w-full justify-center shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {sidebarOpen && <span>New Conversation</span>}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-slate-400 hover:text-slate-200 ml-2 cursor-pointer"
          >
            <History className="w-4 h-4" />
          </button>
        </div>

        {/* Streamlined Sessions Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
          {sidebarOpen && (
            <div className="flex items-center justify-between px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <span>Saved Sessions</span>
              <span>{sessionsList.length}</span>
            </div>
          )}

          {sessionsList.map((sess) => {
            const badge = getAgentBadgeIcon(sess.agent_used || sess.agent_type);
            const isSelected = activeSessionId === sess.session_id;

            return (
              <button
                key={sess.session_id}
                onClick={() => handleSelectSession(sess)}
                className={`w-full text-left p-3 rounded-xl transition-all border group flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500/40 shadow-inner'
                    : 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate min-w-0">
                  <span className="text-sm shrink-0">{badge.emoji}</span>
                  {sidebarOpen && (
                    <span className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                      {sess.title}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Maintenance Action */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <button
            onClick={handleResetVectorStore}
            className="w-full flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 p-2 rounded-xl text-xs font-medium transition-colors justify-center cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {sidebarOpen && <span>Clear Vector Store</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Streamlined Header */}
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  AURA
                </h1>
                {systemStatus && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ONLINE</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Autonomous Unified Research Assistant</p>
            </div>
          </div>

          {/* System Diagnostic Stats */}
          {systemStatus && (
            <div className="hidden lg:flex items-center space-x-4 text-xs font-mono bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>ChromaDB: <strong className="text-emerald-400">{systemStatus.chroma_db_active ? 'ACTIVE' : 'EMPTY'}</strong></span>
              </div>
              <div className="text-slate-600">|</div>
              <div className="text-slate-300">
                Uploaded: <strong className="text-cyan-400">{systemStatus.total_files_uploaded ?? 0} Files</strong>
              </div>
              <div className="text-slate-600">|</div>
              <div className="text-slate-300">
                Sessions: <strong className="text-indigo-400">{systemStatus.total_chat_sessions ?? 0} Saved</strong>
              </div>
            </div>
          )}
        </header>

        {/* Workspace */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col min-h-0 overflow-hidden">
          {isLandingPage ? (
            /* New Chat Landing Window */
            <div className="flex-1 flex flex-col items-center justify-center max-w-3xl w-full mx-auto space-y-8 animate-fadeIn">
              <div className="text-center space-y-3">
                <div className="inline-flex p-4 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl mb-2 shadow-inner">
                  <Bot className="w-12 h-12 text-indigo-400" />
                </div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  What can I help you with today?
                </h2>
              </div>

              {/* Prompt Input Form with Plus Icon File Attachment */}
              <form onSubmit={handleSubmit} className="w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                />

                <div className="relative flex items-center bg-slate-900/90 border border-slate-800 focus-within:border-indigo-500/80 rounded-2xl shadow-2xl transition-all p-1.5 space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach File (PDF, DOCX, CSV, Image)"
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4.5 h-4.5 text-indigo-400" />
                  </button>

                  {uploadedFileName && (
                    <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl text-emerald-400 font-mono text-xs shrink-0">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">{getFileName(uploadedFileName)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFileName('');
                          setFilePath('');
                        }}
                        className="hover:text-red-400 cursor-pointer ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder={uploading ? "Uploading file to storage..." : `Ask AURA...`}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                </div>
                {['rag', 'data', 'vision'].includes(activeTab) && (
                  <p className="text-[11px] text-amber-400/90 mt-2 flex items-center space-x-1.5 font-medium px-2">
                    <span>📌 <strong>Attachment Note</strong>: Attach a file for your first prompt in a new session. Subsequent queries in this session will automatically reuse your uploaded document.</span>
                  </p>
                )}
              </form>

              {/* Full 6 Tool Tiles Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                {toolCapabilityTiles.map((tile) => {
                  const TileIcon = tile.icon;
                  const isSelected = activeTab === tile.mode;

                  return (
                    <button
                      key={tile.mode}
                      onClick={() => handleSelectToolTile(tile.mode, tile.promptText)}
                      className={`p-4 rounded-xl text-left transition-all group flex flex-col justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500/60 shadow-lg shadow-indigo-600/20 scale-[1.02]'
                          : 'bg-slate-900/50 hover:bg-slate-800/80 border-slate-800/80 hover:border-indigo-500/40'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center space-x-2 text-xs font-bold ${isSelected ? 'text-indigo-300' : 'text-indigo-400 group-hover:text-indigo-300'}`}>
                            <TileIcon className="w-4 h-4" />
                            <span>{tile.label}</span>
                          </div>
                          <ArrowUpRight className={`w-4 h-4 transition-colors ${isSelected ? 'text-indigo-400' : 'text-slate-600 group-hover:text-indigo-400'}`} />
                        </div>
                        <p className="text-xs text-slate-400 leading-snug line-clamp-2">{tile.text}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Ongoing Session View */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Scrollable Conversation Stream */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-3 min-h-0">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-3">
                    {msg.role === 'user' ? (
                      /* Right Side: User Prompt Bubble */
                      <div className="flex justify-end items-start space-x-3">
                        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none px-5 py-3.5 max-w-2xl shadow-md text-sm leading-relaxed">
                          <p>{msg.content || msg.text}</p>
                          {msg.file_path && (
                            <div className="mt-2 text-[11px] bg-indigo-700/60 px-2.5 py-1 rounded-lg flex items-center space-x-1.5 font-mono text-indigo-200">
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate">{getFileName(msg.file_path)}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl shrink-0">
                          <User className="w-5 h-5 text-indigo-400" />
                        </div>
                      </div>
                    ) : (
                      /* Left Side: AI Assistant Response Bubble */
                      <div className="flex justify-start items-start space-x-3">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 shrink-0">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 max-w-4xl bg-slate-900/80 border border-slate-800 rounded-2xl rounded-tl-none p-6 space-y-6 shadow-md">
                          {/* Dynamic Execution Plan Banner — Only for tool-executing agents, hidden for casual chat */}
                          {msg.execution_plan && msg.agent_type !== 'chat' && (
                            <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-4 space-y-3 shadow-inner">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  <span>Execution Plan — {msg.execution_plan.agent_name} Activated</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-1">
                                  <span className="text-slate-400 flex items-center space-x-1 font-medium">
                                    <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Tools Activated:</span>
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {msg.execution_plan.tools.map((t, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-indigo-300 font-mono">
                                        • {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-slate-400 flex items-center space-x-1 font-medium">
                                    <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Pipeline Flow:</span>
                                  </span>
                                  <div className="text-slate-300 font-mono pt-1">
                                    {msg.execution_plan.pipeline_steps.join('  ➔  ')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Visual Graph Renderer */}
                          <DataChartRenderer text={msg.content} />

                          {/* Formatted Markdown Text Body with Table Sanitizer */}
                          <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed">
                            <ReactMarkdown
                              components={{
                                code({ node, inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const isInline = inline || (!match && !String(children).includes('\n'));
                                  if (isInline) {
                                    return (
                                      <code className="bg-slate-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-800" {...props}>
                                        {children}
                                      </code>
                                    );
                                  }
                                  return <CodeBlock>{children}</CodeBlock>;
                                }
                              }}
                            >
                              {formatMarkdownContent(msg.content)}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* In-Line Loading Bubble */}
                {loading && (
                  <div className="flex justify-start items-start space-x-3 pt-2 animate-fadeIn">
                    <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl rounded-tl-none p-4 flex items-center space-x-3">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-400 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-indigo-300 animate-pulse">
                          {currentWorkingAgent} is reasoning...
                        </p>
                        <p className="text-[11px] text-slate-400">Executing tools and processing response data</p>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Clean Bottom Input Form with Integrated Plus Icon File Upload Button */}
              <form onSubmit={handleSubmit} className="shrink-0 pt-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                />

                <div className="relative flex items-center bg-slate-900/90 border border-slate-800 focus-within:border-indigo-500/80 rounded-2xl shadow-2xl transition-all p-1.5 space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach File (PDF, DOCX, CSV, Image)"
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4.5 h-4.5 text-indigo-400" />
                  </button>

                  {uploadedFileName && (
                    <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl text-emerald-400 font-mono text-xs shrink-0">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">{getFileName(uploadedFileName)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFileName('');
                          setFilePath('');
                        }}
                        className="hover:text-red-400 cursor-pointer ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder={uploading ? "Uploading file to storage..." : `Type your prompt for ${getAgentLabel(activeTab)}...`}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium text-sm flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
                  >
                    <span>Send</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {['rag', 'data', 'vision'].includes(activeTab) && (
                  <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-center space-x-1.5 font-medium px-2">
                    <span>📌 <strong>Attachment Note</strong>: Attach a file for your first prompt in a new session. Subsequent queries in this session automatically reuse your uploaded document.</span>
                  </p>
                )}
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
