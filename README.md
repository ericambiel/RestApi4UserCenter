# RestApi4UserCenter
REST API que irá fornecer todos os dados necessário para o projeto UserCenter: https://github.com/ericambiel/usercenter

**Andamento dos Projetos**
---

- [ ] **Modulo - Usuário**
   - [x] Criação end points Inserção/Modificação/Alteração/Exclusão.
   - [x] Acesso validados por JWT.
   - [ ] Criar ***refresh JWT*** (AKA Session Token). Evita que usuário fique digitando a senha para recupera JWT
   - [x] Controle de acessos(leitura/escrita) aos End-Points.

---

- [ ] **Modulo - Contratos**
   - [x] Criação end points Inserção/Modificação/Alteração/Exclusão.
   - [ ] Associar responsáveis dos departamentos ao contrato (Depto(s). Responsáveis/Participantes). ***IMPLEMENTANDO***
   - [ ] Enviar e-mails dependendo de critérios específicos.
   
---

- [x] **Modulo - Departamentos**
   - [x] Criação end points Inserção/Modificação/Alteração/Exclusão.
   - [x] Relacionar Departamentos e Usuários.
   
---

- [ ] **Modulo - Impressão Patrimônio**
   - [ ] Criação end Inserção/Modificação/Alteração/Exclusão.
   - [ ] Impressão de etiquetas em impressora Zebra.