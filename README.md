# Formulário de Mapeamento de Funções e Atividades — RH da Lube

O formulário do RH ("Mapeamento de Funções e Atividades") num site próprio, **fora do Painel Lube** (decisão do
Júlio, 2026-11-18): todo funcionário responde pelo celular ou computador **sem login**, e só quem tem a **senha do
ADM** vê quem respondeu e o que escreveu. Substitui o Microsoft Forms de 2026-11-05.

## Onde está

| O quê | Onde |
|---|---|
| Endereço (o link para os funcionários) | **https://formulario-rh-lube.vercel.app** |
| Endereço que a Vercel deu | `formulario-rh-three.vercel.app` (o `formulario-rh.vercel.app` é de outra conta) |
| Projeto na Vercel | `formulario-rh` (Root `web`, Other, `gru1`, Node 22.x, Vercel Authentication Standard) |
| Repositório | `Lube-Distribuidora-LTDA/FORMULARIO-RH` (público, sem dado de pessoa) |
| Publicado | 2026-11-18, primeiro deploy pela API |

## Como funciona

```
funcionário ──► index.html (7 páginas) ──► /api/enviar ──► formulario_rh.resposta (DATA WAREHOUSE)
RH ──► botão ADM + senha ──► /api/adm (confere a senha no servidor) ──► lista, ficha, imprimir, Excel
```

- **O navegador nunca fala com o banco.** As duas funções da Vercel conectam com credencial de servidor; as tabelas
  têm RLS ligado e sem políticas, e o schema não dá acesso às chaves `anon`/`authenticated`.
- **A senha do ADM** fica só na variável `ADMIN_SENHA` da Vercel e é conferida no servidor, em tempo constante.
  Trava: 5 erros da mesma origem em 15 min travam aquela origem; 30 erros de qualquer origem travam para todos.
  Toda tentativa fica em `formulario_rh.tentativa_adm`.
- **O envio** é aberto. Defesas: campo-isca para robô, até 30 envios por origem a cada 10 min (o escritório inteiro
  sai pelo mesmo IP), validação pelas mesmas regras da tela (`campos.js`) e tamanho máximo por campo.
- **IP não é guardado**: só uma impressão dele (`ip_hash`), para os limites funcionarem.
- O rascunho de quem está respondendo fica no próprio aparelho até enviar. Nada das respostas fica no aparelho do RH.
- **Fora da Sentinela de propósito**: o funcionário responde de casa e não tem login do Painel.

## Banco (DATA WAREHOUSE, `ivcnotrynogaljrvvyes`)

Schema `formulario_rh` (migração `formulario_rh_v1`):

| Tabela | O quê |
|---|---|
| `resposta` | uma linha por resposta: identificação, as 16 perguntas (as 11 e 13 com Sim/Não + "Se sim"), declaração, `origem` (`site`, `microsoft_forms`, `teste`), `origem_id`, `enviado_em` |
| `tentativa_adm` | cada tentativa de entrar no ADM (impressão do IP, certo ou errado) |

**As 10 respostas do Microsoft Forms** (cópia de 05/11 14:00, de 11/11 a 13/11) foram trazidas em 2026-11-18 com
`origem = 'microsoft_forms'` e `origem_id` = número da resposta lá, **idênticas letra por letra** (impressão SHA-256
de cada resposta conferida contra o Forms). Na tela aparecem com a etiqueta "Forms".

## Arquivos

| Arquivo | Papel |
|---|---|
| `web/campos.js` | as perguntas, na ordem do Word do RH; usado pela tela **e** pelo servidor |
| `web/index.html`, `estilo.css`, `app.js` | o formulário (identidade da Lube, celular primeiro) |
| `web/adm.js` | a Área do RH: senha, lista, filtros por empresa, busca, ficha, imprimir, Excel |
| `web/api/enviar.js`, `adm.js`, `_comum.js`, `_db.js` | as funções da Vercel (`_db.js` é o do SAC) |
| `web/servidor_local.js`, `INICIAR.bat` | abre na máquina em `http://localhost:3116` |

## Variáveis na Vercel (Production)

| Nome | Valor | Quem cadastra |
|---|---|---|
| `SUPABASE_DB_HOST` | `aws-0-sa-east-1.pooler.supabase.com` | Claude |
| `SUPABASE_DB_PORT` | `5432` (o 6543 trava neste projeto, ver o `_db.js`) | Claude |
| `SUPABASE_DB_NAME` | `postgres` | Claude |
| `SUPABASE_DB_USER` | `postgres.ivcnotrynogaljrvvyes` | Claude |
| `SUPABASE_DB_PASSWORD` | a senha do DATA WAREHOUSE (Sensitive) | **Júlio** |
| `ADMIN_SENHA` | a senha da Área do RH (Sensitive) | **Júlio** |

Sem `ADMIN_SENHA`, o botão ADM responde "senha ainda não cadastrada" e não mostra nada.

## Testar na máquina

`INICIAR.bat`. O que se envia daqui entra como `origem = 'teste'` e **não aparece no ADM**; a senha do ADM local é de
teste, gerada na primeira vez em `web/.senha-local` (fora do git e da Vercel).
