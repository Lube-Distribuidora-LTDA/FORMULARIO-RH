/* adm.js — a Área do RH: senha → lista de quem respondeu → ficha completa (imprimir) e Excel.
   A senha é conferida no servidor (/api/adm). Ela fica só na memória desta aba, para o
   Atualizar; fechou ou clicou em Sair, some. Nada das respostas é guardado no aparelho. */
(function () {
  "use strict";
  var C = window.CAMPOS;
  var el = function (id) { return document.getElementById(id); };
  var senhaMemoria = "";
  var respostas = [];
  var filtroEmpresa = "";
  var busca = "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function dataHora(iso) { var d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  function dataCurta(iso) { var d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("pt-BR"); }

  /* ---------- senha ---------- */
  el("btnAdm").addEventListener("click", function () {
    if (!el("telaAdm").hidden) return;
    el("janelaSenha").hidden = false; el("senhaErro").hidden = true; el("senha").value = ""; setTimeout(function () { el("senha").focus(); }, 50);
  });
  el("senhaCancelar").addEventListener("click", function () { el("janelaSenha").hidden = true; });
  el("janelaSenha").addEventListener("click", function (e) { if (e.target === el("janelaSenha")) el("janelaSenha").hidden = true; });
  el("formSenha").addEventListener("submit", function (e) {
    e.preventDefault();
    var s = el("senha").value; if (!s) return;
    var b = el("senhaEntrar"); b.disabled = true; b.textContent = "Entrando…";
    buscar(s).then(function (ok) {
      b.disabled = false; b.textContent = "Entrar";
      if (ok) { senhaMemoria = s; el("janelaSenha").hidden = true; el("senha").value = ""; abrirAdm(); }
    });
  });

  function buscar(s) {
    return fetch("/api/adm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senha: s }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j }; }); })
      .then(function (x) {
        if (x.status === 200 && x.j.ok) { respostas = x.j.respostas || []; el("admLido").textContent = x.j.total + " resposta(s) · lido em " + dataHora(x.j.lido_em); return true; }
        mostrarErroSenha(x.j.mensagem || "Não consegui entrar agora.");
        return false;
      })
      .catch(function () { mostrarErroSenha("Sem conexão com a internet."); return false; });
  }
  function mostrarErroSenha(msg) {
    if (!el("telaAdm").hidden) { alert(msg); return; }
    el("senhaErro").textContent = msg; el("senhaErro").hidden = false;
  }

  /* ---------- tela ADM ---------- */
  function abrirAdm() {
    el("telaFormulario").hidden = true; el("telaObrigado").hidden = true; el("telaAdm").hidden = false;
    filtroEmpresa = ""; busca = ""; el("admBusca").value = "";
    desenhar(); window.scrollTo(0, 0);
  }
  el("admSair").addEventListener("click", function () {
    senhaMemoria = ""; respostas = []; el("admLista").innerHTML = ""; el("admKpis").innerHTML = "";
    el("telaAdm").hidden = true; el("telaFormulario").hidden = false; window.scrollTo(0, 0);
  });
  el("admAtualizar").addEventListener("click", function () {
    var b = this; b.disabled = true; b.textContent = "Atualizando…";
    buscar(senhaMemoria).then(function () { b.disabled = false; b.textContent = "Atualizar"; desenhar(); });
  });
  el("admBusca").addEventListener("input", function () { busca = this.value.trim().toLowerCase(); desenharLista(); });

  function filtradas() {
    return respostas.filter(function (r) {
      if (filtroEmpresa && r.empresa !== filtroEmpresa) return false;
      if (!busca) return true;
      return [r.nome, r.setor, r.cargo, r.gestor, r.empresa].join(" ").toLowerCase().indexOf(busca) >= 0;
    });
  }

  function desenhar() { desenharKpis(); desenharLista(); }

  function desenharKpis() {
    var porEmpresa = {};
    respostas.forEach(function (r) { porEmpresa[r.empresa] = (porEmpresa[r.empresa] || 0) + 1; });
    var nomes = Object.keys(porEmpresa).sort(function (a, b) { return porEmpresa[b] - porEmpresa[a]; });
    el("admKpis").innerHTML =
      '<button class="kpi' + (filtroEmpresa ? "" : " ativo") + '" data-emp=""><b>' + respostas.length + "</b><span>TODAS</span></button>" +
      nomes.map(function (n) {
        return '<button class="kpi' + (filtroEmpresa === n ? " ativo" : "") + '" data-emp="' + esc(n) + '"><b>' + porEmpresa[n] + "</b><span>" + esc(n) + "</span></button>";
      }).join("");
  }
  el("admKpis").addEventListener("click", function (e) {
    var k = e.target.closest(".kpi"); if (!k) return;
    filtroEmpresa = k.getAttribute("data-emp") || ""; desenhar();
  });

  function desenharLista() {
    var lista = filtradas();
    if (!lista.length) { el("admLista").innerHTML = '<p class="vazio">' + (respostas.length ? "Nada encontrado com esse filtro." : "Ninguém respondeu ainda.") + "</p>"; return; }
    el("admLista").innerHTML =
      '<div class="linha cab"><span>Nome</span><span>Empresa</span><span>Setor</span><span>Cargo</span><span>Gestor</span><span>Enviado em</span></div>' +
      lista.map(function (r) {
        return '<button class="linha" data-id="' + r.id + '">' +
          '<span class="nome">' + esc(r.nome) + "</span>" +
          '<span class="mut c-emp">' + esc(r.empresa) + "</span>" +
          '<span class="mut c-setor">' + esc(r.setor) + "</span>" +
          '<span class="mut c-cargo">' + esc(r.cargo) + "</span>" +
          '<span class="mut c-gestor"><span class="pref">Gestor: </span>' + esc(r.gestor) + "</span>" +
          '<span class="mut c-data">' + dataCurta(r.enviado_em) + (r.origem === "microsoft_forms" ? ' <span class="etq forms" title="Respondido no Microsoft Forms e trazido para cá">Forms</span>' : "") + "</span>" +
          "</button>";
      }).join("");
  }
  el("admLista").addEventListener("click", function (e) {
    var l = e.target.closest(".linha[data-id]"); if (!l) return;
    var r = respostas.filter(function (x) { return String(x.id) === l.getAttribute("data-id"); })[0];
    if (r) abrirFicha(r);
  });

  /* ---------- ficha ---------- */
  function abrirFicha(r) {
    var ident = C.SECOES[0].campos.map(function (c) { return "<div><dt>" + esc(c.rotulo) + "</dt><dd>" + esc(r[c.id] || "—") + "</dd></div>"; }).join("");
    var blocos = C.SECOES.slice(1, -1).map(function (s, i) {
      return '<section class="bloco"><h3>' + (i + 2) + ". " + esc(s.titulo) + "</h3>" +
        s.campos.map(function (c) {
          var v = r[c.id];
          if (c.se && !v) return "";
          return '<div class="qa"><p class="q">' + (c.num ? c.num + ". " : "") + esc(c.rotulo) + '</p><p class="a' + (v ? "" : " vazia") + '">' + (v ? esc(v) : "Sem resposta") + "</p></div>";
        }).join("") + "</section>";
    }).join("");
    var decl = C.SECOES[C.SECOES.length - 1].campos[0];
    el("ficha").innerHTML =
      '<img class="ficha-marca" src="logo-lube.png" alt="Lube">' +
      '<div class="ficha-topo"><div><p class="selo">Mapeamento de Funções e Atividades</p><h2>' + esc(r.nome) + "</h2>" +
      '<p class="meta">Enviado em ' + dataHora(r.enviado_em) + (r.origem === "microsoft_forms" ? " · respondido no Microsoft Forms" : "") + "</p></div>" +
      '<div class="ficha-botoes"><button class="btn sec" id="fichaImprimir" type="button">Imprimir</button><button class="btn pri" id="fichaFechar" type="button">Fechar</button></div></div>' +
      '<dl class="ident">' + ident + "</dl>" + blocos +
      '<section class="bloco"><h3>7. Declaração do funcionário</h3><div class="qa"><p class="a">' + (r.declaracao ? "✔ " : "✘ ") + esc(decl.rotulo) + "</p></div></section>" +
      '<div class="assinaturas"><div>Assinatura do funcionário</div><div>Assinatura do gestor</div></div>';
    el("janelaFicha").hidden = false; el("ficha").scrollTop = 0;
    el("fichaFechar").onclick = fecharFicha;
    el("fichaImprimir").onclick = function () { window.print(); };
  }
  function fecharFicha() { el("janelaFicha").hidden = true; }
  el("janelaFicha").addEventListener("click", function (e) { if (e.target === el("janelaFicha")) fecharFicha(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!el("janelaFicha").hidden) fecharFicha(); else if (!el("janelaSenha").hidden) el("janelaSenha").hidden = true;
  });

  /* ---------- Excel (com a marca e o filtro escritos dentro) ---------- */
  el("admExcel").addEventListener("click", function () {
    var b = this; b.disabled = true; b.textContent = "Gerando…";
    carregarSheetJS().then(function () {
      var lista = filtradas();
      var cols = [{ id: "enviado_em", rotulo: "Enviado em" }].concat(C.TODOS.map(function (c) {
        return { id: c.id, rotulo: (c.num ? c.num + ". " : "") + (c.tipo === "declaracao" ? "Declaração" : c.rotulo) };
      })).concat([{ id: "origem", rotulo: "Origem" }]);
      var filtro = [filtroEmpresa ? "empresa " + filtroEmpresa : "", busca ? 'busca "' + busca + '"' : ""].filter(Boolean).join(", ");
      var linhas = [
        ["Lube Distribuidora · Formulário de Mapeamento de Funções e Atividades (RH)"],
        ["Exportado em " + new Date().toLocaleString("pt-BR") + " · " + lista.length + " de " + respostas.length + " resposta(s) · " + (filtro ? "filtro: " + filtro : "sem filtro")],
        [],
        cols.map(function (c) { return c.rotulo; })
      ].concat(lista.map(function (r) {
        return cols.map(function (c) {
          var v = r[c.id];
          if (c.id === "enviado_em") return dataHora(v);
          if (c.id === "declaracao") return v ? "Sim" : "Não";
          if (c.id === "origem") return v === "microsoft_forms" ? "Microsoft Forms" : "Site";
          return v == null ? "" : v;
        });
      }));
      var ws = window.XLSX.utils.aoa_to_sheet(linhas);
      ws["!cols"] = cols.map(function (c) { return { wch: /^p\d/.test(c.id) ? 50 : 22 }; });
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }];
      var wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Respostas");
      window.XLSX.writeFile(wb, "Mapeamento de Funcoes - Lube - " + new Date().toISOString().slice(0, 10) + ".xlsx");
    }).catch(function () { alert("Não consegui gerar o Excel agora (sem internet?)."); })
      .then(function () { b.disabled = false; b.textContent = "Excel"; });
  });
  function carregarSheetJS() {
    if (window.XLSX) return Promise.resolve();
    return new Promise(function (ok, erro) {
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.onload = ok; s.onerror = erro; document.head.appendChild(s);
    });
  }
})();
