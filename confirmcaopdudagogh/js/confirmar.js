/* ======================================================
   CONFIRMAÇÃO DE PRESENÇA PÚBLICA — js/confirmar.js
   Cada convidado confirma o status de cada pessoa do grupo
   ====================================================== */

(function () {
  const { db } = window.AppFirebase;

  const loadingState  = document.getElementById('loadingState');
  const errorState    = document.getElementById('errorState');
  const errorMessage  = document.getElementById('errorMessage');
  const rsvpContainer = document.getElementById('rsvpContainer');
  const successState  = document.getElementById('successState');
  const rsvpGroupTitle = document.getElementById('rsvpGroupTitle');
  const adultsSection  = document.getElementById('adultsSection');
  const kidsSection    = document.getElementById('kidsSection');
  const adultsBody     = document.getElementById('adultsBody');
  const kidsBody       = document.getElementById('kidsBody');
  const submitBtn      = document.getElementById('submitRsvpBtn');
  const rsvpForm       = document.getElementById('rsvpForm');

  let currentGroup = null;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    const token = new URLSearchParams(window.location.search).get('grupo');
    if (!token) {
      showError('Nenhum código de convite encontrado no link. Verifique o link recebido.');
      return;
    }

    try {
      const group = await window.AppGrupos.getGroupByToken(token);
      if (!group) {
        showError('Convite não encontrado. Verifique o link ou entre em contato com os organizadores.');
        return;
      }
      currentGroup = group;
      renderForm(group);
    } catch (err) {
      showError('Erro ao carregar o convite. Tente novamente em alguns instantes.');
      console.error(err);
    }
  }

  function showError(msg) {
    if (loadingState)  loadingState.style.display  = 'none';
    if (rsvpContainer) rsvpContainer.style.display = 'none';
    if (successState)  successState.style.display  = 'none';
    if (errorMessage)  errorMessage.textContent    = msg;
    if (errorState)    errorState.style.display    = 'block';
  }

  function renderForm(group) {
    if (loadingState)  loadingState.style.display  = 'none';
    if (errorState)    errorState.style.display    = 'none';
    if (successState)  successState.style.display  = 'none';
    if (rsvpContainer) rsvpContainer.style.display = 'block';

    if (rsvpGroupTitle) rsvpGroupTitle.textContent = group.name;

    const people = group.people || [];
    const adults = people.filter(p => p.type === 'adulto');
    const kids   = people.filter(p => p.type === 'crianca');

    // Adultos
    if (adults.length > 0 && adultsSection && adultsBody) {
      adultsBody.innerHTML = '';
      adultsSection.style.display = 'block';
      adults.forEach(person => adultsBody.appendChild(buildPersonCard(person)));
    }

    // Crianças
    if (kids.length > 0 && kidsSection && kidsBody) {
      kidsBody.innerHTML = '';
      kidsSection.style.display = 'block';
      kids.forEach(person => kidsBody.appendChild(buildPersonCard(person, true)));
    }
  }

  function buildPersonCard(person, isChild = false) {
    const wrap = document.createElement('div');
    wrap.className = 'rsvp-person-card';
    wrap.dataset.id = person.id;

    const displayName = person.name && person.name.trim()
      ? person.name
      : (isChild ? 'Criança (nome não informado)' : 'Convidado');

    const nameHtml = isChild && (!person.name || !person.name.trim())
      ? `<div class="rsvp-person-name" style="color:var(--text-secondary);font-style:italic;">${displayName}</div>
         <div class="form-group" style="margin-bottom:12px;">
           <label class="form-label">Nome da criança <span style="color:var(--text-hint);font-weight:400;">(opcional)</span></label>
           <input type="text" class="input child-name-input" placeholder="Informe o nome se souber">
         </div>`
      : `<div class="rsvp-person-name">${esc(displayName)}</div>`;

    wrap.innerHTML = `
      ${nameHtml}
      <div class="rsvp-status-group">
        <label class="rsvp-status-btn ${person.status === 'confirmada' ? 'selected-confirmada' : ''}">
          <input type="radio" name="status_${person.id}" value="confirmada" ${person.status === 'confirmada' ? 'checked' : ''}>
          Vou comparecer
        </label>
        <label class="rsvp-status-btn ${person.status === 'nao_vai' ? 'selected-nao_vai' : ''}">
          <input type="radio" name="status_${person.id}" value="nao_vai" ${person.status === 'nao_vai' ? 'checked' : ''}>
          Não poderei ir
        </label>
      </div>
    `;

    // Destaque visual nos botões de status
    const labels = wrap.querySelectorAll('.rsvp-status-btn');
    const inputs = wrap.querySelectorAll(`input[name="status_${person.id}"]`);
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        labels.forEach(l => l.classList.remove('selected-confirmada', 'selected-nao_vai'));
        if (input.checked) {
          input.closest('.rsvp-status-btn').classList.add(`selected-${input.value}`);
        }
      });
    });

    return wrap;
  }

  // Submit
  if (rsvpForm) {
    rsvpForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (!currentGroup || !db) return;

      setSubmitting(true);

      try {
        const updatedPeople = (currentGroup.people || []).map(person => {
          const selected = document.querySelector(`input[name="status_${person.id}"]:checked`);
          const status   = selected ? selected.value : person.status;

          // Para crianças sem nome, verificar se o usuário preencheu agora
          let name = person.name;
          if (person.type === 'crianca' && (!person.name || !person.name.trim())) {
            const wrap      = document.querySelector(`.rsvp-person-card[data-id="${person.id}"]`);
            const nameInput = wrap ? wrap.querySelector('.child-name-input') : null;
            if (nameInput && nameInput.value.trim()) {
              name = nameInput.value.trim();
            }
          }

          return { ...person, name, status };
        });

        await window.AppGrupos.updateGroupPeople(currentGroup.id, updatedPeople);

        if (rsvpContainer) rsvpContainer.style.display = 'none';
        if (successState)  successState.style.display  = 'block';
      } catch (err) {
        alert('Ocorreu um erro ao salvar: ' + err.message);
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    });
  }

  function setSubmitting(on) {
    if (!submitBtn) return;
    submitBtn.disabled = on;
    submitBtn.innerHTML = on
      ? '<span class="spinner" style="width:18px;height:18px;border-width:2px;margin-right:8px;vertical-align:middle;display:inline-block;"></span>Enviando...'
      : 'Confirmar presença';
  }

  function esc(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
})();
