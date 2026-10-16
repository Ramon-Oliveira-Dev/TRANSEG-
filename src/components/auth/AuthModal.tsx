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
  KeyRound,
  X,
  Sparkles
} from 'lucide-react';
import { BrandBars } from '../common/BrandBars';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'admin-login';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  initialMode = 'login'
}) => {
  const { loginUser, registerUser, verifyEmail } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'admin-login'>(initialMode);
  
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialMode]);

  // Form states
  const [roleSelection, setRoleSelection] = useState<'profissional' | 'cliente'>('profissional');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('');

  // Feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetRole: UserRole = mode === 'admin-login' ? 'admin' : roleSelection;
    const res = loginUser(email, targetRole, password);

    if (res.success) {
      onClose();
    } else {
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
    if (res.success) {
      setSuccessMessage('E-mail validado com sucesso! Você já pode entrar.');
      setMode('login');
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-[#060D1B]/85 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />

      {/* Card Central Oficial TRANSEG: fundo --navy-surface (#0F1C38), border-radius: 12px */}
      <div className="relative w-full max-w-md bg-[#0F1C38] border border-[#16264A] rounded-[12px] shadow-2xl z-10 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        
        {/* Header do Card com BrandBars e Fechar */}
        <div className="p-4 sm:p-5 border-b border-[#16264A] flex items-center justify-between bg-[#060D1B]">
          <div className="flex items-center gap-3">
            <BrandBars size="sm" />
            <div>
              <span className="eyebrow text-[#FFC20E] block text-[10px]">
                TRANSEG SEGURANÇA
              </span>
              <h3 className="font-display font-bold text-sm uppercase tracking-wide text-white">
                {mode === 'admin-login' ? 'Central CCO • Administrador' : 'Área Restrita Operacional'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-[8px] bg-[#0A1428] hover:bg-[#16264A] text-[#C3CBDA] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto font-body text-xs text-[#C3CBDA]">
          
          {/* Aviso informativo ao cliente */}
          <div className="p-3 bg-[#0A1428] border border-[#16264A] rounded-[8px] text-[#C3CBDA] flex items-start gap-2.5">
            <User className="w-4 h-4 text-[#FFC20E] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-white">Aviso ao Cliente:</strong> Não é necessário login para solicitar serviços e usar o botão de pânico. Este acesso é exclusivo para profissionais e Central CCO.
            </p>
          </div>

          {/* Mensagens de feedback */}
          {errorMessage && (
            <div className="p-3 bg-[#DC2626]/15 border border-[#DC2626]/30 rounded-[8px] text-[#DC2626] font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-[8px] text-emerald-400 font-medium flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODO 1: LOGIN (PROFISSIONAL) */}
          {mode === 'login' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#C3CBDA] font-medium">Perfil de Acesso:</span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('admin-login');
                  }}
                  className="text-[11px] text-[#FFC20E] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  Ir para Login CCO (Admin)
                </button>
              </div>

              {/* Seletor de Perfil */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0A1428] rounded-[8px] border border-[#16264A]">
                <button
                  type="button"
                  onClick={() => setRoleSelection('profissional')}
                  className={`py-2 text-xs font-semibold rounded-[6px] flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    roleSelection === 'profissional'
                      ? 'bg-[#0F1C38] text-[#FFC20E] shadow-sm'
                      : 'text-[#C3CBDA] hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Profissional
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('admin-login');
                  }}
                  className="py-2 text-xs font-semibold rounded-[6px] flex items-center justify-center gap-2 text-[#C3CBDA] hover:text-white transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Administrador
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                    E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="agente@transeg.com.br"
                      className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#8E9BAE] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#8E9BAE] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Botão primário .btn-yellow obrigatório */}
                <button
                  type="submit"
                  className="w-full btn-yellow"
                >
                  <Shield className="w-4 h-4" />
                  <span>Entrar no Painel Profissional</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-[#16264A] flex items-center justify-between text-xs">
                <span className="text-[#8E9BAE]">É novo profissional?</span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setRoleSelection('profissional');
                    setMode('register');
                  }}
                  className="text-[#FFC20E] hover:underline font-semibold cursor-pointer"
                >
                  Cadastrar-se como Agente
                </button>
              </div>
            </div>
          )}

          {/* MODO 2: ADMIN LOGIN */}
          {mode === 'admin-login' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#0A1428] border border-[#FFC20E]/30 rounded-[8px] flex items-center gap-3">
                <Radio className="w-5 h-5 text-[#FFC20E] shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-white uppercase font-display">
                    Central de Operações (CCO)
                  </div>
                  <div className="text-[#C3CBDA] text-[11px]">
                    Painel com comando geral, despacho de agentes e telemetria.
                  </div>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                    E-mail do Administrador
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="transeg.app@gmail.com"
                      className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#8E9BAE] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                    Chave de Acesso CCO
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#8E9BAE] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Botão primário .btn-yellow obrigatório */}
                <button
                  type="submit"
                  className="w-full btn-yellow"
                >
                  <Radio className="w-4 h-4" />
                  <span>Acessar Painel Central CCO</span>
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-[#16264A] flex flex-col sm:flex-row items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('transeg.app@gmail.com');
                    setPassword('Transeg@2026');
                  }}
                  className="text-[11px] text-[#FFC20E] hover:underline font-semibold cursor-pointer"
                >
                  Preencher Credenciais CCO
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('login');
                  }}
                  className="text-xs text-[#8E9BAE] hover:text-white cursor-pointer"
                >
                  Voltar ao Login de Profissional
                </button>
              </div>
            </div>
          )}

          {/* MODO 3: CADASTRO PROFISSIONAL */}
          {mode === 'register' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#0A1428] border border-[#16264A] rounded-[8px] text-xs text-[#C3CBDA]">
                <strong className="text-white">Cadastro de Agente:</strong> Seu cadastro passará por homologação da Central CCO antes de liberar recebimento de chamados.
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
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
                      placeholder="Ex: Carlos Eduardo Silveira"
                      className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8E9BAE] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                    E-mail Profissional
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="carlos.silveira@transeg.com.br"
                      className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8E9BAE] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                    Telefone / WhatsApp Operacional
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(27) 99888-7766"
                      className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8E9BAE] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8E9BAE] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Botão primário .btn-yellow obrigatório */}
                <button
                  type="submit"
                  className="w-full btn-yellow mt-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Cadastrar e Solicitar Homologação</span>
                </button>
              </form>

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('login');
                  }}
                  className="text-xs text-[#8E9BAE] hover:text-white cursor-pointer"
                >
                  Já possui cadastro? Entrar aqui
                </button>
              </div>
            </div>
          )}

          {/* MODO 4: CONFIRMAÇÃO DE CÓDIGO */}
          {mode === 'verify' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#0A1428] border border-[#16264A] rounded-[8px] text-xs text-[#C3CBDA]">
                Digite o código de 6 dígitos enviado para <strong className="text-white">{pendingVerifyEmail}</strong> (Código demo de teste: <span className="font-mono text-[#FFC20E]">123456</span>).
              </div>

              <form onSubmit={handleVerify} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#C3CBDA] mb-1">
                    Código de Validação (6 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-[#060D1B] border border-[#16264A] focus:border-[#FFC20E] rounded-[8px] px-3 py-2.5 text-center font-mono text-base tracking-[0.3em] text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full btn-yellow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Validação</span>
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-[#8E9BAE] hover:text-white cursor-pointer"
                >
                  Voltar ao Login
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
