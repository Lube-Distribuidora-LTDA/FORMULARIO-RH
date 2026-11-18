/**
 * servidor_local.js — abre o formulário no seu computador, antes (ou sem) publicar na Vercel.
 *
 *   INICIAR.bat   (ou: cd web, npm install uma vez, node servidor_local.js)
 *   abra http://localhost:3116
 *
 * Usa AS MESMAS funções da Vercel (api/enviar.js e api/adm.js) e o banco de verdade
 * (DATA WAREHOUSE), com as variáveis SUPABASE_DB_* do ENV de um ETL desta máquina.
 *
 * Diferenças de propósito, para teste não sujar a lista do RH:
 *  - o que se envia daqui entra com origem "teste" e NÃO aparece na tela ADM;
 *  - a senha do ADM daqui é uma senha de teste, gerada na primeira vez e guardada em
 *    web/.senha-local (fora do git e da Vercel). A de verdade só existe na Vercel.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const WEB = __dirname;
const PORTA = Number(process.env.PORTA || 3116);

function carregarEnv(arquivo, so) {
  for (const linha of fs.readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    if (linha.trim().startsWith("#")) continue;
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(linha);
    if (!m || (so && !so.test(m[1]))) continue;
    let v = m[2];
    if (/^".*"$/.test(v) || /^'.*'$/.test(v)) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

const envBanco = [process.argv[2], "C:\\BI\\COMERCIAL\\ENV", "C:\\BI\\COMPRAS\\ENV", "P:\\INTEGRAÇÃO BI\\REPOSICOES\\ENV"]
  .filter(Boolean).find((c) => fs.existsSync(c));
if (envBanco) carregarEnv(envBanco, /^SUPABASE_DB_/);
else console.warn("Aviso: não achei um ENV com SUPABASE_DB_*; a tela abre, mas enviar e ADM vão falhar.");
process.env.SUPABASE_DB_PORT = process.env.SUPABASE_DB_PORT || "5432";

const arqSenha = path.join(WEB, ".senha-local");
if (!fs.existsSync(arqSenha)) fs.writeFileSync(arqSenha, crypto.randomBytes(9).toString("base64url") + "\n", "utf8");
process.env.ADMIN_SENHA = fs.readFileSync(arqSenha, "utf8").trim();
process.env.FORM_ORIGEM = "teste";

const rotas = {
  "/api/enviar": require(path.join(WEB, "api", "enviar.js")),
  "/api/adm": require(path.join(WEB, "api", "adm.js")),
};
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".json": "application/json", ".ico": "image/x-icon",
};
const PROIBIDOS = /(^|[\\/])(\.senha-local|servidor_local\.js|package(-lock)?\.json|node_modules|api)([\\/]|$)/;

http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  if (rotas[u.pathname]) {
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (o) => { res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(o)); };
    req.query = Object.fromEntries(u.searchParams);
    const partes = [];
    let tamanho = 0;
    req.on("data", (p) => { tamanho += p.length; if (tamanho > 1e6) { req.destroy(); return; } partes.push(p); });
    req.on("end", () => {
      req.body = Buffer.concat(partes).toString("utf8");
      Promise.resolve(rotas[u.pathname](req, res)).catch((e) => { console.error(e); if (!res.headersSent) res.status(500).json({ erro: String(e.message || e) }); });
    });
    return;
  }
  let rel = decodeURIComponent(u.pathname);
  if (rel === "/") rel = "/index.html";
  const arq = path.normalize(path.join(WEB, rel));
  if (!arq.startsWith(WEB) || PROIBIDOS.test(path.relative(WEB, arq))) { res.statusCode = 404; return res.end("não encontrado"); }
  fs.readFile(arq, (e, buf) => {
    if (e) { res.statusCode = 404; return res.end("não encontrado"); }
    res.setHeader("Content-Type", TIPOS[path.extname(arq).toLowerCase()] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-store");
    res.end(buf);
  });
}).listen(PORTA, "127.0.0.1", () => {
  console.log("Formulário RH em http://localhost:" + PORTA + "  (banco: " + (envBanco ? "ENV encontrado" : "SEM banco") + ")");
  console.log("Senha de teste do ADM: no arquivo web/.senha-local (só vale nesta máquina).");
});
