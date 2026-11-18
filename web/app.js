/* app.js — o formulário em 7 páginas (uma por seção do Word do RH).
   O rascunho fica guardado neste aparelho enquanto a pessoa preenche (some ao enviar). */
(function () {
  "use strict";
  var SECOES = window.CAMPOS.SECOES;
  var CHAVE_RASCUNHO = "lube-mapeamento-rascunho-v1";
  var dados = lerRascunho();
  var atual = 0;

  var el = function (id) { return document.getElementById(id); };
  var form = el("form"), secaoEl = el("secao"), btnVoltar = el("btnVoltar"), btnAvancar = el("btnAvancar");

  function lerRascunho() {
    try { var t = localStorage.getItem(CHAVE_RASCUNHO); return t ? JSON.parse(t) || {} : {}; } catch (_) { return {}; }
  }
  function guardarRascunho() {
    try { localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(dados)); el("rascunho").hidden = false; } catch (_) { /* sem armazenamento: segue sem rascunho */ }
  }
  function apagarRascunho() { try { localStorage.removeItem(CHAVE_RASCUNHO); } catch (_) {} }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function visivel(c) { return !c.se || dados[c.se.campo] === c.se.valor; }

  function htmlCampo(c) {
    if (!visivel(c)) return "";
    var v = dados[c.id];
    var rot = '<span class="rotulo" id="r_' + c.id + '">' + (c.num ? '<span class="num">' + c.num + '.</span>' : "") +
      esc(c.rotulo) + (c.obrig ? '<span class="obrig" aria-hidden="true">*</span>' : "") + "</span>";
    var dica = c.dica ? '<span class="dica">' + esc(c.dica) + "</span>" : "";
    var corpo = "";
    if (c.tipo === "curto") {
      corpo = '<input type="text" name="' + c.id + '" maxlength="' + c.max + '" value="' + esc(v || "") + '" aria-labelledby="r_' + c.id + '">';
    } else if (c.tipo === "longo") {
      corpo = '<textarea name="' + c.id + '" maxlength="' + c.max + '" rows="4" placeholder="Escreva aqui" aria-labelledby="r_' + c.id + '">' + esc(v || "") + "</textarea>";
    } else if (c.tipo === "opcao") {
      var outraMarcada = c.outra && v && c.opcoes.indexOf(v) < 0;
      corpo = '<div class="opcoes' + (c.opcoes.length === 2 ? " duas" : "") + '" role="radiogroup" aria-labelledby="r_' + c.id + '">' +
        c.opcoes.map(function (o) {
          return '<label class="opcao"><input type="radio" name="' + c.id + '" value="' + esc(o) + '"' + (v === o ? " checked" : "") +
            '><span class="bolinha"></span>' + esc(o) + "</label>";
        }).join("") +
        (c.outra ? '<label class="opcao"><input type="radio" name="' + c.id + '" value="__outra"' + (outraMarcada ? " checked" : "") +
          '><span class="bolinha"></span>Outra</label>' : "") +
        "</div>" +
        (c.outra ? '<input type="text" class="outra-texto" name="' + c.id + '__outra" maxlength="' + c.max + '" placeholder="Qual empresa?" value="' +
          esc(outraMarcada ? v : "") + '"' + (outraMarcada ? "" : " hidden") + ">" : "");
    } else if (c.tipo === "declaracao") {
      corpo = '<label class="declaracao"><input type="checkbox" name="' + c.id + '"' + (v === true ? " checked" : "") + "><span>" + esc(c.rotulo) + "</span></label>";
      rot = "";
    }
    return '<div class="campo" data-campo="' + c.id + '">' + rot + dica + corpo + "</div>";
  }

  function desenhar() {
    var s = SECOES[atual];
    secaoEl.innerHTML =
      '<div class="secao-titulo"><span class="n">' + (atual + 1) + "</span><h2>" + esc(s.titulo) + "</h2></div>" +
      s.campos.map(htmlCampo).join("");
    el("barra").style.width = Math.round(((atual + 1) / SECOES.length) * 100) + "%";
    el("passo").textContent = "Página " + (atual + 1) + " de " + SECOES.length;
    btnVoltar.style.visibility = atual === 0 ? "hidden" : "visible";
    btnAvancar.textContent = atual === SECOES.length - 1 ? "Enviar" : "Avançar";
    el("avisoErro").hidden = true;
  }

  /* tudo o que a pessoa digita vai para "dados" na hora (e para o rascunho) */
  form.addEventListener("input", aoMudar);
  form.addEventListener("change", aoMudar);
  function aoMudar(ev) {
    var t = ev.target; if (!t.name || t.name === "site") return;
    var nome = t.name.replace(/__outra$/, "");
    var c = window.CAMPOS.TODOS.filter(function (x) { return x.id === nome; })[0];
    if (!c) return;
    if (c.tipo === "declaracao") dados[nome] = t.checked;
    else if (c.tipo === "opcao") {
      var marcada = form.querySelector('input[name="' + nome + '"]:checked');
      var caixaOutra = form.querySelector('input[name="' + nome + '__outra"]');
      if (marcada && marcada.value === "__outra") {
        if (caixaOutra) { caixaOutra.hidden = false; if (t === marcada) caixaOutra.focus(); }
        dados[nome] = caixaOutra ? caixaOutra.value.trim() : "";
      } else {
        if (caixaOutra) caixaOutra.hidden = true;
        dados[nome] = marcada ? marcada.value : "";
      }
      // mostrar/esconder o "Se sim" na hora
      if (t.type === "radio" && SECOES[atual].campos.some(function (x) { return x.se && x.se.campo === nome; })) {
        var foco = t.value; desenhar();
        var r = form.querySelector('input[name="' + nome + '"][value="' + foco + '"]'); if (r) r.focus();
      }
    } else dados[nome] = t.value;
    var bloco = t.closest(".campo"); if (bloco && bloco.classList.contains("erro")) { bloco.classList.remove("erro"); var m = bloco.querySelector(".msg-erro"); if (m) m.remove(); }
    guardarRascunho();
  }

  function marcarErro(id, msg) {
    var bloco = form.querySelector('.campo[data-campo="' + id + '"]');
    if (!bloco) return null;
    bloco.classList.add("erro");
    if (!bloco.querySelector(".msg-erro")) bloco.insertAdjacentHTML("beforeend", '<p class="msg-erro">' + esc(msg) + "</p>");
    return bloco;
  }

  function validarPagina() {
    var primeiro = null;
    SECOES[atual].campos.forEach(function (c) {
      if (!visivel(c) || !c.obrig) return;
      var v = dados[c.id];
      var vazio = c.tipo === "declaracao" ? v !== true : !(v && String(v).trim());
      if (vazio) {
        var msg = c.tipo === "declaracao" ? "Marque a declaração para enviar." : (c.tipo === "opcao" ? "Escolha uma opção." : "Resposta obrigatória.");
        var b = marcarErro(c.id, msg); if (b && !primeiro) primeiro = b;
      }
    });
    if (primeiro) {
      el("avisoErro").textContent = "Falta responder o que está marcado em vermelho.";
      el("avisoErro").hidden = false;
      primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
      var f = primeiro.querySelector("input, textarea"); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 300);
      return false;
    }
    return true;
  }

  btnVoltar.addEventListener("click", function () { if (atual > 0) { atual--; desenhar(); topo(); } });
  btnAvancar.addEventListener("click", function () {
    if (!validarPagina()) return;
    if (atual < SECOES.length - 1) { atual++; desenhar(); topo(); return; }
    enviar();
  });
  function topo() { window.scrollTo({ top: 0, behavior: "smooth" }); }

  function enviar() {
    btnAvancar.disabled = true; btnVoltar.disabled = true; btnAvancar.textContent = "Enviando…";
    var corpo = {}; window.CAMPOS.TODOS.forEach(function (c) { if (visivel(c)) corpo[c.id] = dados[c.id]; });
    corpo.site = form.querySelector('input[name="site"]').value;
    fetch("/api/enviar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j }; }); })
      .then(function (x) {
        if (x.status === 200 && x.j.ok) {
          apagarRascunho();
          var nome = String(dados.nome || "").trim().split(/\s+/)[0] || "";
          el("obrigadoTitulo").textContent = "Obrigado" + (nome ? ", " + nome : "") + "!";
          el("obrigadoQuando").textContent = "Enviado em " + new Date(x.j.enviado_em || Date.now()).toLocaleString("pt-BR");
          el("telaFormulario").hidden = true; el("telaObrigado").hidden = false; topo();
          return;
        }
        if (x.status === 400 && x.j.campos && x.j.campos.length) {
          // volta para a primeira página com problema
          var id = x.j.campos[0].campo;
          for (var i = 0; i < SECOES.length; i++) if (SECOES[i].campos.some(function (c) { return c.id === id; })) { atual = i; break; }
          desenhar(); x.j.campos.forEach(function (e) { marcarErro(e.campo, e.mensagem); });
        }
        falha(x.j.mensagem || "Não deu para enviar agora. Tente de novo.");
      })
      .catch(function () { falha("Sem conexão com a internet. Suas respostas continuam aqui: tente Enviar de novo."); });
  }
  function falha(msg) {
    btnAvancar.disabled = false; btnVoltar.disabled = false;
    btnAvancar.textContent = atual === SECOES.length - 1 ? "Enviar" : "Avançar";
    el("avisoErro").textContent = msg; el("avisoErro").hidden = false;
  }

  if (Object.keys(dados).length) el("rascunho").hidden = false;
  desenhar();
})();
