# Implementação da Tela do Menu Hambúrguer em Tela Cheia (TRANSEG)

Recriação com fidelidade pixel-perfect do menu hambúrguer em tela cheia conforme a captura de tela (`Screenshot_20261012-104528.png`), integrando a tipografia tática da TRANSEG, paleta de cores corporativa (#0A1428 e dourado #FFC20E), chips táteis de especialidades operacionais, links institucionais e botão do WhatsApp, sem o botão com número de telefone na base.

## Decisões Confirmadas & Alinhamento

> [!IMPORTANT]
> **Definições adotadas com base nas solicitações do usuário:**
> - **Navbar & Menu Hambúrguer**: Visual idêntico ao modelo de referência, com backdrop escuro tático, logo TRANSEG à esquerda e botão circular de fechamento com "X" à direita.
> - **Item "Início" em Destaque**: Tipografia imponente com destaque dourado (`#FFC20E`) e transições táteis ao toque/hover.
> - **Item "Serviços" com Chips Táteis**: Exibição elegante em tipografia branca com badges/chips compactos das principais especialidades de segurança (Escolta Armada, Vigilância Patrimonial, Ronda Motorizada, Tecnologia/Segurança Pessoal VIP).
> - **Exclusão Solicitada**: Conforme solicitado na instrução anterior, **nenhum botão ou bloco de telefone fixo/celular** será exibido no rodapé inferior da tela cheia.
> - **Canal WhatsApp**: Acesso direto ao canal oficial de atendimento via WhatsApp na parte inferior com acabamento sutil e elegante.
> - **Acessos Restritos**: Central CCO e Área do Profissional preservados de forma limpa e discreta para administradores e agentes homologados.

---

## 1. Visão Geral e Conceito da Experiência

A tela do menu hambúrguer da TRANSEG é o ponto central de navegação rápida para o cliente e para a equipe operacional. Ela deve transmitir a autoridade, precisão e sobriedade de uma empresa de segurança patrimonial e armada de elite, oferecendo:
- Abertura suave e imersiva cobrindo a tela (`fixed inset-0`).
- Tipografia em caixa alta com estilo militar/tático refinado (`font-brand-title`).
- Acesso com um clique a: Início, Sobre Nós, Serviços (com seleção direta do tipo de escolta ou vigilância), Contato, Meus Pedidos e Botão de Pânico (SOS).
- Acessos corporativos restritos integrados (Área do Profissional e Central CCO).

---

## 2. Experiência do Usuário e Design Visual (UI/UX)

```
┌────────────────────────────────────────────────────────┐
│  [LOGO TRANSEG]                          ( X Fechar )  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  INÍCIO                                             >  │  (Amarelo/Dourado #FFC20E)
│                                                        │
│  SERVIÇOS                                              │  (Branco #FFFFFF)
│  ┌───────────────────────┐ ┌────────────────────────┐  │
│  │ Escolta de Cargas     │ │ Tecnologia & Rastreio  │  │  (Chips arredondados)
│  └───────────────────────┘ └────────────────────────┘  │
│  ┌───────────────────────┐ ┌────────────────────────┐  │
│  │ Vigilância Armada     │ │ Segurança Pessoal VIP  │  │
│  └───────────────────────┘ └────────────────────────┘  │
│                                                        │
│  SOBRE NÓS                                          >  │
│                                                        │
│  MEUS PEDIDOS                                       >  │
│                                                        │
│  SOS / BOTÃO DE PÂNICO                              >  │  (Rubi/Alerta #DC2626)
│                                                        │
├────────────────────────────────────────────────────────┤
│  [Central CCO]                  [Área do Profissional] │
├────────────────────────────────────────────────────────┤
│             [ Falar no WhatsApp TRANSEG ]              │  (Sem número de telefone)
└────────────────────────────────────────────────────────┘
```

### Paleta e Tokens Visuais
- **Fundo Principal**: `#060D1B` a `#0A1428` com sutil textura de malha tática em opacidade reduzida.
- **Destaque Primário**: Amarelo Ouro TRANSEG (`#FFC20E`), aplicado no estado ativo de navegação e acentos de foco.
- **Tipografia**: `Saira` / `Bebas Neue` / `Plus Jakarta Sans` com pesos 700 e 800 para títulos, garantindo alta legibilidade em qualquer dispositivo móvel ou desktop.
- **Botão Fechar**: Círculo dark glass (`#11203D`) com contorno `#1E335C` e ícone `X` nítido com target de toque de 44px.

---

## 3. Decisões Técnicas de Implementação

1. **Header.tsx Refinado**:
   - Ajustar o overlay do menu hambúrguer para bater 100% com as proporções, cores e hierarquia tipográfica da imagem.
   - Adicionar os chips táteis de especialidades sob "Serviços" com navegação imediata para abertura da modal de solicitação ou lista de serviços.
   - Garantir compatibilidade total com desktop e mobile (responsivo, `pb-safe`, scroll sem quebra).
2. **Eliminação do Telefone**:
   - Manter estritamente removido qualquer botão ou indicação com número de telefone no rodapé da tela cheia, mantendo apenas o canal WhatsApp e copyright institucional discreto.
3. **Preservação Funcional**:
   - Manter todas as rotas e funções existentes (abrir sobre nós, abrir login profissional, abrir admin CCO, disparar SOS, consultar pedidos) 100% ativas e sem dead-clicks.

---

## 4. Estratégia de Validação

- Testar abertura e fechamento do menu via botão hambúrguer da navbar e botão `X`.
- Testar toque nos chips de serviços e conferir transição para criação de pedidos.
- Validar ausência de botões com número de telefone no rodapé.
- Executar `compile_applet` e `lint_applet` para assegurar build limpo sem erros de tipagem.
