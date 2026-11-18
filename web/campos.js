/*
 * campos.js — as perguntas do Formulário de Mapeamento de Funções e Atividades.
 *
 * Um arquivo só para a tela (formulário e ADM) e para o servidor (api/enviar.js valida
 * por aqui), para os dois nunca divergirem. A ordem, o texto e as opções são os do Word
 * do RH, como no Microsoft Forms de 2026-11-05. Cada "id" é uma coluna de
 * formulario_rh.resposta no DATA WAREHOUSE.
 *
 * tipo: curto (uma linha) | longo (várias linhas) | opcao (escolha única) | declaracao
 * se:   o campo só aparece (e só é aceito) quando outro campo tem aquele valor
 */
(function (raiz) {
  var EMPRESAS = ["LUBE", "LUBE RJ", "L LOG", "IMPÉRIO LOG", "SERMAR"];
  var SIM_NAO = ["Sim", "Não"];

  var SECOES = [
    {
      titulo: "Identificação do funcionário",
      campos: [
        { id: "nome", rotulo: "Nome completo", tipo: "curto", obrig: true, max: 150 },
        { id: "empresa", rotulo: "Empresa", tipo: "opcao", opcoes: EMPRESAS, outra: true, obrig: true, max: 80 },
        { id: "setor", rotulo: "Setor/Departamento", tipo: "curto", obrig: true, max: 150 },
        { id: "cargo", rotulo: "Cargo atual", tipo: "curto", obrig: true, max: 150 },
        { id: "gestor", rotulo: "Gestor imediato", tipo: "curto", obrig: true, max: 150 },
        { id: "tempo_funcao", rotulo: "Tempo na função", tipo: "curto", obrig: true, max: 150, dica: "Exemplo: 2 anos e 3 meses" }
      ]
    },
    {
      titulo: "Descrição das atividades",
      campos: [
        { id: "p01_objetivo", num: 1, rotulo: "Qual é o principal objetivo da sua função na empresa?", tipo: "longo", obrig: true },
        { id: "p02_dia_a_dia", num: 2, rotulo: "Descreva detalhadamente as atividades que você realiza no seu dia a dia.", tipo: "longo", obrig: true },
        { id: "p03_semanal", num: 3, rotulo: "Quais atividades você realiza semanalmente?", tipo: "longo", obrig: true },
        { id: "p04_mensal_eventual", num: 4, rotulo: "Quais atividades você realiza mensalmente ou eventualmente?", tipo: "longo", obrig: true },
        { id: "p05_responsabilidades", num: 5, rotulo: "Quais são as principais responsabilidades do seu cargo?", tipo: "longo", obrig: true }
      ]
    },
    {
      titulo: "Rotina de trabalho",
      campos: [
        { id: "p06_sistemas", num: 6, rotulo: "Você utiliza sistemas, programas, equipamentos ou ferramentas para executar suas atividades? Quais?", tipo: "longo", obrig: true },
        { id: "p07_outros_setores", num: 7, rotulo: "Você realiza atividades que dependem de outros setores? Quais?", tipo: "longo", obrig: true },
        { id: "p08_contato_publico", num: 8, rotulo: "Você possui contato direto com clientes, fornecedores, motoristas ou outros públicos? Explique.", tipo: "longo", obrig: true },
        { id: "p09_conferencias", num: 9, rotulo: "Você realiza conferências, controles, relatórios ou preenchimento de documentos? Quais?", tipo: "longo", obrig: true }
      ]
    },
    {
      titulo: "Autonomia e responsabilidades",
      campos: [
        { id: "p10_autonomia", num: 10, rotulo: "Você tem autonomia para tomar decisões durante a execução das suas atividades? Quais decisões?", tipo: "longo", obrig: true },
        { id: "p11_supervisiona", num: 11, rotulo: "Você é responsável por orientar, acompanhar ou supervisionar outros funcionários?", tipo: "opcao", opcoes: SIM_NAO, obrig: true },
        { id: "p11_descricao", rotulo: "Se sim, descreva:", tipo: "longo", se: { campo: "p11_supervisiona", valor: "Sim" } },
        { id: "p12_responsavel_por", num: 12, rotulo: "Você é responsável por algum material, equipamento, veículo, estoque, documento ou informação?", tipo: "longo", obrig: true }
      ]
    },
    {
      titulo: "Atividades adicionais",
      campos: [
        { id: "p13_fora_da_descricao", num: 13, rotulo: "Existem atividades que você realiza atualmente, mas que não fazem parte da descrição formal do seu cargo?", tipo: "opcao", opcoes: SIM_NAO, obrig: true },
        { id: "p13_quais", rotulo: "Se sim, quais?", tipo: "longo", se: { campo: "p13_fora_da_descricao", valor: "Sim" } },
        { id: "p14_incorporar", num: 14, rotulo: "Existem atividades que você acredita que deveriam ser incorporadas à sua função?", tipo: "longo", obrig: true },
        { id: "p15_dificuldades", num: 15, rotulo: "Quais são as maiores dificuldades ou desafios encontrados na execução do seu trabalho?", tipo: "longo", obrig: true }
      ]
    },
    {
      titulo: "Informações complementares",
      campos: [
        { id: "p16_complementar", num: 16, rotulo: "Existe alguma outra atividade ou responsabilidade que você considera importante registrar e que não foi mencionada nas perguntas anteriores?", tipo: "longo" }
      ]
    },
    {
      titulo: "Declaração do funcionário",
      campos: [
        {
          id: "declaracao", tipo: "declaracao", obrig: true,
          rotulo: "Declaro que as informações apresentadas neste formulário correspondem às atividades e responsabilidades que desempenho atualmente no exercício da minha função."
        }
      ]
    }
  ];

  var TODOS = [];
  SECOES.forEach(function (s) { s.campos.forEach(function (c) { if (!c.max) c.max = 6000; TODOS.push(c); }); });

  var exportar = { SECOES: SECOES, TODOS: TODOS, EMPRESAS: EMPRESAS };
  if (typeof module !== "undefined" && module.exports) module.exports = exportar;
  else raiz.CAMPOS = exportar;
})(this);
