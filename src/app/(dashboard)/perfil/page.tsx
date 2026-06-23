// src/app/(dashboard)/perfil/page.tsx
"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Camera, Loader2, CheckCircle2, AlertTriangle,
  User, Mail, Lock, Eye, EyeOff,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Feedback({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium border",
        type === "success"
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-red-50 text-red-700 border-red-200"
      )}
    >
      {type === "success" ? (
        <CheckCircle2 size={15} className="shrink-0" />
      ) : (
        <AlertTriangle size={15} className="shrink-0" />
      )}
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Seção Foto
// ─────────────────────────────────────────────────────────────────────────────

function AvatarSection({
  name,
  avatarUrl,
  onAvatarChange,
}: {
  name: string;
  avatarUrl: string | null | undefined;
  onAvatarChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const displayUrl = preview ?? avatarUrl;

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: "error", message: "Imagem muito grande. Máximo: 5 MB." });
      return;
    }
    // Preview local imediato
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onAvatarChange(data.avatarUrl);
      setFeedback({ type: "success", message: "Foto atualizada com sucesso!" });
    } catch (err: unknown) {
      setPreview(null);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao enviar foto.",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <SectionCard title="Foto de perfil">
      <div className="flex items-center gap-6">
        {/* Avatar clicável */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative group shrink-0"
          title="Alterar foto"
        >
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 group-hover:border-brand-400 transition-colors">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
                style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 100%)" }}
              >
                {initials(name)}
              </div>
            )}
          </div>
          {/* Overlay */}
          <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploading
              ? <Loader2 size={18} className="text-white animate-spin" />
              : <Camera size={18} className="text-white" />}
          </div>
        </button>

        <input
          ref={fileRef}
          type="file"
          hidden
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-600">
            Clique na foto para alterar. Formatos aceitos: JPG, PNG, WEBP — máx. 5 MB.
          </p>
          {feedback && (
            <div className="mt-3">
              <Feedback type={feedback.type} message={feedback.message} />
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Seção Dados
// ─────────────────────────────────────────────────────────────────────────────

function DadosSection({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSave() {
    if (!name.trim() || !email.trim()) {
      setFeedback({ type: "error", message: "Nome e e-mail são obrigatórios." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setFeedback({ type: "success", message: "Dados atualizados com sucesso!" });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao salvar.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Dados pessoais">
      <div className="space-y-4">
        <div>
          <label className="label flex items-center gap-1.5 mb-1">
            <User size={12} className="text-slate-400" /> Nome
          </label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
          />
        </div>
        <div>
          <label className="label flex items-center gap-1.5 mb-1">
            <Mail size={12} className="text-slate-400" /> E-mail
          </label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
          />
        </div>

        {feedback && <Feedback type={feedback.type} message={feedback.message} />}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary w-full justify-center"
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin" />Salvando…</>
          ) : (
            "Salvar dados"
          )}
        </button>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Seção Senha
// ─────────────────────────────────────────────────────────────────────────────

function SenhaSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSave() {
    if (!current || !next || !confirm) {
      setFeedback({ type: "error", message: "Preencha todos os campos." });
      return;
    }
    if (next.length < 8) {
      setFeedback({ type: "error", message: "A nova senha deve ter no mínimo 8 caracteres." });
      return;
    }
    if (next !== confirm) {
      setFeedback({ type: "error", message: "A confirmação não coincide com a nova senha." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setFeedback({ type: "success", message: "Senha alterada com sucesso!" });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao alterar senha.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Alterar senha">
      <div className="space-y-4">
        <div>
          <label className="label flex items-center gap-1.5 mb-1">
            <Lock size={12} className="text-slate-400" /> Senha atual
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              className="input pr-10"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="label flex items-center gap-1.5 mb-1">
            <Lock size={12} className="text-slate-400" /> Nova senha
          </label>
          <div className="relative">
            <input
              type={showNext ? "text" : "password"}
              className="input pr-10"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowNext((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNext ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {next.length > 0 && next.length < 8 && (
            <p className="text-xs text-amber-600 mt-1">
              {8 - next.length} caractere(s) faltando
            </p>
          )}
        </div>

        <div>
          <label className="label flex items-center gap-1.5 mb-1">
            <Lock size={12} className="text-slate-400" /> Confirmar nova senha
          </label>
          <input
            type="password"
            className={cn(
              "input",
              confirm.length > 0 && confirm !== next && "border-red-300 focus:ring-red-200"
            )}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repita a nova senha"
          />
          {confirm.length > 0 && confirm !== next && (
            <p className="text-xs text-red-600 mt-1">As senhas não coincidem</p>
          )}
        </div>

        {feedback && <Feedback type={feedback.type} message={feedback.message} />}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary w-full justify-center"
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin" />Alterando…</>
          ) : (
            "Alterar senha"
          )}
        </button>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const { data: session, update } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(
    session?.user?.avatarUrl ?? null
  );

  async function handleAvatarChange(url: string) {
    setAvatarUrl(url);
    // Atualiza a sessão NextAuth para refletir imediatamente no sidebar
    await update({ avatarUrl: url });
  }

  if (!session?.user) return null;

  const { name = "Usuário", email = "" } = session.user;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Meu perfil</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Gerencie suas informações pessoais e senha de acesso.
        </p>
      </div>

      <AvatarSection
        name={name}
        avatarUrl={avatarUrl}
        onAvatarChange={handleAvatarChange}
      />

      <DadosSection initialName={name} initialEmail={email} />

      <SenhaSection />
    </div>
  );
}