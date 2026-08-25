# Topema Meeting Hub

Crie uma aplicação web completa e responsiva de "Agendamento de Salas de Reunião" chamada "Topema - Gestão de Salas", utilizando a identidade visual da Topema (tons de azul corporativo escuro para o header/navegação, fundo cinza claro/off-white para as telas, cartões em branco com bordas sutis, e detalhes em verde esmeralda para status de "Disponível/Livre").

### 1. Perfines de Acesso e Permissões
- **Administrador (Admin):**
  - Pode cadastrar, editar e excluir salas.
  - Pode cadastrar novos usuários informando Nome, E-mail e Senha (com controle de perfil: Admin ou Usuário Comum).
  - Pode cancelar qualquer reserva do sistema.
- **Usuário Comum:**
  - Pode visualizar todas as reservas e status das salas.
  - Pode criar reservas para as salas cadastradas.
  - Pode cancelar **apenas** as reservas criadas por ele mesmo.
  - Usuários que não criaram a reserva ou não são administradores têm apenas acesso de visualização (botão de cancelamento desabilitado).

### 2. Gestão de Salas (Painel do Admin)
- O Admin pode cadastrar as salas iniciais da Topema: **Sala Azul, Sala Branca, Sala Amarela e Sala Laranja**.
- Para cada sala, o Admin deve poder definir:
  - Nome da sala.
  - Upload de foto real da sala (para o usuário ver exatamente qual é).
  - Descrição detalhada e lista de materiais disponíveis na sala (ex: TV 55", projetor, flipchart, adaptadores, etc.).

### 3. Fluxo de Agendamento e Detalhes da Reunião
- **Seleção da Sala:** O usuário escolhe a sala visualizando a foto real e a descrição/materiais disponíveis.
- **Seleção de Data e Horário:** Grade interativa de horários (estilo a referência de horários do dia, ex: 08:00 às 09:55, 10:00, etc.) indicando visualmente o que está **Livre (Verde)** e **Reservado (Cinza/Vermelho com o nome de quem reservou)**.
- **Nome da Reunião:** Campo obrigatório para o título do encontro.
- **Participantes e Convites por E-mail:** Campo para adicionar os e-mails dos participantes da reunião. Ao finalizar a reserva, o sistema deve disparar um invite/notificação por e-mail para os participantes.
- **Comentários / Link de Videoconferência:** Um campo de texto livre onde o usuário pode inserir observações e links de acesso remoto (ex: link do Microsoft Teams ou Google Meet). Esse comentário deve constar de forma clara no corpo do e-mail enviado aos participantes.

### 4. Visões de Calendário e Dashboards (Dia, Mês e Ano)
- O sistema deve ter abas ou filtros para alternar rapidamente entre:
  - **Visão Diária:** Linha do tempo dos horários da sala escolhida no dia.
  - **Visão Mensal:** Calendário consolidado do mês mostrando os dias com ocupação.
  - **Visão Anual:** Panorama geral de uso ao longo do ano.

### 5. Extras e Interatividade sugerida
- Interface limpa, moderna, com animações suaves (utilizando Tailwind CSS e componentes shadcn/ui).
- Indicadores visuais intuitivos (badges verdes para salas/horários disponíveis e cinzas/azuis para ocupados).
- Confirmações modais elegantes para ações críticas (como cancel
ar uma reserva ou excluir uma sala).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://topema-room-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d10fc354-9312-455e-a730-66322984b0e3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
