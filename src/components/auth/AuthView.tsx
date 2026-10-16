import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Radio,
  KeyRound
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { BrandBars } from '../common/BrandBars';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const AuthView: React.FC = () => {
  const { loginUser, registerUser, verifyEmail } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'admin-login'>('login');
  
  // Form states
  const [roleSelection, setRoleSelection] = useState<'cliente' | 'profissional'>('profissional');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('');

  // Feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetRole: UserRole = mode === 'admin-login' ? 'admin' : roleSelection;
    const res = loginUser(email, targetRole, password);

    if (!res.success) {
      setErrorMessage(res.message || 'Falha no login');
      if (res.message?.includes('não confirmado')) {
        setPendingVerifyEmail(email);
        setMode('verify');
      }
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const res = registerUser({
      name,
      email,
      phone,
      role: roleSelection,
      password: password || 'senha123',
    });

    if (res.success) {
      setPendingVerifyEmail(email);
      setSuccessMessage(res.message);
      setMode('verify');
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = verifyEmail(pendingVerifyEmail, verifyCode);
    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#060D1B] text-[#C3CBDA] flex flex-col justify-center items-center p-4 sm:p-6 font-body">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Logo size="lg" />
          <p className="eyebrow text-[#FFC20E] mt-3">
            SISTEMA OFICIAL DE SEGURANÇA PRIVADA
          </p>
        </div>

        {/* Card Central em --navy-surface com border-radius: 12px */}
        <div className="card-transeg-dark p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#16264A] pb-4">
            <div className="flex items-center gap-2">
              <BrandBars size="sm" />
              <h2 className="font-display font-bold text-base text-white uppercase">
                {mode === 'admin-login' ? 'Central CCO • Gestão' : mode === 'register' ? 'Novo Cadastro' : 'Acesso Operacional'}
              </h2>
            </div>
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => setMode('admin-login')}
                className="text-[11px] text-[#FFC20E] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                Login CCO
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#DC2626]/15 border border-[#DC2626]/30 rounded-[8px] text-[#DC2626] text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-[8px] text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agente@transeg.com.br"
                    className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#8E9BAE] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#8E9BAE] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-yellow"
              >
                <Shield className="w-4 h-4" />
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {mode === 'admin-login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                  E-mail Administrador CCO
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="transeg.app@gmail.com"
                    className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#8E9BAE] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                  Senha CCO
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#8E9BAE] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-yellow"
              >
                <Radio className="w-4 h-4" />
                <span>Acessar Painel Central CCO</span>
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome e sobrenome"
                    className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#8E9BAE] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#8E9BAE] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(27) 99888-7766"
                    className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#8E9BAE] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#8E9BAE] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-yellow"
              >
                <Shield className="w-4 h-4" />
                <span>Cadastrar</span>
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-[#16264A] flex justify-between text-xs">
            {mode !== 'login' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#8E9BAE] hover:text-white cursor-pointer"
              >
                Voltar ao Login
              </button>
            )}
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-[#FFC20E] hover:underline font-semibold cursor-pointer"
              >
                Cadastrar novo agente
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[9.5px] min-[360px]:text-[10px] min-[390px]:text-[11px] sm:text-xs text-[#8E9BAE] whitespace-nowrap tracking-tight sm:tracking-normal overflow-hidden text-ellipsis max-w-full mx-auto select-none">
          © 2026 TRANSEG — Tecnologias de Segurança Ltda. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
