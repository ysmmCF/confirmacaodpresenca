/* ======================================================
   MÓDULO DE GRUPOS — js/grupos.js
   Modelo de Dados Individualizado por Pessoa
   ====================================================== */

window.AppGrupos = (function () {
  const { db } = window.AppFirebase;

  /* --------------------------------------------------
     Gerador de Token Único de 12 Caracteres
  -------------------------------------------------- */
  function generateToken() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const arr   = new Uint8Array(12);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, b => chars[b % chars.length]).join('');
  }

  /* --------------------------------------------------
     Gerador de ID Único para Pessoa
  -------------------------------------------------- */
  function generatePersonId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const arr   = new Uint8Array(10);
    window.crypto.getRandomValues(arr);
    return 'p_' + Array.from(arr, b => chars[b % chars.length]).join('');
  }

  /* --------------------------------------------------
     Criar Novo Grupo no Firestore

     Estrutura do documento:
     {
       name: string,
       publicToken: string,
       people: [
         {
           id: string,
           name: string,
           gender: 'homem' | 'mulher',
           type: 'adulto' | 'crianca',
           status: 'pendente' | 'confirmada' | 'nao_vai',
           hasChildren: boolean,         // apenas adultos
           parentId: string | null,      // para crianças vinculadas
           nameKnown: boolean            // false se nome não informado
         }
       ],
       createdAt: Timestamp,
       updatedAt: Timestamp
     }
  -------------------------------------------------- */
  async function createGroup(name, people) {
    if (!db) throw new Error('Firestore não inicializado.');
    const token = generateToken();
    const ref = await db.collection('groups').add({
      name: name.trim(),
      publicToken: token,
      people: people,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: ref.id, name: name.trim(), publicToken: token, people };
  }

  /* --------------------------------------------------
     Atualizar Grupo Existente
  -------------------------------------------------- */
  async function updateGroup(groupId, name, people) {
    if (!db) throw new Error('Firestore não inicializado.');
    await db.collection('groups').doc(groupId).update({
      name: name.trim(),
      people: people,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  /* --------------------------------------------------
     Atualizar apenas os status (confirmação pública)
  -------------------------------------------------- */
  async function updateGroupPeople(groupId, people) {
    if (!db) throw new Error('Firestore não inicializado.');
    await db.collection('groups').doc(groupId).update({
      people: people,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  /* --------------------------------------------------
     Excluir Grupo
  -------------------------------------------------- */
  async function deleteGroup(groupId) {
    if (!db) throw new Error('Firestore não inicializado.');
    await db.collection('groups').doc(groupId).delete();
  }

  /* --------------------------------------------------
     Buscar Grupo pelo Token Público
  -------------------------------------------------- */
  async function getGroupByToken(token) {
    if (!db || !token) return null;
    const snap = await db.collection('groups')
      .where('publicToken', '==', token)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /* --------------------------------------------------
     Obter Link Público do Convite
  -------------------------------------------------- */
  function getInviteLink(token) {
    const base = window.location.origin +
      window.location.pathname.replace(/admin\.html.*|index\.html.*/, '');
    return (base.endsWith('/') ? base : base + '/') +
      'confirmar.html?grupo=' + encodeURIComponent(token);
  }

  /* --------------------------------------------------
     Estatísticas Calculadas a partir da Lista de Grupos
  -------------------------------------------------- */
  function calcStats(groups) {
    let totalGroups   = groups.length;
    let totalPeople   = 0;
    let confirmadas   = 0;
    let pendentes     = 0;
    let naoVao        = 0;
    let adultos       = 0;
    let criancas      = 0;
    let homens        = 0;
    let mulheres      = 0;

    groups.forEach(g => {
      (g.people || []).forEach(p => {
        totalPeople++;
        if (p.status === 'confirmada') confirmadas++;
        else if (p.status === 'nao_vai') naoVao++;
        else pendentes++;

        if (p.type === 'adulto') adultos++;
        else criancas++;

        if (p.gender === 'homem') homens++;
        else mulheres++;
      });
    });

    return { totalGroups, totalPeople, confirmadas, pendentes, naoVao, adultos, criancas, homens, mulheres };
  }

  return {
    generatePersonId,
    createGroup,
    updateGroup,
    updateGroupPeople,
    deleteGroup,
    getGroupByToken,
    getInviteLink,
    calcStats
  };
})();
