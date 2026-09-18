import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Sparkles,
    CheckCircle2,
    Clock,
    ShieldCheck,
    Zap,
    ArrowRight,
    Kanban,
    Database,
    Users,
    Activity,
    Layers,
    Check,
    Loader2,
    RefreshCw
} from "lucide-react";

const GithubIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
        />
    </svg>
);

const LandingPage = () => {
    // Interactive demo state for Feature Block 1 (AI Decomposition)
    const [aiDecomposing, setAiDecomposing] = useState(false);
    const [subtasks, setSubtasks] = useState([
        { id: 1, title: "Configure Redis connection pool & retry strategy", minutes: 20, completed: true },
        { id: 2, title: "Implement Cache-Aside pattern for workspace endpoints", minutes: 35, completed: false },
        { id: 3, title: "Add TTL invalidation hooks on task mutation", minutes: 25, completed: false },
    ]);

    const handleToggleSubtask = (id) => {
        setSubtasks((prev) =>
            prev.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
        );
    };

    const handleTriggerAi = () => {
        setAiDecomposing(true);
        setTimeout(() => {
            setAiDecomposing(false);
            setSubtasks([
                { id: 1, title: "Configure Redis connection pool & retry strategy", minutes: 20, completed: false },
                { id: 2, title: "Implement Cache-Aside pattern for workspace endpoints", minutes: 35, completed: false },
                { id: 3, title: "Add TTL invalidation hooks on task mutation", minutes: 25, completed: false },
            ]);
        }, 800);
    };

    const completedCount = subtasks.filter((s) => s.completed).length;
    const progressPercent = Math.round((completedCount / subtasks.length) * 100);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
            {/* ─── Navigation Bar ────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/80 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                            <Kanban className="w-4 h-4" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
                            Axora
                        </span>
                    </div>

                    {/* Nav Links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                        <a href="#features" className="hover:text-foreground transition-colors">
                            Features
                        </a>
                        <a href="#architecture" className="hover:text-foreground transition-colors">
                            Architecture
                        </a>
                        <a
                            href="https://github.com/rohit2212kr/Axora"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-foreground transition-colors flex items-center gap-1.5"
                        >
                            <GithubIcon className="w-4 h-4" />
                            <span>GitHub</span>
                        </a>
                    </nav>

                    {/* Auth Actions */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/signup"
                            className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* ─── Hero Section ──────────────────────────────────────────────── */}
            <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border/60">
                {/* Background ambient glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 blur-[130px] pointer-events-none rounded-full" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                        {/* Hero Content (Left) */}
                        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                            {/* Pill Badge */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary border border-border text-xs font-semibold text-foreground/90 shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                <span>AI-Powered Task Orchestration v1.0</span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                                Work Smarter.{" "}
                                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
                                    Ship Faster.
                                </span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                Axora combines multi-tenant team workspaces with high-performance,
                                zero-latency Kanban boards and automated Gemini AI task breakdown.
                                Break roadblocks into actionable subtasks in seconds.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                                <Link
                                    to="/signup"
                                    className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 group"
                                >
                                    <span>Start Building Free</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </Link>

                                <Link
                                    to="/login"
                                    className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-foreground bg-secondary hover:bg-secondary/80 border border-border rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>Explore Demo</span>
                                </Link>
                            </div>

                            {/* Trust badges */}
                            <div className="pt-6 flex items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-primary" />
                                    <span>0ms Optimistic UI</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Role-Based RBAC</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Gemini 1.5 Flash</span>
                                </div>
                            </div>
                        </div>

                        {/* Hero Visual Anchor: Angled Kanban Card (Right) */}
                        <div className="lg:col-span-5 flex justify-center">
                            <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-5 shadow-2xl shadow-blue-500/10 transform lg:-rotate-1 hover:rotate-0 transition-transform duration-500">
                                {/* Mock Workspace Header */}
                                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/80">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                                            A
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground">Acme Engineering</p>
                                            <p className="text-[10px] text-muted-foreground">Main Production Sprint</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">
                                        Active Sprint
                                    </span>
                                </div>

                                {/* Mock Mini Kanban Columns */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* In Progress Column */}
                                    <div className="bg-secondary/40 border border-border/60 rounded-xl p-3 flex flex-col gap-2.5">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                                            <span>IN PROGRESS</span>
                                            <span className="px-1.5 py-0.2 bg-secondary rounded text-[10px]">2</span>
                                        </div>

                                        {/* Task Card 1 */}
                                        <div className="bg-card border border-border rounded-lg p-3 shadow-sm space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                                    High
                                                </span>
                                                <span className="text-[10px] font-mono text-muted-foreground">2d left</span>
                                            </div>
                                            <p className="text-xs font-semibold text-foreground leading-snug">
                                                Auth Token Refresh Interceptor
                                            </p>
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                                                <span className="text-primary font-mono font-medium">✨ 3/3 subtasks</span>
                                                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold">
                                                    R
                                                </div>
                                            </div>
                                        </div>

                                        {/* Task Card 2 */}
                                        <div className="bg-card border border-border rounded-lg p-3 shadow-sm space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                                    Medium
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-foreground leading-snug">
                                                Hydrate Workspaces on Reload
                                            </p>
                                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-primary h-full w-2/3" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Completed Column */}
                                    <div className="bg-secondary/40 border border-border/60 rounded-xl p-3 flex flex-col gap-2.5">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                                            <span>COMPLETED</span>
                                            <span className="px-1.5 py-0.2 bg-secondary rounded text-[10px]">1</span>
                                        </div>

                                        {/* Completed Task Card */}
                                        <div className="bg-card border border-border rounded-lg p-3 shadow-sm space-y-2 opacity-90">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                                    Done
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-foreground line-through opacity-80 leading-snug">
                                                Vercel Deployment Rewrite
                                            </p>
                                            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                                <Check className="w-3 h-3" />
                                                <span>Merged to main</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Feature Block 1: AI Decomposition (Text Left, Image Right) ── */}
            <section id="features" className="py-20 md:py-28 border-b border-border/60 bg-muted/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Content (Left) */}
                        <div className="lg:col-span-6 space-y-6">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>GEMINI ENGINE</span>
                            </div>

                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                                Decompose Complex Tasks in Milliseconds
                            </h2>

                            <p className="text-base text-muted-foreground leading-relaxed">
                                Don&apos;t let large objectives stall your pipeline. With one click,
                                Gemini 1.5 Flash parses the task context, produces recursive checklist
                                items, and assigns estimated completion times in structured JSON.
                            </p>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 text-primary mt-0.5">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">Recursive Subtask Breakdown</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Splits ambiguous backlog stories into 3-5 high-leverage executable steps.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">Automated Time Estimations</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Predicts implementation duration to maintain predictable sprint capacity.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">Real-Time Progress Synchronization</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Checking off subtasks dynamically increments project velocity metrics.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Preview Card (Right) */}
                        <div className="lg:col-span-6 flex justify-center">
                            <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                <div className="flex items-center justify-between pb-4 border-b border-border">
                                    <div>
                                        <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                                            Urgent Priority
                                        </span>
                                        <h3 className="text-base font-bold text-foreground mt-2">
                                            Setup Redis Cache Layer
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Configure cluster connection and implement eviction policy.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleTriggerAi}
                                        disabled={aiDecomposing}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-semibold transition-colors shrink-0 disabled:opacity-50"
                                        title="Generate subtasks"
                                    >
                                        {aiDecomposing ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-3.5 h-3.5" />
                                        )}
                                        <span>{aiDecomposing ? "Generating..." : "✨ Break down with AI"}</span>
                                    </button>
                                </div>

                                {/* Interactive Checklist */}
                                <div className="mt-5 space-y-2.5">
                                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1">
                                        <span>Subtasks ({completedCount}/{subtasks.length})</span>
                                        <span className="font-mono text-primary">{progressPercent}%</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mb-4">
                                        <div
                                            className="bg-primary h-full transition-all duration-300"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>

                                    {aiDecomposing ? (
                                        <div className="py-10 flex flex-col items-center justify-center gap-3 text-muted-foreground animate-pulse">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                            <p className="text-xs">Prompting Gemini 1.5 Flash model...</p>
                                        </div>
                                    ) : (
                                        subtasks.map((st) => (
                                            <div
                                                key={st.id}
                                                onClick={() => handleToggleSubtask(st.id)}
                                                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                                    st.completed
                                                        ? "bg-secondary/30 border-border/50 opacity-75"
                                                        : "bg-secondary/70 border-border hover:border-primary/40"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div
                                                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                                            st.completed
                                                                ? "bg-primary border-primary text-primary-foreground"
                                                                : "border-muted-foreground/40 bg-transparent"
                                                        }`}
                                                    >
                                                        {st.completed && <Check className="w-3 h-3" />}
                                                    </div>
                                                    <span
                                                        className={`text-xs truncate ${
                                                            st.completed
                                                                ? "line-through text-muted-foreground"
                                                                : "text-foreground font-medium"
                                                        }`}
                                                    >
                                                        {st.title}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-mono text-muted-foreground bg-card border border-border px-2 py-0.5 rounded shrink-0">
                                                    ~{st.minutes}m
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span>Click checkboxes to test real-time progress update</span>
                                    <button
                                        onClick={handleTriggerAi}
                                        className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        <span>Reset demo</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Feature Block 2: Multi-Tenant Architecture (Image Left, Text Right) ── */}
            <section id="architecture" className="py-20 md:py-28 border-b border-border/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Architectural Glass Hierarchy (Left) */}
                        <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
                            <div className="w-full max-w-lg bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-xl space-y-4 font-mono">
                                {/* Level 1: Workspace */}
                                <div className="p-4 rounded-xl bg-secondary/80 border border-border space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-primary font-bold text-xs">
                                            <Layers className="w-4 h-4" />
                                            <span>WORKSPACE (TENANT)</span>
                                        </div>
                                        <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-sans">
                                            Role: Owner / Admin
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground font-sans">
                                        Scoped isolation barrier with dynamic member invitation RBAC.
                                    </p>
                                </div>

                                {/* Connector */}
                                <div className="flex justify-center -my-2">
                                    <div className="w-0.5 h-5 bg-border" />
                                </div>

                                {/* Level 2: Project */}
                                <div className="p-4 rounded-xl bg-secondary/60 border border-border space-y-2 ml-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                                            <Database className="w-4 h-4" />
                                            <span>PROJECT REPOSITORY</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded">
                                            Compound Index: {"{ workspace, _id }"}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground font-sans">
                                        Deadlines, project statuses, and localized Kanban states.
                                    </p>
                                </div>

                                {/* Connector */}
                                <div className="flex justify-center -my-2 ml-4">
                                    <div className="w-0.5 h-5 bg-border" />
                                </div>

                                {/* Level 3: Kanban Tasks */}
                                <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2 ml-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                                            <Zap className="w-4 h-4" />
                                            <span>OPTIMISTIC TASK BOARD</span>
                                        </div>
                                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-sans">
                                            0ms Drag Latency
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground font-sans">
                                        Immediate UI snap with automated background REST rollback.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content (Right) */}
                        <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>ISOLATION & ROLES</span>
                            </div>

                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                                Enterprise Multi-Tenancy from Day One
                            </h2>

                            <p className="text-base text-muted-foreground leading-relaxed">
                                Built ground-up for secure team collaboration. Axora strictly partitions
                                data across workspace boundaries with complete Role-Based Access Control
                                (RBAC) and persistent state rehydration.
                            </p>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 text-indigo-400 mt-0.5">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">Owner / Admin / Member Roles</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Enforces who can invite members, delete projects, and manipulate deliverables.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 text-sky-400 mt-0.5">
                                        <RefreshCw className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">State Rehydration Across Reloads</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Hard page reloads preserve active workspace selection without UI flicker.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">Aggregate Velocity Metrics</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Real-time progress bars, completion rates, and status distribution charts.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Bottom CTA Banner ─────────────────────────────────────────── */}
            <section className="py-16 md:py-20 bg-gradient-to-b from-background via-secondary/20 to-background border-b border-border/60">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                        Ready to accelerate your delivery cycle?
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                        Experience the power of AI-assisted task breakdown and optimistic Kanban workflows today.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                        <Link
                            to="/signup"
                            className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-xl shadow-primary/25"
                        >
                            Create Your Free Workspace
                        </Link>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-foreground bg-secondary hover:bg-secondary/80 border border-border rounded-xl transition-colors"
                        >
                            Sign In to Existing Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── Minimal Footer ────────────────────────────────────────────── */}
            <footer className="py-10 bg-background text-xs text-muted-foreground">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground tracking-tight">Axora</span>
                        <span>•</span>
                        <span>Built on MERN, Tailwind CSS & Google Gemini AI</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <a
                            href="https://github.com/rohit2212kr/Axora"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-foreground transition-colors flex items-center gap-1"
                        >
                            <GithubIcon className="w-3.5 h-3.5" />
                            <span>GitHub</span>
                        </a>
                        <Link to="/login" className="hover:text-foreground transition-colors">
                            Sign In
                        </Link>
                        <Link to="/signup" className="hover:text-foreground transition-colors">
                            Get Started
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
