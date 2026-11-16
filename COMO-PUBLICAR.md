# Publicar o site da 4TECH

Este pacote contém o site atual completo: planta conceitual da V6, painel fotográfico, cartões roxos escurecidos, transições, ajustes responsivos, fonte Nexa Bold, playlist, fotografias e vídeos utilizados. Não inclui rascunhos, páginas de teste ou versões antigas.

## Como colocar online

1. Extraia o ZIP em uma pasta.
2. Envie **todo o conteúdo extraído** para a pasta pública da sua hospedagem, preservando as pastas e os nomes dos arquivos. Em hospedagens com cPanel, essa pasta costuma ser `public_html` ou a pasta definida para o domínio.
3. O arquivo **`index.html` precisa ficar na raiz do site**, ao lado de `css/`, `js/`, `img/`, `video/`, `audio/` e `fonts/`.
4. Aponte seu domínio para a hospedagem e ative HTTPS no painel do provedor.
5. Abra o domínio e confira a navegação, o formulário de WhatsApp, os vídeos, a playlist e a troca de cômodos.

O site é estático. Não exige WordPress, Node.js, instalação de pacotes, banco de dados ou servidor Python. Não envie apenas o `index.html`: os recursos das outras pastas são necessários. O endereço `127.0.0.1:4173` da prévia local não deve ser usado como endereço público.

## O que está incluído

| Arquivo ou pasta | Conteúdo |
| --- | --- |
| `index.html` | Página principal, seções, planta e painel. |
| `css/` | Estilos, responsividade e fontes. |
| `js/` | Navegação, diálogos, controles e player. |
| `img/` | Logo, favicon e fotografias utilizadas. |
| `video/` | Vídeos utilizados pelo site. |
| `audio/` | Três faixas da playlist e seus créditos. |
| `fonts/` | Nexa Bold, demais fontes utilizadas e licenças. |

## Informações importantes

**Mantenha os créditos e licenças.** O rodapé contém o crédito à Fontfabric exigido pela licença enviada da Nexa Bold. O player contém a atribuição a Kevin MacLeod, com músicas sob CC BY 4.0. Os documentos de licença estão em `fonts/` e `audio/CREDITOS.md`.

O formulário prepara uma mensagem para revisão e envio no WhatsApp; não grava contatos em banco de dados nem envia mensagens sozinho. A planta é conceitual, com Estar, Cinema, Trabalho e Jantar. Luz e ar são uma simulação; não há integração com equipamentos reais ou Control4. A playlist reproduz áudio real no navegador e inicia apenas após uma ação do visitante. Em alguns aparelhos, o volume precisa ser ajustado pelos botões do dispositivo.

Os estados dos controles não são permanentes; recarregar a página reinicia a demonstração. A hospedagem precisa servir os arquivos com seus caminhos relativos, inclusive MP3, MP4, SVG, WOFF2 e OTF. Depois de uma atualização, se o navegador mantiver o visual antigo, atualize a página sem cache.

Nenhuma publicação ou alteração de domínio foi realizada nesta tarefa; este ZIP é o pacote para você enviar à hospedagem.
