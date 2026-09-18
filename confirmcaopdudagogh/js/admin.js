/* ======================================================
   PAINEL ADMINISTRATIVO — js/admin.js
   Abas: Visão Geral | Criar Grupo | Grupos | Administradores
   ====================================================== */

(function () {
  const { db, auth } = window.AppFirebase;

  let allGroups   = [];
  let unsubscribe = null;

  // ===================== ATIVAÇÃO =====================
  window.addEventListener('adminReady', () => {
    initTabs();
    initRealtimeGroups();
    initAdminTab();
  });

  // ===================== ABAS =====================
  function initTabs() {
    const tabs   = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.tab);
        if (target) target.classList.add('active');
      });
    });
  }

  // ===================== DADOS EM TEMPO REAL =====================
  function initRealtimeGroups() {
    if (!db) return;
    if (unsubscribe) unsubscribe();

    unsubscribe = db.collection('groups')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => {
        allGroups = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderStats(allGroups);
        renderGroupList(allGroups);
      }, err => {
        console.error('[Admin] Snapshot error:', err);
      });
  }

  // ===================== VISÃO GERAL — ESTATÍSTICAS =====================
  function renderStats(groups) {
    const s = window.AppGrupos.calcStats(groups);
    setEl('statGroups',     s.totalGroups);
    setEl('statPeople',     s.totalPeople);
    setEl('statConfirmadas', s.confirmadas);
    setEl('statPendentes',  s.pendentes);
    setEl('statNaoVao',     s.naoVao);
    setEl('statAdultos',    s.adultos);
    setEl('statCriancas',   s.criancas);
    setEl('statHomens',     s.homens);
    setEl('statMulheres',   s.mulheres);
  }

  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ===================== CRIAR GRUPO =====================
  const newGroupForm = document.getElementById('newGroupForm');
  const groupNameInput = document.getElementById('groupNameInput');
  const peopleContainer = document.getElementById('peopleContainer');
  const addPersonBtn = document.getElementById('addPersonBtn');
  const saveGroupBtn = document.getElementById('saveGroupBtn');
  const createGroupError = document.getElementById('createGroupError');
  let personCounter = 0;

  if (addPersonBtn) addPersonBtn.addEventListener('click', () => addPersonCard());

  function addPersonCard(data = null) {
    personCounter++;
    const idx = personCounter;
    const card = document.createElement('div');
    card.className = 'person-card';
    card.dataset.idx = idx;

    const isChild  = data && data.type === 'crianca';
    const gender   = data ? data.gender   : 'homem';
    const type     = data ? data.type     : 'adulto';
    const status   = data ? data.status   : 'pendente';
    const hasKids  = data ? (data.hasChildren || false) : false;
    const name     = data ? data.name     : '';
    const personId = data ? data.id       : window.AppGrupos.generatePersonId();

    card.innerHTML = `
      <input type="hidden" class="field-id" value="${personId}">
      <div class="person-card-header">
        <span class="person-card-number">Pessoa ${idx}</span>
        <button type="button" class="btn btn-ghost btn-sm btn-icon remove-person-btn" title="Remover pessoa" aria-label="Remover pessoa">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="form-stack">
        <div class="form-group">
          <label class="form-label">Nome</label>
          <input type="text" class="input field-name" placeholder="Nome completo" value="${esc(name)}">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Sexo</label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" name="gender_${idx}" class="field-gender" value="homem" ${gender === 'homem' ? 'checked' : ''}> Homem
              </label>
              <label class="radio-option">
                <input type="radio" name="gender_${idx}" class="field-gender" value="mulher" ${gender === 'mulher' ? 'checked' : ''}> Mulher
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Tipo</label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" name="type_${idx}" class="field-type" value="adulto" ${type === 'adulto' ? 'checked' : ''}> Adulto
              </label>
              <label class="radio-option">
                <input type="radio" name="type_${idx}" class="field-type" value="crianca" ${type === 'crianca' ? 'checked' : ''}> Criança
              </label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Status Inicial</label>
          <select class="input field-status">
            <option value="pendente"   ${status === 'pendente'   ? 'selected' : ''}>Pendente</option>
            <option value="confirmada" ${status === 'confirmada' ? 'selected' : ''}>Confirmada</option>
            <option value="nao_vai"    ${status === 'nao_vai'    ? 'selected' : ''}>Não vai</option>
          </select>
        </div>

        <div class="children-section" style="${isChild ? 'display:none;' : ''}">
          <div class="form-group">
            <label class="form-label">Essa pessoa tem filhos?</label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" name="hasChildren_${idx}" class="field-has-children" value="nao" ${!hasKids ? 'checked' : ''}> Não
              </label>
              <label class="radio-option">
                <input type="radio" name="hasChildren_${idx}" class="field-has-children" value="sim" ${hasKids ? 'checked' : ''}> Sim
              </label>
            </div>
          </div>
          <div class="children-add-area" style="${hasKids ? '' : 'display:none;'}">
            <div class="children-add-title">Filhos</div>
            <div class="children-list"></div>
            <button type="button" class="btn btn-ghost btn-sm add-child-btn" style="margin-top:12px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Adicionar criança
            </button>
          </div>
        </div>
      </div>
    `;

    // Eventos — Tipo muda -> oculta seção de filhos se for criança
    card.querySelectorAll('.field-type').forEach(radio => {
      radio.addEventListener('change', () => {
        const childrenSection = card.querySelector('.children-section');
        if (radio.value === 'crianca' && radio.checked) {
          childrenSection.style.display = 'none';
        } else {
          childrenSection.style.display = '';
        }
      });
    });

    // Eventos — Toggle seção de filhos
    card.querySelectorAll('.field-has-children').forEach(radio => {
      radio.addEventListener('change', () => {
        const area = card.querySelector('.children-add-area');
        area.style.display = radio.value === 'sim' ? '' : 'none';
      });
    });

    // Botão Remover Pessoa
    card.querySelector('.remove-person-btn').addEventListener('click', () => {
      card.remove();
      renumberPersonCards();
    });

    // Botão Adicionar Criança
    const addChildBtn = card.querySelector('.add-child-btn');
    if (addChildBtn) {
      addChildBtn.addEventListener('click', () => {
        const list = card.querySelector('.children-list');
        addChildCard(list);
      });
    }

    // Preencher filhos existentes se editando
    if (data && data.hasChildren && data.children && data.children.length > 0) {
      const list = card.querySelector('.children-list');
      data.children.forEach(c => addChildCard(list, c));
    }

    peopleContainer.appendChild(card);
  }

  function addChildCard(container, data = null) {
    const childId = data ? data.id : window.AppGrupos.generatePersonId();
    const name    = data ? (data.name || '') : '';
    const gender  = data ? data.gender : 'homem';
    const status  = data ? data.status : 'pendente';

    const wrap = document.createElement('div');
    wrap.className = 'child-card';
    wrap.innerHTML = `
      <input type="hidden" class="child-id" value="${childId}">
      <div class="child-card-header">
        <span class="person-card-number" style="color:var(--text-hint);">Criança</span>
        <button type="button" class="btn btn-ghost btn-sm btn-icon remove-child-btn" title="Remover criança" aria-label="Remover criança">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="form-stack">
        <div class="form-group">
          <label class="form-label">Nome da criança <span style="color:var(--text-hint);font-weight:400;">(opcional)</span></label>
          <input type="text" class="input child-name" placeholder="Deixe em branco se não souber" value="${esc(name)}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Sexo</label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" name="child_gender_${childId}" class="child-gender" value="homem" ${gender === 'homem' ? 'checked' : ''}> Homem
              </label>
              <label class="radio-option">
                <input type="radio" name="child_gender_${childId}" class="child-gender" value="mulher" ${gender === 'mulher' ? 'checked' : ''}> Mulher
              </label>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="input child-status">
              <option value="pendente"   ${status === 'pendente'   ? 'selected' : ''}>Pendente</option>
              <option value="confirmada" ${status === 'confirmada' ? 'selected' : ''}>Confirmada</option>
              <option value="nao_vai"    ${status === 'nao_vai'    ? 'selected' : ''}>Não vai</option>
            </select>
          </div>
        </div>
      </div>
    `;

    wrap.querySelector('.remove-child-btn').addEventListener('click', () => wrap.remove());
    container.appendChild(wrap);
  }

  function renumberPersonCards() {
    const cards = peopleContainer.querySelectorAll('.person-card');
    cards.forEach((c, i) => {
      const label = c.querySelector('.person-card-number');
      if (label) label.textContent = `Pessoa ${i + 1}`;
    });
  }

  // Coletar dados do formulário de criação
  function collectPeople() {
    const cards  = peopleContainer.querySelectorAll('.person-card');
    const people = [];

    cards.forEach(card => {
      const id       = card.querySelector('.field-id').value;
      const name     = card.querySelector('.field-name').value.trim();
      const gender   = card.querySelector('.field-gender:checked')?.value || 'homem';
      const type     = card.querySelector('.field-type:checked')?.value   || 'adulto';
      const status   = card.querySelector('.field-status').value;
      const hasChildrenRadio = card.querySelector('.field-has-children:checked');
      const hasChildren = hasChildrenRadio ? hasChildrenRadio.value === 'sim' : false;

      const personEntry = { id, name: name || '', gender, type, status, hasChildren, nameKnown: name !== '' };

      // Coletar filhos se adulto e tem filhos
      if (type === 'adulto' && hasChildren) {
        const childCards = card.querySelectorAll('.child-card');
        const children = [];
        childCards.forEach(cc => {
          const childId     = cc.querySelector('.child-id').value;
          const childName   = cc.querySelector('.child-name').value.trim();
          const childGender = cc.querySelector('.child-gender:checked')?.value || 'homem';
          const childStatus = cc.querySelector('.child-status').value;
          children.push({
            id:        childId,
            name:      childName || '',
            nameKnown: childName !== '',
            gender:    childGender,
            type:      'crianca',
            status:    childStatus,
            hasChildren: false,
            parentId:  id
          });
        });
        personEntry.children = children;

        // Expandir crianças como pessoas individuais no array people
        children.forEach(c => people.push(c));
      }

      people.push(personEntry);
    });

    return people;
  }

  if (saveGroupBtn) {
    saveGroupBtn.addEventListener('click', async () => {
      const name = groupNameInput ? groupNameInput.value.trim() : '';
      if (!name) {
        showCreateError('Informe o nome do grupo.');
        return;
      }

      const people = collectPeople();

      // Filtra apenas adultos com ao menos um dado (aceita adulto sem nome)
      const adultsInCards = peopleContainer.querySelectorAll('.person-card');
      if (adultsInCards.length === 0) {
        showCreateError('Adicione ao menos uma pessoa ao grupo.');
        return;
      }

      hideCreateError();
      setSavingLoading(true);

      try {
        await window.AppGrupos.createGroup(name, people);
        // Resetar formulário
        groupNameInput.value = '';
        peopleContainer.innerHTML = '';
        personCounter = 0;
        showToast('Grupo criado com sucesso!', 'success');
        // Ir para aba Grupos
        document.querySelector('.tab-btn[data-tab="tabGroups"]')?.click();
      } catch (err) {
        showCreateError('Erro ao salvar no Firestore: ' + err.message);
      } finally {
        setSavingLoading(false);
      }
    });
  }

  function showCreateError(msg) {
    if (createGroupError) {
      createGroupError.textContent = msg;
      createGroupError.style.display = 'block';
    }
  }

  function hideCreateError() {
    if (createGroupError) createGroupError.style.display = 'none';
  }

  function setSavingLoading(on) {
    if (!saveGroupBtn) return;
    saveGroupBtn.disabled = on;
    saveGroupBtn.innerHTML = on
      ? '<span class="spinner" style="width:18px;height:18px;border-width:2px;margin-right:8px;vertical-align:middle;display:inline-block;"></span>Salvando...'
      : 'Salvar grupo';
  }

  // ===================== LISTA DE GRUPOS =====================
  const groupListContainer = document.getElementById('groupListContainer');
  const groupsEmptyState   = document.getElementById('groupsEmptyState');
  const groupSearchInput   = document.getElementById('groupSearchInput');

  if (groupSearchInput) {
    groupSearchInput.addEventListener('input', e => {
      renderGroupList(allGroups, e.target.value);
    });
  }

  function renderGroupList(groups, query = '') {
    if (!groupListContainer) return;
    groupListContainer.innerHTML = '';

    let filtered = groups;
    if (query && query.trim()) {
      const q = query.toLowerCase();
      filtered = groups.filter(g =>
        g.name.toLowerCase().includes(q) ||
        (g.people || []).some(p => p.name && p.name.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      if (groupsEmptyState) groupsEmptyState.style.display = 'block';
      return;
    }
    if (groupsEmptyState) groupsEmptyState.style.display = 'none';

    filtered.forEach(g => {
      const people    = g.people || [];
      const adults    = people.filter(p => p.type === 'adulto');
      const kids      = people.filter(p => p.type === 'crianca');
      const confirmed = people.filter(p => p.status === 'confirmada').length;
      const pending   = people.filter(p => p.status === 'pendente').length;
      const notGoing  = people.filter(p => p.status === 'nao_vai').length;
      const link      = window.AppGrupos.getInviteLink(g.publicToken);

      const card = document.createElement('div');
      card.className = 'group-card';
      card.innerHTML = `
        <div class="group-card-header">
          <div>
            <div class="group-card-name">${esc(g.name)}</div>
            <div class="group-card-meta">
              <span>${people.length} pessoa${people.length !== 1 ? 's' : ''}</span>
              <span>${adults.length} adulto${adults.length !== 1 ? 's' : ''}</span>
              ${kids.length > 0 ? `<span>${kids.length} criança${kids.length !== 1 ? 's' : ''}</span>` : ''}
            </div>
          </div>
          <div class="group-card-actions">
            <button class="btn btn-ghost btn-sm btn-icon copy-link-btn" title="Copiar link do convite" data-url="${link}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm btn-icon view-group-btn" title="Ver grupo" data-id="${g.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn btn-danger btn-sm btn-icon delete-group-btn" title="Excluir grupo" data-id="${g.id}" data-name="${esc(g.name)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>
        <div class="group-card-stats">
          ${confirmed > 0 ? `<span class="badge badge-confirmada">${confirmed} confirmada${confirmed !== 1 ? 's' : ''}</span>` : ''}
          ${pending   > 0 ? `<span class="badge badge-pendente">${pending} pendente${pending !== 1 ? 's' : ''}</span>` : ''}
          ${notGoing  > 0 ? `<span class="badge badge-nao_vai">${notGoing} não vai${notGoing !== 1 ? 'o' : ''}</span>` : ''}
        </div>
      `;

      // Copiar Link
      card.querySelector('.copy-link-btn').addEventListener('click', function () {
        navigator.clipboard.writeText(this.dataset.url)
          .then(() => showToast('Link copiado para a área de transferência.', 'success'))
          .catch(() => prompt('Link do convite:', this.dataset.url));
      });

      // Ver Grupo (Modal Detalhe)
      card.querySelector('.view-group-btn').addEventListener('click', function () {
        openGroupDetail(this.dataset.id);
      });

      // Excluir Grupo
      card.querySelector('.delete-group-btn').addEventListener('click', function () {
        if (confirm(`Excluir o grupo "${this.dataset.name}" permanentemente?`)) {
          window.AppGrupos.deleteGroup(this.dataset.id)
            .then(() => showToast('Grupo excluído.', 'success'))
            .catch(err => showToast('Erro: ' + err.message, 'error'));
        }
      });

      groupListContainer.appendChild(card);
    });
  }

  // ===================== DETALHE DO GRUPO (MODAL) =====================
  const groupDetailModal = document.getElementById('groupDetailModal');
  const groupDetailClose = document.getElementById('groupDetailClose');
  const groupDetailTitle = document.getElementById('groupDetailTitle');
  const groupDetailBody  = document.getElementById('groupDetailBody');
  const groupDetailLink  = document.getElementById('groupDetailLink');

  if (groupDetailClose) groupDetailClose.addEventListener('click', closeGroupDetail);
  if (groupDetailModal) groupDetailModal.addEventListener('click', e => {
    if (e.target === groupDetailModal) closeGroupDetail();
  });

  function openGroupDetail(groupId) {
    const g = allGroups.find(x => x.id === groupId);
    if (!g || !groupDetailModal) return;

    if (groupDetailTitle) groupDetailTitle.textContent = g.name;
    if (groupDetailLink) groupDetailLink.value = window.AppGrupos.getInviteLink(g.publicToken);

    const people  = g.people || [];
    const adults  = people.filter(p => p.type === 'adulto');
    const kids    = people.filter(p => p.type === 'crianca');

    let html = '';

    if (adults.length > 0) {
      html += `<div class="detail-section">
        <div class="detail-section-label">Adultos</div>
        <table class="guest-table">
          <thead><tr>
            <th>Nome</th><th>Sexo</th><th>Status</th>
          </tr></thead>
          <tbody>`;
      adults.forEach(p => {
        html += `<tr>
          <td class="col-name">${p.name ? esc(p.name) : '<span style="color:var(--text-hint);font-style:italic;">Sem nome informado</span>'}</td>
          <td>${capitalize(p.gender)}</td>
          <td><span class="badge badge-${p.status}">${statusLabel(p.status)}</span></td>
        </tr>`;
      });
      html += `</tbody></table></div>`;
    }

    if (kids.length > 0) {
      html += `<div class="detail-section">
        <div class="detail-section-label">Crianças</div>
        <table class="guest-table">
          <thead><tr>
            <th>Nome</th><th>Sexo</th><th>Status</th>
          </tr></thead>
          <tbody>`;
      kids.forEach(p => {
        const displayName = p.name
          ? esc(p.name)
          : '<span style="color:var(--text-hint);font-style:italic;">Criança sem nome informado</span>';
        html += `<tr>
          <td class="col-name">${displayName}</td>
          <td>${capitalize(p.gender)}</td>
          <td><span class="badge badge-${p.status}">${statusLabel(p.status)}</span></td>
        </tr>`;
      });
      html += `</tbody></table></div>`;
    }

    if (adults.length === 0 && kids.length === 0) {
      html = `<p style="color:var(--text-secondary);font-size:0.9rem;">Nenhuma pessoa cadastrada neste grupo.</p>`;
    }

    if (groupDetailBody) groupDetailBody.innerHTML = html;
    groupDetailModal.style.display = 'flex';
  }

  function closeGroupDetail() {
    if (groupDetailModal) groupDetailModal.style.display = 'none';
  }

  // Copiar link dentro do modal
  const copyDetailLink = document.getElementById('copyDetailLink');
  if (copyDetailLink) {
    copyDetailLink.addEventListener('click', () => {
      const val = document.getElementById('groupDetailLink')?.value;
      if (val) {
        navigator.clipboard.writeText(val)
          .then(() => showToast('Link copiado.', 'success'))
          .catch(() => prompt('Link:', val));
      }
    });
  }

  // ===================== ABA ADMINISTRADORES =====================
  function initAdminTab() {
    loadAdmins();
    const addAdminForm = document.getElementById('addAdminForm');
    if (addAdminForm) {
      addAdminForm.addEventListener('submit', async e => {
        e.preventDefault();
        const emailInput = document.getElementById('newAdminEmail');
        const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        if (!email) return;

        try {
          await db.collection('adminEmails').doc(email).set({
            email: email,
            role: 'admin',
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          emailInput.value = '';
          showToast('Administrador adicionado.', 'success');
          loadAdmins();
        } catch (err) {
          showToast('Erro: ' + err.message, 'error');
        }
      });
    }
  }

  async function loadAdmins() {
    const list = document.getElementById('adminList');
    if (!list || !db) return;
    list.innerHTML = '<p style="color:var(--text-hint);font-size:.875rem;">Carregando...</p>';

    try {
      const snap = await db.collection('adminEmails').get();
      if (snap.empty) {
        list.innerHTML = '<p style="color:var(--text-hint);font-size:.875rem;">Nenhum administrador cadastrado.</p>';
        return;
      }

      list.innerHTML = '';
      snap.forEach(doc => {
        const d = doc.data();
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
          <div class="admin-item-info">
            <div class="admin-item-email">${esc(d.email || doc.id)}</div>
            <div class="admin-item-role">${d.active !== false ? 'Ativo' : 'Desativado'}</div>
          </div>
          <div class="admin-item-actions">
            <button class="btn btn-ghost btn-sm toggle-admin-btn" data-id="${doc.id}" data-active="${d.active !== false}">
              ${d.active !== false ? 'Desativar' : 'Ativar'}
            </button>
            <button class="btn btn-danger btn-sm remove-admin-btn" data-id="${doc.id}">Remover</button>
          </div>
        `;

        item.querySelector('.toggle-admin-btn').addEventListener('click', async function () {
          const newActive = this.dataset.active === 'true' ? false : true;
          await db.collection('adminEmails').doc(this.dataset.id).update({ active: newActive });
          showToast(newActive ? 'Administrador ativado.' : 'Administrador desativado.', 'success');
          loadAdmins();
        });

        item.querySelector('.remove-admin-btn').addEventListener('click', async function () {
          if (confirm('Remover este administrador?')) {
            await db.collection('adminEmails').doc(this.dataset.id).delete();
            showToast('Administrador removido.', 'success');
            loadAdmins();
          }
        });

        list.appendChild(item);
      });
    } catch (err) {
      list.innerHTML = `<p style="color:var(--text-hint);font-size:.875rem;">Erro ao carregar: ${err.message}</p>`;
    }
  }

  // ===================== TOAST =====================
  let toastTimer;
  function showToast(msg, type = 'success') {
    const el = document.getElementById('appToast');
    if (!el) return;
    clearTimeout(toastTimer);
    el.textContent = msg;
    el.className = `toast toast-${type}`;
    el.style.display = 'block';
    toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3500);
  }

  // ===================== UTILITÁRIOS =====================
  function esc(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function statusLabel(s) {
    return s === 'confirmada' ? 'Confirmada' : s === 'nao_vai' ? 'Não vai' : 'Pendente';
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }
})();
