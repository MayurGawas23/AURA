import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Search, FileText, Code, BarChart2, Eye, Sparkles, Send, Paperclip, Loader2, CheckCircle2, Wrench, GitCommit, Copy, Check, Upload, X, History, Plus, MessageSquare, TrendingUp, Table, Activity, BarChart, FileCode, Trash2, Cpu, ArrowUpRight, User, AlertTriangle, Menu } from 'lucide-react';

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
    <div className="relative my-4 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-md">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400 font-mono">
        <span className="text-zinc-300 font-medium">Code Snippet</span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 text-zinc-400 hover:text-indigo-400 transition-colors cursor-pointer"
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
      <pre className="p-4 text-xs font-mono text-zinc-100 overflow-x-auto leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
};

// Dual-Engine Interactive Visual Chart & Graph Renderer (Minimal Light Mode)
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
    <div className="my-6 bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
            <BarChart className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-bold font-heading text-zinc-900">{chartData.title || 'Interactive Data Visualization'}</h3>
            <p className="text-xs text-zinc-500">{chartData.x_label || 'Category'} vs {chartData.y_label || 'Value'}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Interactive Visual Graph</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl p-3.5">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Highest Peak</p>
          <p className="text-sm font-bold font-heading text-emerald-600 truncate mt-0.5">{maxItem?.label}: {maxItem?.value}</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl p-3.5">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Mean Average</p>
          <p className="text-sm font-bold font-heading text-indigo-600 mt-0.5">{avgValue}</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl p-3.5">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Categories</p>
          <p className="text-sm font-bold font-heading text-zinc-900 mt-0.5">{chartData.data.length} Visualized</p>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {chartData.data.map((item, idx) => {
          const val = Number(item.value) || 0;
          const pct = Math.min(100, Math.max(8, (val / maxValue) * 100));

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-700 capitalize font-medium truncate max-w-sm">{item.label}</span>
                <span className="text-indigo-600 font-mono font-bold">{val}</span>
              </div>
              <div className="w-full bg-zinc-100 h-3.5 rounded-full overflow-hidden border border-zinc-200/60 p-0.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-700 shadow-2xs"
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
  
  // Sidebar State (Default open on Desktop, closed on Mobile)
  const [sessionsList, setSessionsList] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile toggle state

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
      case 'research': return { icon: Search, emoji: '🧠', color: 'text-cyan-600' };
      case 'rag': return { icon: FileText, emoji: '📚', color: 'text-amber-600' };
      case 'code': return { icon: Code, emoji: '💻', color: 'text-indigo-600' };
      case 'data': return { icon: BarChart2, emoji: '📊', color: 'text-emerald-600' };
      case 'vision': return { icon: Eye, emoji: '👁', color: 'text-rose-600' };
      default: return { icon: Sparkles, emoji: '⚡', color: 'text-purple-600' };
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

    // Mandatory Document Upload Validation for Document Modes on New Sessions
    const requiresFile = ['rag', 'data', 'vision'].includes(mode);
    let hasExistingSessionFile = false;
    if (activeSessionId) {
      const currentSess = sessionsList.find((s) => s.session_id === activeSessionId);
      if (currentSess && Array.isArray(currentSess.uploaded_files) && currentSess.uploaded_files.length > 0) {
        hasExistingSessionFile = true;
      }
    }

    if (requiresFile && !path && !hasExistingSessionFile) {
      const fileTypeName = mode === 'rag' ? 'Document (PDF, TXT, DOCX)' : mode === 'data' ? 'Dataset (CSV, XLSX)' : 'Image / Circuit Schematic';
      alert(`⚠️ Mandatory Attachment Required:\n\nYou must attach a ${fileTypeName} to start a session in [${getAgentLabel(mode)}] mode.\n\nOnce attached, subsequent queries in this session will automatically reuse your document.`);
      return;
    }

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
    setSidebarOpen(false); // Close mobile drawer on selection
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
    setSidebarOpen(false);
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
    { mode: 'auto', icon: Sparkles, label: 'Auto Router', text: 'Intelligent reasoning agent that automatically selects the best tools for your query.', promptText: 'Can you help me with these...' },
    { mode: 'research', icon: Search, label: 'Deep Research', text: 'Real-time web search and comparative synthesis on any topic.', promptText: 'Tell me about history of Python language' },
    { mode: 'rag', icon: FileText, label: 'RAG Document QA', text: 'Contextual QA over uploaded PDFs, DOCX, and text using ChromaDB vector search.', promptText: 'What are the main findings and contractual terms in the uploaded document?' },
    { mode: 'code', icon: Code, label: 'Code Engineer', text: 'Production-grade code generation, algorithm design, and unit testing.', promptText: 'Write a function to check if a string is a palindrome in Python' },
    { mode: 'data', icon: BarChart2, label: 'Data Analysis', text: 'Pandas dataset profiling with descriptive metrics and visual graphs.', promptText: 'Analyze dataset statistical metrics and summarize key distribution metrics' },
    { mode: 'vision', icon: Eye, label: 'Vision & OCR', text: 'Inspect electrical schematics, circuit diagrams (CD), and technical diagrams.', promptText: 'Inspect this technical circuit diagram schematic and identify component nodes' },
  ];

  const isLandingPage = messages.length === 0 && !loading;

  return (
    <div className="h-screen overflow-hidden bg-zinc-50/70 text-zinc-900 flex font-sans relative">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Minimal Off-White Desktop Sidebar (w-80) / Mobile Drawer */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:relative inset-y-0 left-0 z-50 w-72 sm:w-80 h-full border-r border-zinc-200/80 bg-white/95 backdrop-blur-md transition-transform duration-300 flex flex-col shrink-0 overflow-hidden shadow-xl md:shadow-none`}
      >
        {/* Sidebar Top Action Bar */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <button
            onClick={handleNewChat}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white px-4 py-2.5 rounded-xl text-xs font-semibold font-heading transition-all duration-200 w-full justify-center shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>New Conversation</span>
          </button>

          {/* Close Icon on Mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors ml-2 cursor-pointer shrink-0"
            title="Close Drawer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Saved Sessions Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
          <div className="flex items-center justify-between px-2 py-1.5 text-[11px] uppercase tracking-wider text-zinc-400 font-bold font-heading">
            <span>Saved Sessions</span>
            <span className="px-1.5 py-0.5 bg-zinc-100 rounded-md text-zinc-600 font-mono text-[10px]">{sessionsList.length}</span>
          </div>

          {sessionsList.map((sess) => {
            const badge = getAgentBadgeIcon(sess.agent_used || sess.agent_type);
            const isSelected = activeSessionId === sess.session_id;

            return (
              <button
                key={sess.session_id}
                onClick={() => handleSelectSession(sess)}
                title={sess.title}
                className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 group flex items-center justify-between cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-200/90 text-indigo-950 font-semibold shadow-2xs'
                    : 'bg-transparent hover:bg-zinc-100/70 border-transparent text-zinc-700 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate min-w-0">
                  <span className="text-sm shrink-0">{badge.emoji}</span>
                  <span className={`text-xs truncate ${isSelected ? 'font-semibold text-indigo-950' : 'font-medium text-zinc-700 group-hover:text-zinc-900'}`}>
                    {sess.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Maintenance Action Footer */}
        <div className="p-3 border-t border-zinc-100 shrink-0">
          <button
            onClick={handleResetVectorStore}
            title="Clear Vector Store"
            className="w-full flex items-center space-x-2 bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200/80 text-rose-700 p-2.5 rounded-xl text-xs font-medium transition-colors justify-center cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>Clear Vector Store</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Streamlined Clean Header */}
        <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 bg-zinc-100 border border-zinc-200 hover:bg-zinc-200/70 rounded-xl text-zinc-700 transition-colors cursor-pointer shrink-0"
              title="Toggle Sidebar Menu"
            >
              <Menu className="w-5 h-5 text-indigo-600" />
            </button>

            <div className="p-2 bg-indigo-600 rounded-xl shadow-xs shrink-0">
              <Bot className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-extrabold font-heading text-zinc-900 tracking-tight">
                  AURA
                </h1>
                {systemStatus && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[10px] font-mono font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>ONLINE</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 truncate max-w-[200px] sm:max-w-none font-medium">
                Autonomous Unified Research Assistant
              </p>
            </div>
          </div>

          {/* Diagnostic Stats Badge */}
          {systemStatus && (
            <div className="hidden lg:flex items-center space-x-3.5 text-xs font-mono bg-zinc-100/80 border border-zinc-200/80 px-3 py-1.5 rounded-xl">
              <div className="flex items-center space-x-1.5 text-zinc-700">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>ChromaDB: <strong className="text-emerald-700 font-semibold">{systemStatus.chroma_db_active ? 'ACTIVE' : 'EMPTY'}</strong></span>
              </div>
              <div className="text-zinc-300">|</div>
              <div className="text-zinc-700">
                Uploaded: <strong className="text-indigo-600 font-semibold">{systemStatus.total_files_uploaded ?? 0} Files</strong>
              </div>
              <div className="text-zinc-300">|</div>
              <div className="text-zinc-700">
                Sessions: <strong className="text-zinc-900 font-semibold">{systemStatus.total_chat_sessions ?? 0} Saved</strong>
              </div>
            </div>
          )}
        </header>

        {/* Workspace Body */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden">
          {isLandingPage ? (
            /* Minimal Human Warm Landing Window */
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full mx-auto space-y-8 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-indigo-50 border border-indigo-100 rounded-2xl mb-1 shadow-2xs">
                  <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight font-heading">
                  What can I help you with today?
                </h2>
                <p className="text-sm text-zinc-500 font-serif-greeting italic text-lg pt-1">
                  Select a research model or ask anything below
                </p>
              </div>

              {/* Prompt Input Container */}
              <form onSubmit={handleSubmit} className="w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                />

                <div className="relative flex items-center bg-white border border-zinc-200/90 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 rounded-2xl shadow-sm transition-all duration-200 p-2 space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach File (PDF, DOCX, CSV, Image)"
                    className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/70 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 text-indigo-600" />
                  </button>

                  {uploadedFileName && (
                    <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl text-emerald-800 font-mono text-xs shrink-0">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate max-w-[100px] sm:max-w-[120px] font-medium">{getFileName(uploadedFileName)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFileName('');
                          setFilePath('');
                        }}
                        className="hover:text-rose-600 cursor-pointer ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder={uploading ? "Uploading file to storage..." : `Ask AURA anything...`}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 bg-transparent px-2 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-40 text-white p-2.5 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {['rag', 'data', 'vision'].includes(activeTab) && (
                  <p className="text-xs text-amber-700 mt-2.5 flex items-center space-x-1.5 font-medium px-2 bg-amber-50 border border-amber-200/60 p-2 rounded-xl">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span><strong>Mandatory Attachment</strong>: You must attach a file to start a session in [{getAgentLabel(activeTab)}].</span>
                  </p>
                )}
              </form>

              {/* 6 Capability Tiles Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                {toolCapabilityTiles.map((tile) => {
                  const TileIcon = tile.icon;
                  const isSelected = activeTab === tile.mode;

                  return (
                    <button
                      key={tile.mode}
                      onClick={() => handleSelectToolTile(tile.mode, tile.promptText)}
                      className={`p-4 rounded-2xl text-left transition-all duration-200 group flex flex-col justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-300 shadow-sm scale-[1.01]'
                          : 'bg-white hover:bg-zinc-50 border-zinc-200/80 hover:border-indigo-300/80 hover:-translate-y-0.5 hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center space-x-2 text-xs font-bold font-heading ${isSelected ? 'text-indigo-900' : 'text-zinc-800 group-hover:text-indigo-600'}`}>
                            <TileIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="truncate">{tile.label}</span>
                          </div>
                          <ArrowUpRight className={`w-3.5 h-3.5 shrink-0 transition-colors ${isSelected ? 'text-indigo-600' : 'text-zinc-400 group-hover:text-indigo-600'}`} />
                        </div>
                        <p className="text-xs text-zinc-500 leading-snug line-clamp-2">{tile.text}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Ongoing Conversation Stream */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-6 pr-1 sm:pr-2 min-h-0">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-3 animate-fade-in">
                    {msg.role === 'user' ? (
                      /* User Message Bubble */
                      <div className="flex justify-end items-start space-x-2.5 sm:space-x-3">
                        <div className="bg-zinc-900 text-white rounded-2xl rounded-tr-xs px-4 sm:px-5 py-3 max-w-[85%] sm:max-w-xl shadow-xs text-xs sm:text-sm font-sans leading-relaxed">
                          <p>{msg.content || msg.text}</p>
                          {msg.file_path && (
                            <div className="mt-2 text-[11px] bg-zinc-800 px-2.5 py-1 rounded-lg flex items-center space-x-1.5 font-mono text-zinc-300">
                              <Paperclip className="w-3 h-3 text-indigo-400" />
                              <span className="truncate">{getFileName(msg.file_path)}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-1.5 sm:p-2 bg-zinc-200 border border-zinc-300/80 rounded-xl shrink-0">
                          <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-700" />
                        </div>
                      </div>
                    ) : (
                      /* AI Assistant Response Bubble */
                      <div className="flex justify-start items-start space-x-2.5 sm:space-x-3">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-xs shrink-0">
                          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="flex-1 max-w-3xl bg-white border border-zinc-200/90 rounded-2xl rounded-tl-xs p-5 sm:p-6 space-y-5 shadow-xs min-w-0">
                          {/* Execution Plan Banner */}
                          {msg.execution_plan && msg.agent_type !== 'chat' && (
                            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                              <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2">
                                <div className="flex items-center space-x-2 text-xs font-bold font-heading text-indigo-900 uppercase tracking-wider">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span className="truncate">Execution Plan — {msg.execution_plan.agent_name}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1">
                                  <span className="text-zinc-500 flex items-center space-x-1 font-medium">
                                    <Wrench className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span>Tools Activated:</span>
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {msg.execution_plan.tools.map((t, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-white border border-zinc-200 rounded text-indigo-900 font-mono text-[11px] shadow-2xs">
                                        • {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-zinc-500 flex items-center space-x-1 font-medium">
                                    <GitCommit className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span>Pipeline Flow:</span>
                                  </span>
                                  <div className="text-zinc-800 font-mono pt-1 text-[11px] overflow-x-auto font-medium">
                                    {msg.execution_plan.pipeline_steps.join('  ➔  ')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Visual Graph Renderer */}
                          <DataChartRenderer text={msg.content} />

                          {/* Formatted Markdown Body */}
                          <div className="prose prose-zinc max-w-none text-zinc-800 text-xs sm:text-sm leading-relaxed overflow-x-auto font-sans">
                            <ReactMarkdown
                              components={{
                                code({ node, inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const isInline = inline || (!match && !String(children).includes('\n'));
                                  if (isInline) {
                                    return (
                                      <code className="bg-zinc-100 text-indigo-900 px-1.5 py-0.5 rounded font-mono text-[11px] border border-zinc-200" {...props}>
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

                {/* Inline Loading Indicator */}
                {loading && (
                  <div className="flex justify-start items-start space-x-3 pt-2 animate-fade-in">
                    <div className="p-2 bg-indigo-600 rounded-xl shadow-xs shrink-0">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="bg-white border border-indigo-200 rounded-2xl rounded-tl-xs p-4 flex items-center space-x-3 shadow-xs">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-indigo-600 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold font-heading text-indigo-900 animate-pulse">
                          {currentWorkingAgent} is reasoning...
                        </p>
                        <p className="text-[11px] text-zinc-500">Executing tools and processing response data</p>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Bottom Input Form */}
              <form onSubmit={handleSubmit} className="shrink-0 pt-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                />

                <div className="relative flex items-center bg-white border border-zinc-200/90 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 rounded-2xl shadow-sm transition-all duration-200 p-1.5 space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach File (PDF, DOCX, CSV, Image)"
                    className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/70 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4.5 h-4.5 text-indigo-600" />
                  </button>

                  {uploadedFileName && (
                    <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl text-emerald-800 font-mono text-xs shrink-0">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate max-w-[90px] sm:max-w-[120px] font-medium">{getFileName(uploadedFileName)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFileName('');
                          setFilePath('');
                        }}
                        className="hover:text-rose-600 cursor-pointer ml-1"
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
                    className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold font-heading text-xs sm:text-sm flex items-center space-x-2 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
                {['rag', 'data', 'vision'].includes(activeTab) && (
                  <p className="text-[11px] text-amber-700 mt-1.5 flex items-center space-x-1.5 font-medium px-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span><strong>Mandatory Attachment</strong>: File required to start session. Subsequent queries in this session reuse your file.</span>
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
