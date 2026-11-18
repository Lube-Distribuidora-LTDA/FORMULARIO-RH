/**
 * POST /api/enviar — grava uma resposta do formulário em formulario_rh.resposta.
 *
 * Aberto a qualquer pessoa (o funcionário não tem login). Defesas:
 *  - campo-isca "site": robô que preenche tudo recebe "ok" e nada é gravado;
 *  - no máximo 30 envios por origem a cada 10 minutos (o escritório inteiro sai pelo
 *    mesmo IP, então o limite é largo);
 *  - validação pelas mesmas regras da tela (campos.js), tamanho máximo por campo.
 * O IP não é guardado: só uma impressão dele (ip_hash), para o limite funcionar.
 */
const { consultar, faltandoVariaveis } = require("./_db");
const { lerCorpo, ipHash, validar, semCache } = require("./_comum");
const { TODOS } = require("../campos.js");

const LIMITE_POR_ORIGEM = 30;

module.exports = async (req, res) => {
  semCache(res);
  if (req.method !== "POST") return res.status(405).json({ erro: "metodo", mensagem: "Use POST." });
  if (faltandoVariaveis().length) {
    return res.status(503).json({ erro: "config", mensagem: "O formulário ainda não está ligado ao banco. Avise o RH." });
  }

  const corpo = lerCorpo(req);
  if (texto(corpo.site)) return res.status(200).json({ ok: true }); // isca para robô

  const { valores, erros } = validar(corpo);
  if (erros.length) return res.status(400).json({ erro: "validacao", campos: erros });

  const origem = process.env.FORM_ORIGEM === "teste" ? "teste" : "site";
  const ip = ipHash(req);

  try {
    const r = await consultar(
      "select count(*)::int as n from formulario_rh.resposta where ip_hash = $1 and enviado_em > now() - interval '10 minutes'",
      [ip]
    );
    if (r.rows[0].n >= LIMITE_POR_ORIGEM) {
      return res.status(429).json({ erro: "limite", mensagem: "Muitos envios seguidos deste local. Espere alguns minutos e tente de novo." });
    }

    const cols = TODOS.map((c) => c.id);
    const params = cols.map((c) => valores[c]);
    params.push(origem, ip);
    const marcas = params.map((_, i) => "$" + (i + 1));
    const sql =
      "insert into formulario_rh.resposta (" + cols.join(", ") + ", origem, ip_hash) values (" +
      marcas.join(", ") + ") returning id, enviado_em";
    const g = await consultar(sql, params);
    return res.status(200).json({ ok: true, id: g.rows[0].id, enviado_em: g.rows[0].enviado_em });
  } catch (e) {
    console.error("Falha ao gravar a resposta:", e);
    return res.status(502).json({ erro: "falha_no_banco", mensagem: "Não consegui salvar agora. Suas respostas continuam na tela: tente Enviar de novo em instantes." });
  }
};

function texto(v) { return v === undefined || v === null ? "" : String(v).trim(); }
