[![CI do portfólio](https://github.com/OaugustO797/portfolio-devops/actions/workflows/ci.yml/badge.svg?event=pull_request)](https://github.com/OaugustO797/portfolio-devops/actions/workflows/ci.yml)
[![Publicação no GitHub Pages](https://github.com/OaugustO797/portfolio-devops/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/OaugustO797/portfolio-devops/actions/workflows/deploy.yml)

# Portfólio de Onofre Augusto

Portfólio profissional estático com projetos web, habilidades técnicas e uma esteira de CI/CD no GitHub Actions.

## Validação local

Use Node.js e Bash (Git Bash no Windows). A primeira verificação exige o arquivo `index.html` na raiz. O script rejeita arquivos com mais de 500.000 bytes e procura termos proibidos nos arquivos que entram no pacote do site.

```sh
bash scripts/prepare-site.sh
npm ci
npm run lint
npm run check:links
```

A verificação de links precisa de acesso à internet. Ela também confere caminhos locais e âncoras.

## Configuração no GitHub

1. Em **Settings → Pages**, selecione **GitHub Actions** como origem da publicação. O deploy roda a cada push em `main` e publica os arquivos validados.
2. Após a primeira execução de CI em um PR, em **Settings → Branches**, crie uma regra para `main`. Exija Pull Request, atualização com a branch de destino e aprovação dos checks **Linter (Node 18)** e **Linter (Node 20)**. Ative **Do not allow bypassing the above settings** para aplicar a regra também a administradores.
3. Em **Settings → Collaborators**, convide `09116428-collab`.
4. Para receber alertas por e-mail das execuções que você dispara, acesse **Settings da conta → Notifications → System → Actions**, habilite **Email** e **Only notify for failed workflows**. [Notificações do GitHub Actions](https://docs.github.com/en/subscriptions-and-notifications/how-tos/managing-github-actions-notifications)

## Evidências do exercício

Abra um PR de demonstração para `main` com uma tag HTML sem fechamento. Registre a execução vermelha na aba **Actions**. Em seguida, corrija a tag no PR, aguarde os dois checks e faça o merge. Registre o workflow de publicação concluído na aba **Actions** e use a URL mostrada pelo ambiente `github-pages`.
