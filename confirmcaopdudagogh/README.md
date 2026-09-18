# 🌟 Sistema Real de Gerenciamento de Convidados & RSVP (Firebase + Firestore)

Sistema completo, moderno e de altíssima performance para gerenciamento de convidados de convites digitais, com painel administrativo protegido e confirmação pública individual por token seguro.

---

## 🎨 Visual & Design
- **Tema Inspirado na "Noite Estrelada" de Van Gogh**: Tons de azul profundo (`#0b0f19`), azul médio (`#131b2e`), realces dourados discretos (`#f59e0b`) e efeito de vidro escuro (*glassmorphism*).
- **Sem Protótipos / Sem Dados Fictícios**: Todos os dados são sincronizados em tempo real diretamente com o **Firebase Firestore**.

---

## 📁 Estrutura do Projeto

```
confirmcaopdudagogh/
├── index.html            # Hub de entrada e busca rápida por token
├── admin.html            # Painel Administrativo (Login + Dashboard + CRUD de Convites)
├── confirmar.html        # Página Pública de RSVP (confirmar.html?grupo=TOKEN)
├── css/
│   ├── style.css         # Variáveis Globais, Design System Van Gogh & Toast/Spinners
│   └── admin.css         # Estilização do Dashboard, Grid de Métricas & Modais
├── js/
│   ├── firebase.js       # Inicialização das instâncias do Firebase Auth & Firestore
│   ├── auth.js           # Monitoramento de sessão e autenticação de administrador
│   ├── grupos.js         # Módulo CRUD de Grupos e geração de tokens únicos
│   ├── admin.js          # Sincronização de métricas em tempo real e renderização
│   └── confirmar.js      # Lógica da página pública de RSVP e envio de respostas
├── firestore.rules       # Regras de Segurança Reais para o Firestore
├── iniciar.bat           # Script para rodar servidor web local
├── enviar_para_github.bat # Script bat para commit e push automático no GitHub
└── README.md             # Guia de Configuração e Implantação
```

---

## 🔧 Passo a Passo de Configuração no Firebase

### 1. Criar o Projeto no Firebase Console
1. Acesse [Firebase Console](https://console.firebase.google.com/).
2. Clique em **Adicionar projeto** e nomeie o projeto (Ex: `confirmacao-de-presenca-e2c10`).

### 2. Ativar o Firebase Authentication
1. No menu lateral, acesse **Build > Authentication**.
2. Clique em **Get Started / Começar**.
3. Na aba **Sign-in method / Provedores de login**, selecione **E-mail/senha**.
4. Ative a opção **E-mail/senha** e clique em **Salvar**.
5. Na aba **Users / Usuários**, clique em **Adicionar usuário** e cadastre seu e-mail de administrador com uma senha forte.

### 3. Ativar o Firestore Database
1. No menu lateral, acesse **Build > Firestore Database**.
2. Clique em **Criar banco de dados**.
3. Escolha a localização do servidor (Ex: `southamerica-east1` em São Paulo) e clique em **Avançar**.
4. Inicie em modo de teste ou de produção.

### 4. Configurar as Regras de Segurança no Firestore
1. No Firestore Database, clique na aba **Regras (Rules)**.
2. Cole o conteúdo exato do arquivo [`firestore.rules`](file:///c:/Users/Admin/OneDrive/confirmcaopdudagogh/firestore.rules):

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null;
    }

    match /groups/{groupId} {
      allow create, delete: if isAdmin();
      allow get: if true;
      allow list: if isAdmin();
      allow update: if isAdmin() || (
        request.resource.data.publicToken == resource.data.publicToken &&
        request.resource.data.childrenLimit == resource.data.childrenLimit &&
        request.resource.data.name == resource.data.name
      );
    }

    match /adminEmails/{emailId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```
3. Clique em **Publicar**.

### 5. Cadastrar o Primeiro Administrador Autorizado no Firestore
1. No Firestore Database, vá para a aba **Dados**.
2. Clique em **Iniciar coleção**.
   - ID da coleção: `adminEmails`
   - Document ID: informe o seu e-mail em letras minúsculas (exemplo: `seu-email@exemplo.com`).
   - Campo: `active` | Tipo: `boolean` | Valor: `true`

---

## 🚀 Como Executar Localmente

Dê um duplo clique no arquivo `iniciar.bat` ou execute no terminal:

```bash
npx http-server ./ -p 8080
```

Em seguida, abra o seu navegador em `http://localhost:8080/admin.html`.

---

## 🌐 Publicação / Deploy (GitHub Pages, Netlify ou Vercel)

Para publicar gratuitamente no **GitHub Pages**:
1. Execute o script `enviar_para_github.bat` para atualizar seu repositório.
2. No seu repositório no GitHub, acesse **Settings > Pages**.
3. Selecione a branch `main` (ou `master`) e a pasta `/(root)`.
4. Clique em **Save**. O link público do seu site estará disponível em poucos segundos!
