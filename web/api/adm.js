/**
 * POST /api/adm — a tela ADM: com a senha certa, devolve todas as respostas.
 *
 * A senha fica só na variável ADMIN_SENHA da Vercel (cadastrada pelo Júlio) e é
 * conferida AQUI, no servidor; o navegador nunca recebe nada antes disso.
 * Contra chute de senha:
 *  - 5 erros da mesma origem em 15 minutos travam aquela origem por 15 minutos;
 *  - 30 erros de qualquer origem em 15 minutos travam a tela para todos;
 *  - comparação em tempo constante (timingSafeEqual).
 * Toda tentativa fica em formulario_rh.tentativa_adm (só a impressão do IP).
 */
const crypto = require("crypto");
const { consultar, faltandoVariaveis } = require("./_db");
const { lerCorpo, ipHash, semCache } = require("./_comum");
const { TODOS } = require("../campos.js");

const ERROS_POR_ORIGEM = 5;
const ERROS_GERAIS = 30;

function hash(s) { return crypto.createHash("sha256").update(String(s), "utf8").digest(); }

module.exports = async (req, res) => {
  semCache(res);
  if (req.method !== "POST") return res.status(405).json({ erro: "metodo", mensagem: "Use POST." });
  const senhaCerta = process.env.ADMIN_SENHA || "";
  if (!senhaCerta) {
    return res.status(503).json({ erro: "sem_senha", mensagem: "A senha do ADM ainda não foi cadastrada (variável ADMIN_SENHA na Vercel)." });
  }
  if (faltandoVariaveis().length) {
    return res.status(503).json({ erro: "config", mensagem: "O formulário ainda não está ligado ao banco." });
  }

  const corpo = lerCorpo(req);
  const senha = typeof corpo.senha === "string" ? corpo.senha : "";
  const ip = ipHash(req);

  try {
    const t = await consultar(
      "select count(*) filter (where ip_hash = $1)::int as daqui, count(*)::int as todas " +
      "from formulario_rh.tentativa_adm where not ok and quando > now() - interval '15 minutes'",
      [ip]
    );
    const { daqui, todas } = t.rows[0];
    if (daqui >= ERROS_POR_ORIGEM || todas >= ERROS_GERAIS) {
      return res.status(429).json({ erro: "travado", mensagem: "Muitas tentativas com senha errada. Espere 15 minutos e tente de novo." });
    }

    const ok = senha.length > 0 && crypto.timingSafeEqual(hash(senha), hash(senhaCerta));
    await consultar("insert into formulario_rh.tentativa_adm (ip_hash, ok) values ($1, $2)", [ip, ok]);
    if (!ok) {
      const restam = Math.max(0, ERROS_POR_ORIGEM - daqui - 1);
      return res.status(401).json({ erro: "senha", mensagem: "Senha incorreta." + (restam ? " Restam " + restam + " tentativa(s)." : " A tela travou por 15 minutos.") });
    }

    const cols = ["id", "enviado_em", "origem"].concat(TODOS.map((c) => c.id));
    const r = await consultar(
      "select " + cols.join(", ") + " from formulario_rh.resposta where origem <> 'teste' order by enviado_em desc"
    );
    return res.status(200).json({ ok: true, total: r.rowCount, lido_em: new Date().toISOString(), respostas: r.rows });
  } catch (e) {
    console.error("Falha na tela ADM:", e);
    return res.status(502).json({ erro: "falha_no_banco", mensagem: "Não consegui ler as respostas agora. Tente de novo em instantes." });
  }
};
