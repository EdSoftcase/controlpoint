import { SPECIFICATION_SCREENS, LEGAL_MATRIX_ITEMS } from '../data/specificationDoc';

export function generateSpecificationMarkdown(): string {
  let md = `# SOFTCASE PONTO
## DOCUMENTO 02 — ESPECIFICAÇÃO FUNCIONAL DETALHADA
**Versão:** 1.0  
**Data:** 02 de Novembro de 2026  
**Status:** Oficial / Referência para Desenvolvimento de Software  
**Conformidade:** Portaria MTP nº 671/2021, CLT Art. 74 e LGPD (Lei nº 13.709/2018)

---

### SUMÁRIO EXECUTIVO

Este documento detalha o comportamento funcional, requisitos de interface, regras de negócio estritas, controles de acesso e critérios de aceite para as telas do **Módulo 01 (Administração da Plataforma Softcase)** e **Módulo 02 (Cadastro e Estrutura Organizacional)** do sistema **Softcase Ponto**.

Conforme diretriz do projeto: nenhuma funcionalidade é implementada sem antes definir seu comportamento, seus requisitos legais e a forma pela qual será auditada e testada.

---

### MATRIZ DE CONFORMIDADE LEGAL APLICÁVEL

| Artigo / Norma | Tema Regulatório | Exigência Legal | Atendimento no Softcase Ponto |
| :--- | :--- | :--- | :--- |
${LEGAL_MATRIX_ITEMS.map(
  (item) => `| ${item.artigo} | ${item.tema} | ${item.exigenciaLegal} | ${item.implementacaoSoftcase} |`
).join('\n')}

---

## ESPECIFICAÇÃO DETALHADA TELA A TELA

`;

  SPECIFICATION_SCREENS.forEach((screen, idx) => {
    md += `### ${idx + 1}. [${screen.code}] ${screen.title}\n`;
    md += `**Módulo:** ${screen.module}  \n`;
    md += `**Objetivo:** ${screen.subtitle}  \n`;
    md += `**Base Legal:** ${screen.legalBasis.join('; ')}  \n\n`;

    md += `#### 1. Aparência e Organização\n`;
    md += `${screen.aparenciaOrganizacao.wireframeDescription}\n\n`;
    md += `**Zonas da Interface:**\n`;
    screen.aparenciaOrganizacao.zones.forEach((z) => {
      md += `- **${z.name}**: ${z.description}\n`;
      md += `  - *Elementos:* ${z.elements.join(', ')}\n`;
    });
    md += `\n**Comportamento Responsivo:** ${screen.aparenciaOrganizacao.gridResponsiveness}\n\n`;

    md += `#### 2. Campos e Validações\n\n`;
    md += `| Campo | Tipo | Obrigatório | Máscara | Regra de Validação | Impacto no Negócio / Legal |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    screen.camposEValidacoes.forEach((f) => {
      md += `| ${f.name} | ${f.type} | ${f.required ? 'Sim' : 'Não'} | ${f.mask || '-'} | ${f.validationRule} | ${f.businessImpact} |\n`;
    });
    md += `\n`;

    md += `#### 3. Botões e Ações\n\n`;
    md += `| Botão / Ação | Tipo | Atalho | Estado de Carregamento | Comportamento e Ação Executada |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    screen.botoesEAcoes.forEach((b) => {
      md += `| ${b.label} | ${b.type.toUpperCase()} | ${b.shortcut || '-'} | ${b.loadingStateBehavior} | ${b.actionDescription} |\n`;
    });
    md += `\n`;

    md += `#### 4. Regras de Negócio\n\n`;
    screen.regrasDeNegocio.forEach((r) => {
      md += `- **${r.code} — ${r.title}** [Grau: ${r.invarianceLevel}]\n`;
      md += `  - *Regra:* ${r.rule}\n`;
      md += `  - *Impacto Legal:* ${r.legalImpact}\n`;
    });
    md += `\n`;

    md += `#### 5. Permissões de Acesso (RBAC)\n\n`;
    md += `| Perfil de Usuário | Nível de Acesso | Descrição do Privilégio |\n`;
    md += `| :--- | :--- | :--- |\n`;
    screen.permissoes.forEach((p) => {
      md += `| ${p.role} | ${p.accessLevel} | ${p.description} |\n`;
    });
    md += `\n`;

    md += `#### 6. Mensagens de Erro e Tratamento\n\n`;
    md += `| Código | Mensagem Exibida ao Usuário | Causa Raiz Técnica | Ação Corretiva Recomendada |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    screen.mensagensDeErro.forEach((e) => {
      md += `| \`${e.code}\` | ${e.message} | ${e.cause} | ${e.resolution} |\n`;
    });
    md += `\n`;

    md += `#### 7. Comportamentos Esperados\n\n`;
    screen.comportamentosEsperados.forEach((c) => {
      md += `- **Cenário:** ${c.scenario}\n`;
      md += `  - *Comportamento:* ${c.expectedBehavior}\n`;
    });
    md += `\n`;

    md += `#### 8. Critérios de Teste e Aceite (Gherkin BDD)\n\n`;
    screen.criteriosDeTeste.forEach((ct) => {
      md += `##### [${ct.id}] ${ct.title}\n`;
      md += `\`\`\`gherkin\n`;
      md += `Dado ${ct.given}\n`;
      md += `Quando ${ct.when}\n`;
      md += `Então ${ct.then}\n`;
      md += `Validação Legal: ${ct.legalComplianceCheck}\n`;
      md += `\`\`\`\n\n`;
    });

    md += `\n---\n\n`;
  });

  md += `\n*Fim do Documento 02 — Softcase Ponto*\n`;
  return md;
}
