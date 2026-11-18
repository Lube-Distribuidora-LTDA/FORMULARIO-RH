/**
 * _comum.js — o que o envio e a tela ADM usam juntos: ler o corpo, identificar a
 * origem da chamada sem guardar o IP e validar uma resposta pelas regras de campos.js.
 */
const crypto = require("crypto");
const { TODOS } = require("../campos.js");

/** O corpo chega como objeto (Vercel, JSON) ou texto (servidor local). */
function lerCorpo(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === "object") return b;
  try { return JSON.parse(b); } catch (_) { return {}; }
}

/**
 * Impressão do IP, nunca o IP: serve para frear quem manda demais ou chuta senha,
 * sem guardar dado de quem respondeu. O "sal" pode vir da Vercel (FORM_SAL).
 */
function ipHash(req) {
  const xf = String((req.headers && req.headers["x-forwarded-for"]) || "").split(",")[0].trim();
  const ip = xf || (req.socket && req.socket.remoteAddress) || "desconhecido";
  const sal = process.env.FORM_SAL || "lube-formulario-rh";
  return crypto.createHash("sha256").update(sal + "|" + ip).digest("hex").slice(0, 32);
}

function texto(v) {
  if (v === undefined || v === null) return "";
  return String(v).replace(/\u0000/g, "").trim();
}

/**
 * Confere uma resposta contra campos.js. Devolve { valores, erros }:
 * valores = só as colunas conhecidas, já limpas; erros = [{ campo, mensagem }].
 */
function validar(corpo) {
  const valores = {};
  const erros = [];
  for (const c of TODOS) {
    if (c.tipo === "declaracao") {
      valores[c.id] = corpo[c.id] === true;
      if (c.obrig && !valores[c.id]) erros.push({ campo: c.id, mensagem: "Marque a declaração para enviar." });
      continue;
    }
    let v = texto(corpo[c.id]);
    // campo condicional: só vale quando a pergunta-mãe tem o valor esperado
    if (c.se && texto(corpo[c.se.campo]) !== c.se.valor) v = "";
    if (v.length > c.max) { erros.push({ campo: c.id, mensagem: "Texto longo demais (máximo " + c.max + " caracteres)." }); continue; }
    if (c.tipo === "opcao" && v && !c.outra && c.opcoes.indexOf(v) < 0) { erros.push({ campo: c.id, mensagem: "Opção inválida." }); continue; }
    if (c.obrig && !v) { erros.push({ campo: c.id, mensagem: "Resposta obrigatória." }); continue; }
    valores[c.id] = v || null;
  }
  return { valores, erros };
}

function semCache(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
}

module.exports = { lerCorpo, ipHash, validar, semCache };
