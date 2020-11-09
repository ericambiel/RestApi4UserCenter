# RestApi4UserCenter
REST API que irá fornecer todos os dados necessário para o projeto UserCenter: https://github.com/ericambiel/usercenter

**Andamento do Projeto**
---

- [ ] **Modulo - Usuário**
   - [x] Criação end points Inserção/Modificação/Alteração/Exclusão.
   - [x] Acesso validados por JWT.
   - [ ] Criar ***refresh JWT*** (AKA Session Token). Evita que usuário fique digitando a senha para recupera JWT
   - [x] Controle de acessos(leitura/escrita) aos End-Points.
   - [x] Conexão LDAP a servidor Microsoft AD.

---

- [x] **Modulo - Contratos**
   - [x] Criação end points Inserção/Modificação/Alteração/Exclusão.
   - [x] Controle de acesso por responsáveis dos departamentos ao contrato. (Depto(s). Responsáveis/Participantes).
   - [x] Enviar e-mails dependendo de critérios específicos. (Vencidos/Vencendo/Indeterminados). ***Atualizado***
   
---

- [x] **Modulo - Departamentos**
   - [x] Criação end points Inserção/Modificação/Alteração/Exclusão.
   - [x] Relacionar Departamentos e Usuários.
   
---

- [x] **Modulo - Impressão Patrimônio**
   - [x] Criação end Inserção/Modificação/Alteração/Exclusão.
   - [x] Impressão de etiquetas em impressora Zebra.
