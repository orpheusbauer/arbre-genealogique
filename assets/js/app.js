(function () {
  "use strict";

  const state = {
    tree: null,
    selectedId: "",
    photoDraft: "",
    renderedFormId: null,
    dirty: false,
    saveTimer: null,
    treeBounds: { width: 600, height: 420 },
    editorTab: "person",
    manualLayout: false,
    manualSelectionIds: [],
    hiddenPersonIds: new Set(),
    maskedBranchRootIds: new Set(),
    panels: {
      membersCollapsed: false,
      editorCollapsed: false
    },
    relationDraft: {
      aId: "",
      bId: ""
    },
    diagramLink: {
      sourceId: ""
    },
    suppressNodeClick: false,
    view: {
      x: 24,
      y: 24,
      scale: 1
    },
    drag: {
      active: false,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0
    },
    nodeDrag: {
      active: false,
      id: "",
      pointerId: 0,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
      items: [],
      moved: false,
      raf: 0
    }
  };

  const el = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    state.tree = TreeStorage.load();
    state.selectedId = state.tree.people[0] ? state.tree.people[0].id : "";
    state.manualSelectionIds = state.selectedId ? [state.selectedId] : [];

    cacheElements();
    bindEvents();
    renderAll();

    window.requestAnimationFrame(fitTree);
    updateStatus("Arbre chargé");
  }

  function cacheElements() {
    el.addAdoptiveParentLinkBtn = document.getElementById("addAdoptiveParentLinkBtn");
    el.addCustomLinkBtn = document.getElementById("addCustomLinkBtn");
    el.addFormerPartnerLinkBtn = document.getElementById("addFormerPartnerLinkBtn");
    el.addHalfSiblingLinkBtn = document.getElementById("addHalfSiblingLinkBtn");
    el.addMemberBtn = document.getElementById("addMemberBtn");
    el.addParentLinkBtn = document.getElementById("addParentLinkBtn");
    el.addPartnerLinkBtn = document.getElementById("addPartnerLinkBtn");
    el.addSiblingLinkBtn = document.getElementById("addSiblingLinkBtn");
    el.appShell = document.getElementById("appShell");
    el.birthDate = document.getElementById("birthDate");
    el.birthPlace = document.getElementById("birthPlace");
    el.clearSelectionBtn = document.getElementById("clearSelectionBtn");
    el.customRelationDirection = document.getElementById("customRelationDirection");
    el.customRelationLabel = document.getElementById("customRelationLabel");
    el.currentPlace = document.getElementById("currentPlace");
    el.deathDate = document.getElementById("deathDate");
    el.deleteMemberBtn = document.getElementById("deleteMemberBtn");
    el.diagramLinkHint = document.getElementById("diagramLinkHint");
    el.diagramRelationType = document.getElementById("diagramRelationType");
    el.editorMode = document.getElementById("editorMode");
    el.editorPanel = document.getElementById("editorPanel");
    el.editorPanelTitle = document.getElementById("editorPanelTitle");
    el.editorPanelToggle = document.getElementById("editorPanelToggle");
    el.exportTreeBtn = document.getElementById("exportTreeBtn");
    el.firstName = document.getElementById("firstName");
    el.fitTreeBtn = document.getElementById("fitTreeBtn");
    el.gender = document.getElementById("gender");
    el.importFile = document.getElementById("importFile");
    el.importTreeBtn = document.getElementById("importTreeBtn");
    el.lastName = document.getElementById("lastName");
    el.memberCount = document.getElementById("memberCount");
    el.memberList = document.getElementById("memberList");
    el.memberSearch = document.getElementById("memberSearch");
    el.membersPanel = document.getElementById("membersPanel");
    el.membersPanelToggle = document.getElementById("membersPanelToggle");
    el.manualLayoutToggle = document.getElementById("manualLayoutToggle");
    el.newTreeBtn = document.getElementById("newTreeBtn");
    el.notes = document.getElementById("notes");
    el.occupation = document.getElementById("occupation");
    el.personTabBtn = document.getElementById("personTabBtn");
    el.personForm = document.getElementById("personForm");
    el.personId = document.getElementById("personId");
    el.photoInput = document.getElementById("photoInput");
    el.photoPreview = document.getElementById("photoPreview");
    el.relationPersonA = document.getElementById("relationPersonA");
    el.relationPersonAResults = document.getElementById("relationPersonAResults");
    el.relationPersonB = document.getElementById("relationPersonB");
    el.relationPersonBResults = document.getElementById("relationPersonBResults");
    el.relationsPanel = document.getElementById("relationsPanel");
    el.relationsTabBtn = document.getElementById("relationsTabBtn");
    el.relationSummary = document.getElementById("relationSummary");
    el.removeLinkBtn = document.getElementById("removeLinkBtn");
    el.removePhotoBtn = document.getElementById("removePhotoBtn");
    el.resetLayoutBtn = document.getElementById("resetLayoutBtn");
    el.saveStatus = document.getElementById("saveStatus");
    el.saveTreeBtn = document.getElementById("saveTreeBtn");
    el.showAllTreeBtn = document.getElementById("showAllTreeBtn");
    el.statLinks = document.getElementById("statLinks");
    el.statPeople = document.getElementById("statPeople");
    el.treeConnectors = document.getElementById("treeConnectors");
    el.treeNodes = document.getElementById("treeNodes");
    el.treeSurface = document.getElementById("treeSurface");
    el.treeTitle = document.getElementById("treeTitle");
    el.treeViewport = document.getElementById("treeViewport");
    el.zoomInBtn = document.getElementById("zoomInBtn");
    el.zoomOutBtn = document.getElementById("zoomOutBtn");
  }

  function bindEvents() {
    el.addMemberBtn.addEventListener("click", startNewPerson);
    el.clearSelectionBtn.addEventListener("click", startNewPerson);
    el.deleteMemberBtn.addEventListener("click", deleteSelectedPerson);
    el.editorPanelToggle.addEventListener("click", () => toggleSidePanel("editor"));
    el.exportTreeBtn.addEventListener("click", exportTreeSvg);
    el.importFile.addEventListener("change", importTree);
    el.importTreeBtn.addEventListener("click", () => el.importFile.click());
    el.memberSearch.addEventListener("input", renderMemberList);
    el.membersPanelToggle.addEventListener("click", () => toggleSidePanel("members"));
    el.newTreeBtn.addEventListener("click", createNewTree);
    el.personTabBtn.addEventListener("click", () => setEditorTab("person"));
    el.personForm.addEventListener("submit", savePersonFromForm);
    el.removePhotoBtn.addEventListener("click", removePhotoDraft);
    el.saveTreeBtn.addEventListener("click", exportTreeJson);
    el.showAllTreeBtn.addEventListener("click", showAllPeople);
    el.treeTitle.addEventListener("input", updateTreeTitle);

    el.firstName.addEventListener("input", updatePhotoPreview);
    el.lastName.addEventListener("input", updatePhotoPreview);
    el.photoInput.addEventListener("change", updatePhotoDraft);

    el.addAdoptiveParentLinkBtn.addEventListener("click", addAdoptiveParentLink);
    el.addCustomLinkBtn.addEventListener("click", addCustomLink);
    el.addFormerPartnerLinkBtn.addEventListener("click", addFormerPartnerLink);
    el.addHalfSiblingLinkBtn.addEventListener("click", addHalfSiblingLink);
    el.addParentLinkBtn.addEventListener("click", addParentLink);
    el.addPartnerLinkBtn.addEventListener("click", addPartnerLink);
    el.addSiblingLinkBtn.addEventListener("click", addSiblingLink);
    bindRelationSearch("a");
    bindRelationSearch("b");
    el.relationsTabBtn.addEventListener("click", () => setEditorTab("relations"));
    el.removeLinkBtn.addEventListener("click", removeRelationship);

    el.zoomInBtn.addEventListener("click", () => zoomAtCenter(1.15));
    el.zoomOutBtn.addEventListener("click", () => zoomAtCenter(0.87));
    el.fitTreeBtn.addEventListener("click", fitTree);
    el.manualLayoutToggle.addEventListener("click", toggleManualLayout);
    el.diagramRelationType.addEventListener("change", clearDiagramLinkSource);
    el.resetLayoutBtn.addEventListener("click", resetManualLayout);

    el.treeViewport.addEventListener("wheel", handleWheel, { passive: false });
    el.treeViewport.addEventListener("pointerdown", startPan);
    el.treeViewport.addEventListener("pointermove", movePan);
    el.treeViewport.addEventListener("pointerup", endPan);
    el.treeViewport.addEventListener("pointercancel", endPan);

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".person-combobox")) {
        closeRelationSuggestions();
      }
    });

    window.addEventListener("resize", debounce(handleViewportResize, 160));
    window.addEventListener("beforeunload", () => {
      if (state.dirty) {
        saveNow();
      }
    });
  }

  function renderAll() {
    ensureSelectionExists();
    state.hiddenPersonIds = new Set(Array.from(state.hiddenPersonIds).filter((id) => getPerson(id)));
    state.maskedBranchRootIds = new Set(Array.from(state.maskedBranchRootIds).filter((id) => {
      return getPerson(id) && !state.hiddenPersonIds.has(id);
    }));

    el.treeTitle.value = state.tree.metadata.title || "Famille";

    renderMemberList();
    renderPersonForm();
    renderRelationSelectors();
    renderRelationSummary();
    renderEditorView();
    renderPanelStates();
    renderStats();
    renderDiagramControls();
    renderTree();
  }

  function renderTree() {
    state.treeBounds = TreeView.render({
      hiddenIds: Array.from(state.hiddenPersonIds),
      nodesEl: el.treeNodes,
      linkSourceId: state.diagramLink.sourceId,
      manualLayout: state.manualLayout,
      maskedBranchRootIds: Array.from(state.maskedBranchRootIds),
      onDragStart: startNodeDrag,
      onHideBranch: hideBranchOf,
      onSelect: handleTreeNodeAction,
      selectedId: state.selectedId,
      selectedIds: state.manualSelectionIds,
      surfaceEl: el.treeSurface,
      svgEl: el.treeConnectors,
      tree: state.tree
    });

    applyViewTransform();
  }

  function renderMemberList() {
    const query = normalizeSearch(el.memberSearch.value);
    const people = state.tree.people
      .filter((person) => {
        if (!query) {
          return true;
        }

        return normalizeSearch([
          getDisplayName(person),
          person.firstName,
          person.lastName,
          genderLabel(person.gender),
          person.birthPlace,
          person.currentPlace,
          person.occupation,
          person.customRelations.map((relation) => relation.label).join(" ")
        ].join(" ")).includes(query);
      })
      .sort(comparePeople);

    el.memberList.innerHTML = "";

    if (!people.length) {
      el.memberList.innerHTML = "<div class=\"empty-state\">Aucun membre à afficher.</div>";
      return;
    }

    const fragment = document.createDocumentFragment();

    people.forEach((person) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `member-item${person.id === state.selectedId ? " active" : ""}`;
      button.dataset.id = person.id;
      button.innerHTML = [
        renderAvatar(person, "avatar"),
        "<span>",
        `<span class="member-name">${escapeHtml(getDisplayName(person))}</span>`,
        `<span class="member-meta">${escapeHtml(memberMeta(person))}</span>`,
        "</span>"
      ].join("");
      button.addEventListener("click", () => selectPerson(person.id));
      fragment.appendChild(button);
    });

    el.memberList.appendChild(fragment);
  }

  function renderPersonForm() {
    const person = getPerson(state.selectedId);
    const nextFormId = person ? person.id : "";

    if (state.renderedFormId !== nextFormId) {
      fillPersonForm(person);
      state.renderedFormId = nextFormId;
    }

    el.editorMode.textContent = person ? "Modifier un membre" : "Nouveau membre";
    el.deleteMemberBtn.disabled = !person;
    updatePhotoPreview();
  }

  function renderRelationSelectors() {
    const people = state.tree.people.slice().sort(comparePeople);
    const ids = new Set(people.map((person) => person.id));

    state.relationDraft.aId = ids.has(state.relationDraft.aId) ? state.relationDraft.aId : state.selectedId || (people[0] && people[0].id) || "";
    state.relationDraft.bId = ids.has(state.relationDraft.bId) ? state.relationDraft.bId : firstDifferentId(people, state.relationDraft.aId);
    keepRelationPairDistinct();
    renderRelationInputs();
    updateRelationControlState();
  }

  function renderStats() {
    const peopleCount = state.tree.people.length;
    const parentLinks = state.tree.people.reduce((total, person) => {
      return total + person.parentIds.length + person.adoptiveParentIds.length;
    }, 0);
    const partnerLinks = new Set();
    const formerPartnerLinks = new Set();
    const siblingLinks = new Set();
    const halfSiblingLinks = new Set();
    const customLinks = new Set();

    state.tree.people.forEach((person) => {
      person.partnerIds.forEach((partnerId) => {
        partnerLinks.add([person.id, partnerId].sort().join(":"));
      });
      person.formerPartnerIds.forEach((partnerId) => {
        formerPartnerLinks.add([person.id, partnerId].sort().join(":"));
      });
      person.siblingIds.forEach((siblingId) => {
        siblingLinks.add([person.id, siblingId].sort().join(":"));
      });
      person.halfSiblingIds.forEach((siblingId) => {
        halfSiblingLinks.add([person.id, siblingId].sort().join(":"));
      });
      person.customRelations.forEach((relation) => {
        customLinks.add(canonicalCustomRelationKey(person.id, relation.personId, relation.label, relation.direction || "same"));
      });
    });

    const totalLinks = parentLinks + partnerLinks.size + formerPartnerLinks.size + siblingLinks.size + halfSiblingLinks.size + customLinks.size;
    el.memberCount.textContent = plural(peopleCount, "personne", "personnes");
    el.statPeople.textContent = plural(peopleCount, "membre", "membres");
    el.statLinks.textContent = plural(totalLinks, "lien", "liens");
  }

  function renderDiagramControls() {
    el.manualLayoutToggle.setAttribute("aria-pressed", state.manualLayout ? "true" : "false");
    el.manualLayoutToggle.classList.toggle("active", state.manualLayout);
    el.treeViewport.classList.toggle("manual-layout", state.manualLayout);
    el.diagramRelationType.disabled = !state.manualLayout || state.tree.people.length < 2;
    el.resetLayoutBtn.disabled = !state.tree.people.some((person) => person.layout && person.layout.manual);
    el.showAllTreeBtn.hidden = state.hiddenPersonIds.size === 0;

    const source = getPerson(state.diagramLink.sourceId);
    if (!state.manualLayout || !source || el.diagramRelationType.value === "select") {
      el.diagramLinkHint.textContent = state.manualLayout && state.manualSelectionIds.length > 1
        ? `${state.manualSelectionIds.length} cartes sélectionnées`
        : (state.manualLayout ? "Mode manuel" : "");
      return;
    }

    el.diagramLinkHint.textContent = `${getDisplayName(source)} sélectionné`;
  }

  function renderRelationSummary() {
    const person = getPerson(state.selectedId);

    if (!person) {
      el.relationSummary.innerHTML = "<div class=\"empty-state\">Sélectionnez un membre pour voir ses liens.</div>";
      return;
    }

    const entries = getRelationEntries(person);

    if (!entries.length) {
      el.relationSummary.innerHTML = "<div class=\"empty-state\">Aucun lien enregistré pour ce membre.</div>";
      return;
    }

    el.relationSummary.innerHTML = entries.map((entry) => {
      return [
        "<div class=\"relation-pill\">",
        `<strong>${escapeHtml(entry.name)}</strong>`,
        `<span>${escapeHtml(entry.type)}</span>`,
        "</div>"
      ].join("");
    }).join("");
  }

  function renderEditorView() {
    const showingPerson = state.editorTab === "person";
    const person = getPerson(state.selectedId);

    el.personForm.hidden = !showingPerson;
    el.relationsPanel.hidden = showingPerson;
    el.personTabBtn.classList.toggle("active", showingPerson);
    el.relationsTabBtn.classList.toggle("active", !showingPerson);
    el.personTabBtn.setAttribute("aria-selected", showingPerson ? "true" : "false");
    el.relationsTabBtn.setAttribute("aria-selected", showingPerson ? "false" : "true");
    el.editorPanelTitle.textContent = showingPerson ? "Fiche" : "Liens";

    if (showingPerson) {
      el.editorMode.textContent = person ? "Modifier un membre" : "Nouveau membre";
    } else {
      el.editorMode.textContent = "Parenté à modifier";
    }
  }

  function setEditorTab(tabName) {
    state.editorTab = tabName === "relations" ? "relations" : "person";
    renderEditorView();

    if (state.editorTab === "relations") {
      window.requestAnimationFrame(() => {
        el.relationPersonA.focus();
      });
    }
  }

  function renderPanelStates() {
    el.appShell.classList.toggle("members-collapsed", state.panels.membersCollapsed);
    el.appShell.classList.toggle("editor-collapsed", state.panels.editorCollapsed);
    el.membersPanel.classList.toggle("is-collapsed", state.panels.membersCollapsed);
    el.editorPanel.classList.toggle("is-collapsed", state.panels.editorCollapsed);

    el.membersPanelToggle.textContent = state.panels.membersCollapsed ? "›" : "‹";
    el.membersPanelToggle.setAttribute("aria-expanded", state.panels.membersCollapsed ? "false" : "true");
    el.membersPanelToggle.setAttribute("aria-label", state.panels.membersCollapsed ? "Déplier la liste" : "Replier la liste");
    el.membersPanelToggle.title = state.panels.membersCollapsed ? "Déplier la liste" : "Replier la liste";

    el.editorPanelToggle.textContent = state.panels.editorCollapsed ? "‹" : "›";
    el.editorPanelToggle.setAttribute("aria-expanded", state.panels.editorCollapsed ? "false" : "true");
    el.editorPanelToggle.setAttribute("aria-label", state.panels.editorCollapsed ? "Déplier la fiche" : "Replier la fiche");
    el.editorPanelToggle.title = state.panels.editorCollapsed ? "Déplier la fiche" : "Replier la fiche";
  }

  function toggleSidePanel(panelName) {
    if (panelName === "members") {
      state.panels.membersCollapsed = !state.panels.membersCollapsed;
    } else {
      state.panels.editorCollapsed = !state.panels.editorCollapsed;
    }

    renderPanelStates();
    window.requestAnimationFrame(fitTree);
  }

  function fillPersonForm(person) {
    el.personId.value = person ? person.id : "";
    el.firstName.value = person ? person.firstName : "";
    el.lastName.value = person ? person.lastName : "";
    el.gender.value = person ? person.gender : "";
    el.birthDate.value = person ? person.birthDate : "";
    el.deathDate.value = person ? person.deathDate : "";
    el.birthPlace.value = person ? person.birthPlace : "";
    el.currentPlace.value = person ? person.currentPlace : "";
    el.occupation.value = person ? person.occupation : "";
    el.notes.value = person ? person.notes : "";
    state.photoDraft = person ? person.photo : "";
    el.photoInput.value = "";
  }

  function savePersonFromForm(event) {
    event.preventDefault();

    const now = new Date().toISOString();
    const personId = el.personId.value || TreeStorage.makeId();
    let person = getPerson(personId);
    const firstName = clean(el.firstName.value);
    const lastName = clean(el.lastName.value);
    const displayName = buildDisplayName(firstName, lastName);
    const birthDate = readPartialDate(el.birthDate, "date de naissance");
    const deathDate = readPartialDate(el.deathDate, "date de décès");

    const isNewPerson = !person;

    if (birthDate === null || deathDate === null) {
      return;
    }

    if (isNewPerson) {
      person = {
        id: personId,
        parentIds: [],
        adoptiveParentIds: [],
        partnerIds: [],
        formerPartnerIds: [],
        siblingIds: [],
        halfSiblingIds: [],
        customRelations: [],
        layout: getViewportCenteredNodeLayout(),
        createdAt: now
      };
      state.tree.people.push(person);
    }

    Object.assign(person, {
      firstName,
      lastName,
      displayName,
      gender: clean(el.gender.value),
      birthDate,
      deathDate,
      birthPlace: clean(el.birthPlace.value),
      currentPlace: clean(el.currentPlace.value),
      occupation: clean(el.occupation.value),
      notes: clean(el.notes.value),
      photo: state.photoDraft,
      updatedAt: now
    });

    state.selectedId = person.id;
    state.manualSelectionIds = [person.id];
    state.renderedFormId = null;
    markDirty("Fiche enregistrée");
    renderAll();
  }

  function deleteSelectedPerson() {
    const person = getPerson(state.selectedId);
    if (!person) {
      return;
    }

    const confirmed = window.confirm(`Supprimer ${getDisplayName(person)} et tous ses liens ?`);
    if (!confirmed) {
      return;
    }

    state.tree.people = state.tree.people
      .filter((candidate) => candidate.id !== person.id)
      .map((candidate) => ({
        ...candidate,
        parentIds: candidate.parentIds.filter((id) => id !== person.id),
        adoptiveParentIds: candidate.adoptiveParentIds.filter((id) => id !== person.id),
        partnerIds: candidate.partnerIds.filter((id) => id !== person.id),
        formerPartnerIds: candidate.formerPartnerIds.filter((id) => id !== person.id),
        siblingIds: candidate.siblingIds.filter((id) => id !== person.id),
        halfSiblingIds: candidate.halfSiblingIds.filter((id) => id !== person.id),
        customRelations: candidate.customRelations.filter((relation) => relation.personId !== person.id)
      }));

    state.selectedId = state.tree.people[0] ? state.tree.people[0].id : "";
    state.manualSelectionIds = state.selectedId ? [state.selectedId] : [];
    state.hiddenPersonIds.delete(person.id);
    state.maskedBranchRootIds.delete(person.id);
    recomputeHiddenBranchIds();
    state.renderedFormId = null;
    markDirty("Membre supprimé");
    renderAll();
  }

  function startNewPerson() {
    state.selectedId = "";
    state.manualSelectionIds = [];
    state.renderedFormId = null;
    renderAll();
    el.firstName.focus();
    updateStatus("Nouvelle fiche");
  }

  function selectPerson(personId) {
    if (!getPerson(personId)) {
      return;
    }

    state.selectedId = personId;
    state.manualSelectionIds = [personId];
    state.renderedFormId = null;
    renderAll();
  }

  function hideBranchOf(personId) {
    const person = getPerson(personId);
    if (!person) {
      return;
    }

    const protectedIds = getProtectedBranchIds(personId);
    const branchIds = getSideBranchIds(personId, protectedIds);
    const wasMasked = state.maskedBranchRootIds.has(personId);

    if (wasMasked) {
      state.maskedBranchRootIds.delete(personId);
      recomputeHiddenBranchIds();
      state.selectedId = personId;
      state.manualSelectionIds = [personId];
      state.renderedFormId = null;
      state.diagramLink.sourceId = "";
      renderAll();
      updateStatus(`Branche de ${getDisplayName(person)} affichee`);
      return;
    }

    if (!branchIds.length) {
      updateStatus("Aucune branche laterale a masquer");
      return;
    }

    const hiddenBefore = new Set(state.hiddenPersonIds);
    state.maskedBranchRootIds.add(personId);
    recomputeHiddenBranchIds();
    state.selectedId = personId;
    state.renderedFormId = null;

    state.manualSelectionIds = state.manualSelectionIds.filter((id) => !state.hiddenPersonIds.has(id));
    if (!state.manualSelectionIds.includes(personId)) {
      state.manualSelectionIds = [personId];
    }
    state.diagramLink.sourceId = "";

    renderAll();
    const newlyHiddenCount = Array.from(state.hiddenPersonIds).filter((id) => !hiddenBefore.has(id)).length;
    updateStatus(`${newlyHiddenCount} membres masques autour de ${getDisplayName(person)}`);
  }

  function showAllPeople() {
    if (!state.hiddenPersonIds.size && !state.maskedBranchRootIds.size) {
      return;
    }

    state.hiddenPersonIds.clear();
    state.maskedBranchRootIds.clear();
    renderAll();
    updateStatus("Arbre complet affiche");
  }

  function getAncestorIds(personId, visited) {
    const person = getPerson(personId);
    if (!person || visited.has(personId)) {
      return [];
    }

    visited.add(personId);
    return getPersonParentLikeIds(person)
      .filter((id) => getPerson(id))
      .flatMap((id) => [id, ...getAncestorIds(id, visited)]);
  }

  function getProtectedBranchIds(personId) {
    const partnerIds = getPartnerLikeIds(personId);
    return new Set([
      personId,
      ...partnerIds,
      ...getDescendantIds(personId, new Set())
    ]);
  }

  function getSideBranchIds(personId, protectedIds) {
    const seeds = new Set(getAncestorIds(personId, new Set()));
    getRelatedPersonIds(personId).forEach((id) => {
      if (!protectedIds.has(id)) {
        seeds.add(id);
      }
    });

    const branchIds = new Set();
    seeds.forEach((seedId) => {
      collectConnectedBranchIds(seedId, protectedIds, branchIds);
    });

    return Array.from(branchIds).filter((id) => getPerson(id) && !protectedIds.has(id));
  }

  function recomputeHiddenBranchIds() {
    const hiddenIds = new Set();

    state.maskedBranchRootIds.forEach((rootId) => {
      if (!getPerson(rootId)) {
        return;
      }

      const protectedIds = getProtectedBranchIds(rootId);
      getSideBranchIds(rootId, protectedIds).forEach((id) => hiddenIds.add(id));
      protectedIds.forEach((id) => hiddenIds.delete(id));
    });

    state.hiddenPersonIds = hiddenIds;
  }

  function getDescendantIds(personId, visited) {
    if (visited.has(personId)) {
      return [];
    }

    visited.add(personId);
    return state.tree.people
      .filter((person) => getPersonParentLikeIds(person).includes(personId))
      .flatMap((person) => [person.id, ...getDescendantIds(person.id, visited)]);
  }

  function collectConnectedBranchIds(seedId, protectedIds, collectedIds) {
    const pending = [seedId];
    const visited = new Set();

    while (pending.length) {
      const currentId = pending.shift();
      if (visited.has(currentId) || protectedIds.has(currentId) || !getPerson(currentId)) {
        continue;
      }

      visited.add(currentId);
      collectedIds.add(currentId);
      getRelatedPersonIds(currentId).forEach((relatedId) => {
        if (!visited.has(relatedId) && !protectedIds.has(relatedId)) {
          pending.push(relatedId);
        }
      });
    }
  }

  function getRelatedPersonIds(personId) {
    const person = getPerson(personId);
    if (!person) {
      return [];
    }

    const relatedIds = new Set([
      ...getPersonParentLikeIds(person),
      ...(person.partnerIds || []),
      ...(person.formerPartnerIds || []),
      ...(person.siblingIds || []),
      ...(person.halfSiblingIds || []),
      ...(person.customRelations || []).map((relation) => relation.personId)
    ]);

    state.tree.people.forEach((candidate) => {
      if (candidate.id === personId) {
        return;
      }
      if (getPersonParentLikeIds(candidate).includes(personId)) {
        relatedIds.add(candidate.id);
      }
      if ((candidate.partnerIds || []).includes(personId) ||
          (candidate.formerPartnerIds || []).includes(personId) ||
          (candidate.siblingIds || []).includes(personId) ||
          (candidate.halfSiblingIds || []).includes(personId) ||
          (candidate.customRelations || []).some((relation) => relation.personId === personId)) {
        relatedIds.add(candidate.id);
      }
    });

    return Array.from(relatedIds).filter((id) => getPerson(id));
  }

  function getPartnerLikeIds(personId) {
    const person = getPerson(personId);
    if (!person) {
      return [];
    }

    const partnerIds = new Set([
      ...(person.partnerIds || []),
      ...(person.formerPartnerIds || [])
    ]);
    state.tree.people.forEach((candidate) => {
      if ((candidate.partnerIds || []).includes(personId) ||
          (candidate.formerPartnerIds || []).includes(personId)) {
        partnerIds.add(candidate.id);
      }
    });

    return Array.from(partnerIds).filter((id) => getPerson(id));
  }

  function getPersonParentLikeIds(person) {
    const customParents = (person.customRelations || [])
      .filter((relation) => relation.direction === "up")
      .map((relation) => relation.personId);

    return Array.from(new Set([
      ...(person.parentIds || []),
      ...(person.adoptiveParentIds || []),
      ...customParents
    ]));
  }

  function updatePhotoDraft() {
    const file = el.photoInput.files && el.photoInput.files[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      updateStatus("Format d’image non reconnu");
      el.photoInput.value = "";
      return;
    }

    makePhotoDataUrl(file)
      .then((dataUrl) => {
        state.photoDraft = dataUrl;
        updatePhotoPreview();
        updateStatus("Photo prête");
      })
      .catch(() => {
        updateStatus("Photo impossible à lire");
      });
  }

  function removePhotoDraft() {
    state.photoDraft = "";
    el.photoInput.value = "";
    updatePhotoPreview();
  }

  function updatePhotoPreview() {
    if (state.photoDraft) {
      el.photoPreview.innerHTML = `<img src="${escapeAttribute(state.photoDraft)}" alt="">`;
      return;
    }

    el.photoPreview.textContent = getInitials({
      firstName: clean(el.firstName.value),
      lastName: clean(el.lastName.value)
    });
  }

  function makePhotoDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const image = new Image();

      reader.addEventListener("load", () => {
        image.src = String(reader.result || "");
      });
      reader.addEventListener("error", reject);
      image.addEventListener("error", reject);
      image.addEventListener("load", () => {
        const maxSize = 620;
        const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * ratio));
        const height = Math.max(1, Math.round(image.height * ratio));
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      });

      reader.readAsDataURL(file);
    });
  }

  function bindRelationSearch(slot) {
    const input = relationInput(slot);

    input.addEventListener("input", () => {
      state.relationDraft[relationKey(slot)] = "";
      renderPersonSuggestions(slot);
      updateRelationControlState();
    });

    input.addEventListener("focus", () => {
      renderPersonSuggestions(slot);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeRelationSuggestions();
        input.blur();
        return;
      }

      if (event.key === "Enter") {
        const firstSuggestion = relationResults(slot).querySelector(".person-suggestion");
        if (firstSuggestion) {
          event.preventDefault();
          setRelationPerson(slot, firstSuggestion.dataset.id);
        }
      }
    });
  }

  function renderRelationInputs() {
    renderRelationInput("a");
    renderRelationInput("b");
  }

  function renderRelationInput(slot) {
    const input = relationInput(slot);
    const person = getPerson(state.relationDraft[relationKey(slot)]);
    input.value = person ? getDisplayName(person) : "";
  }

  function renderPersonSuggestions(slot) {
    const input = relationInput(slot);
    const results = relationResults(slot);

    if (input.disabled) {
      closeRelationSuggestions(slot);
      return;
    }

    const otherId = state.relationDraft[relationKey(slot === "a" ? "b" : "a")];
    const query = normalizeSearch(input.value);
    const matches = state.tree.people
      .filter((person) => person.id !== otherId)
      .filter((person) => {
        if (!query) {
          return true;
        }

        return normalizeSearch([
          getDisplayName(person),
          person.firstName,
          person.lastName,
          person.birthDate,
          person.birthPlace,
          person.currentPlace,
          person.occupation
        ].join(" ")).includes(query);
      })
      .sort(comparePeople)
      .slice(0, 8);

    if (!matches.length) {
      results.innerHTML = "<span class=\"empty-state\">Aucun résultat</span>";
      results.classList.add("open");
      input.setAttribute("aria-expanded", "true");
      return;
    }

    results.innerHTML = "";
    matches.forEach((person) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "person-suggestion";
      button.dataset.id = person.id;
      button.setAttribute("role", "option");
      button.innerHTML = [
        `<strong>${escapeHtml(getDisplayName(person))}</strong>`,
        `<span>${escapeHtml(memberMeta(person))}</span>`
      ].join("");
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        setRelationPerson(slot, person.id);
      });
      results.appendChild(button);
    });

    results.classList.add("open");
    input.setAttribute("aria-expanded", "true");
  }

  function setRelationPerson(slot, personId) {
    state.relationDraft[relationKey(slot)] = getPerson(personId) ? personId : "";

    if (state.relationDraft.aId && state.relationDraft.aId === state.relationDraft.bId) {
      const otherSlot = slot === "a" ? "b" : "a";
      state.relationDraft[relationKey(otherSlot)] = firstDifferentId(state.tree.people, state.relationDraft[relationKey(slot)]);
    }

    renderRelationInputs();
    updateRelationControlState();
    closeRelationSuggestions();
  }

  function setRelationPair(firstId, secondId) {
    state.relationDraft.aId = getPerson(firstId) ? firstId : "";
    state.relationDraft.bId = getPerson(secondId) ? secondId : "";
    keepRelationPairDistinct();
    renderRelationInputs();
    updateRelationControlState();
    closeRelationSuggestions();
  }

  function getRelationPersonId(slot) {
    return state.relationDraft[relationKey(slot)];
  }

  function updateRelationControlState() {
    const hasPeople = state.tree.people.length > 0;
    const disabled = !isValidPair(state.relationDraft.aId, state.relationDraft.bId);

    el.relationPersonA.disabled = !hasPeople;
    el.relationPersonB.disabled = !hasPeople;
    el.addAdoptiveParentLinkBtn.disabled = disabled;
    el.addCustomLinkBtn.disabled = disabled;
    el.addFormerPartnerLinkBtn.disabled = disabled;
    el.addHalfSiblingLinkBtn.disabled = disabled;
    el.addParentLinkBtn.disabled = disabled;
    el.addPartnerLinkBtn.disabled = disabled;
    el.addSiblingLinkBtn.disabled = disabled;
    el.customRelationDirection.disabled = disabled;
    el.customRelationLabel.disabled = disabled;
    el.removeLinkBtn.disabled = disabled;
  }

  function closeRelationSuggestions(slot) {
    const slots = slot ? [slot] : ["a", "b"];

    slots.forEach((currentSlot) => {
      relationResults(currentSlot).classList.remove("open");
      relationInput(currentSlot).setAttribute("aria-expanded", "false");
    });
  }

  function relationInput(slot) {
    return slot === "a" ? el.relationPersonA : el.relationPersonB;
  }

  function relationResults(slot) {
    return slot === "a" ? el.relationPersonAResults : el.relationPersonBResults;
  }

  function relationKey(slot) {
    return slot === "a" ? "aId" : "bId";
  }

  function addParentLink() {
    addParentLikeLink(getRelationPersonId("a"), getRelationPersonId("b"), "parentIds", "adoptiveParentIds", "Lien de filiation ajouté");
  }

  function addAdoptiveParentLink() {
    addParentLikeLink(getRelationPersonId("a"), getRelationPersonId("b"), "adoptiveParentIds", "parentIds", "Lien adoptif ajouté");
  }

  function addParentLikeLink(parentId, childId, fieldName, otherFieldName, message) {
    if (!isValidPair(parentId, childId)) {
      updateStatus("Choisissez deux personnes différentes");
      return false;
    }

    if (isAncestor(childId, parentId)) {
      updateStatus("Lien impossible");
      window.alert("Ce lien créerait une boucle dans l’arbre.");
      return false;
    }

    const child = getPerson(childId);
    removeItem(child[otherFieldName], parentId);
    if (!child[fieldName].includes(parentId)) {
      child[fieldName].push(parentId);
    }

    state.selectedId = childId;
    state.manualSelectionIds = [childId];
    markDirty(message);
    renderAll();
    return true;
  }

  function addPartnerLink() {
    addPartnerLikeLink(getRelationPersonId("a"), getRelationPersonId("b"), "partnerIds", "formerPartnerIds", "Couple ajouté");
  }

  function addFormerPartnerLink() {
    addPartnerLikeLink(getRelationPersonId("a"), getRelationPersonId("b"), "formerPartnerIds", "partnerIds", "Ex-conjoint ajouté");
  }

  function addPartnerLikeLink(firstId, secondId, fieldName, otherFieldName, message) {
    if (!isValidPair(firstId, secondId)) {
      updateStatus("Choisissez deux personnes différentes");
      return false;
    }

    const first = getPerson(firstId);
    const second = getPerson(secondId);
    removeItem(first[otherFieldName], secondId);
    removeItem(second[otherFieldName], firstId);

    if (!first[fieldName].includes(secondId)) {
      first[fieldName].push(secondId);
    }
    if (!second[fieldName].includes(firstId)) {
      second[fieldName].push(firstId);
    }

    state.selectedId = firstId;
    state.manualSelectionIds = [firstId];
    markDirty(message);
    renderAll();
    return true;
  }

  function addSiblingLink() {
    addSymmetricIdLink("siblingIds", "Lien frère / sœur ajouté");
  }

  function addHalfSiblingLink() {
    addSymmetricIdLink("halfSiblingIds", "Lien demi-fratrie ajouté");
  }

  function addSymmetricIdLink(fieldName, message) {
    const firstId = getRelationPersonId("a");
    const secondId = getRelationPersonId("b");

    if (!isValidPair(firstId, secondId)) {
      updateStatus("Choisissez deux personnes différentes");
      return;
    }

    const first = getPerson(firstId);
    const second = getPerson(secondId);

    if (!first[fieldName].includes(secondId)) {
      first[fieldName].push(secondId);
    }
    if (!second[fieldName].includes(firstId)) {
      second[fieldName].push(firstId);
    }

    state.selectedId = firstId;
    state.manualSelectionIds = [firstId];
    markDirty(message);
    renderAll();
  }

  function addCustomLink() {
    addCustomLinkBetween(getRelationPersonId("a"), getRelationPersonId("b"));
  }

  function addCustomLinkBetween(firstId, secondId) {
    const label = clean(el.customRelationLabel.value);
    const direction = el.customRelationDirection.value || "same";

    if (!isValidPair(firstId, secondId)) {
      updateStatus("Choisissez deux personnes différentes");
      return false;
    }

    if (!label) {
      el.customRelationLabel.focus();
      updateStatus("Nom du lien requis");
      return false;
    }

    const first = getPerson(firstId);
    const second = getPerson(secondId);

    addCustomRelation(first, secondId, label, direction);
    addCustomRelation(second, firstId, label, inverseCustomDirection(direction));

    state.selectedId = firstId;
    state.manualSelectionIds = [firstId];
    el.customRelationLabel.value = "";
    markDirty("Lien personnalisé ajouté");
    renderAll();
    return true;
  }

  function removeRelationship() {
    const firstId = getRelationPersonId("a");
    const secondId = getRelationPersonId("b");

    if (!isValidPair(firstId, secondId)) {
      updateStatus("Choisissez deux personnes différentes");
      return;
    }

    const first = getPerson(firstId);
    const second = getPerson(secondId);
    let removed = false;

    removed = removeItem(first.partnerIds, secondId) || removed;
    removed = removeItem(second.partnerIds, firstId) || removed;
    removed = removeItem(first.formerPartnerIds, secondId) || removed;
    removed = removeItem(second.formerPartnerIds, firstId) || removed;
    removed = removeItem(first.siblingIds, secondId) || removed;
    removed = removeItem(second.siblingIds, firstId) || removed;
    removed = removeItem(first.halfSiblingIds, secondId) || removed;
    removed = removeItem(second.halfSiblingIds, firstId) || removed;
    removed = removeItem(first.parentIds, secondId) || removed;
    removed = removeItem(second.parentIds, firstId) || removed;
    removed = removeItem(first.adoptiveParentIds, secondId) || removed;
    removed = removeItem(second.adoptiveParentIds, firstId) || removed;
    removed = removeCustomRelationsBetween(first, secondId) || removed;
    removed = removeCustomRelationsBetween(second, firstId) || removed;

    if (!removed) {
      updateStatus("Aucun lien direct");
      renderAll();
      return;
    }

    markDirty("Lien supprimé");
    renderAll();
  }

  function keepRelationPairDistinct() {
    if (!state.relationDraft.aId || state.relationDraft.aId !== state.relationDraft.bId) {
      return;
    }

    state.relationDraft.bId = firstDifferentId(state.tree.people, state.relationDraft.aId);
  }

  function toggleManualLayout() {
    state.manualLayout = !state.manualLayout;
    state.diagramLink.sourceId = "";
    state.manualSelectionIds = state.manualLayout && state.selectedId ? [state.selectedId] : [];
    renderAll();
    updateStatus(state.manualLayout ? "Agencement manuel activé" : "Agencement automatique");
  }

  function clearDiagramLinkSource() {
    state.diagramLink.sourceId = "";
    renderAll();
  }

  function resetManualLayout() {
    const changed = state.tree.people.some((person) => person.layout && person.layout.manual);
    if (!changed) {
      return;
    }

    if (!window.confirm("Réinitialiser les positions manuelles ?")) {
      return;
    }

    state.tree.people.forEach((person) => {
      delete person.layout;
    });
    state.diagramLink.sourceId = "";
    markDirty("Positions réinitialisées");
    renderAll();
    fitTree();
  }

  function toggleManualSelection(personId) {
    if (!getPerson(personId)) {
      return;
    }

    const selected = new Set(state.manualSelectionIds.filter((id) => getPerson(id)));
    if (selected.has(personId) && selected.size > 1) {
      selected.delete(personId);
    } else {
      selected.add(personId);
    }

    state.manualSelectionIds = Array.from(selected);
    state.selectedId = personId;
    state.renderedFormId = null;
    state.diagramLink.sourceId = "";
    renderAll();
    updateStatus(state.manualSelectionIds.length > 1 ? `${state.manualSelectionIds.length} cartes sélectionnées` : "Carte sélectionnée");
  }

  function handleTreeNodeAction(personId, event) {
    if (state.suppressNodeClick) {
      state.suppressNodeClick = false;
      return;
    }

    if (state.manualLayout && event && event.shiftKey) {
      toggleManualSelection(personId);
      return;
    }

    const mode = el.diagramRelationType.value || "select";
    if (!state.manualLayout || mode === "select") {
      selectPerson(personId);
      return;
    }

    if (!state.diagramLink.sourceId) {
      state.diagramLink.sourceId = personId;
      state.selectedId = personId;
      renderAll();
      updateStatus("Première personne sélectionnée");
      return;
    }

    if (state.diagramLink.sourceId === personId) {
      state.diagramLink.sourceId = "";
      renderAll();
      updateStatus("Sélection annulée");
      return;
    }

    applyDiagramRelation(state.diagramLink.sourceId, personId, mode);
  }

  function applyDiagramRelation(firstId, secondId, mode) {
    state.diagramLink.sourceId = "";
    setRelationPair(firstId, secondId);

    if (mode === "parent") {
      addParentLikeLink(firstId, secondId, "parentIds", "adoptiveParentIds", "Lien de filiation ajouté");
      return;
    }
    if (mode === "adoptive-parent") {
      addParentLikeLink(firstId, secondId, "adoptiveParentIds", "parentIds", "Lien adoptif ajouté");
      return;
    }
    if (mode === "partner") {
      addPartnerLikeLink(firstId, secondId, "partnerIds", "formerPartnerIds", "Couple ajouté");
      return;
    }
    if (mode === "former-partner") {
      addPartnerLikeLink(firstId, secondId, "formerPartnerIds", "partnerIds", "Ex-conjoint ajouté");
      return;
    }
    if (mode === "sibling") {
      addSiblingLink();
      return;
    }
    if (mode === "half-sibling") {
      addHalfSiblingLink();
      return;
    }
    if (mode === "custom") {
      addCustomLinkBetween(firstId, secondId);
      return;
    }
    if (mode === "remove") {
      removeRelationship();
    }
  }

  function startNodeDrag(event, personId, position) {
    if (!state.manualLayout || event.button !== 0) {
      return;
    }

    const currentSelectionIds = state.manualSelectionIds.filter((id) => getPerson(id));
    const isAlreadySelected = currentSelectionIds.includes(personId);
    const dragIds = isAlreadySelected
      ? currentSelectionIds
      : (event.shiftKey && currentSelectionIds.length ? [...currentSelectionIds, personId] : [personId]);

    if (!isAlreadySelected && !event.shiftKey) {
      state.manualSelectionIds = [personId];
      state.selectedId = personId;
      state.renderedFormId = null;
    }

    event.stopPropagation();
    state.nodeDrag.active = true;
    state.nodeDrag.id = personId;
    state.nodeDrag.pointerId = event.pointerId;
    state.nodeDrag.startX = event.clientX;
    state.nodeDrag.startY = event.clientY;
    state.nodeDrag.originX = position.x;
    state.nodeDrag.originY = position.y;
    state.nodeDrag.items = dragIds.map((id) => {
      const itemPosition = id === personId ? position : getRenderedNodePosition(id);
      return {
        id,
        originX: itemPosition.x,
        originY: itemPosition.y
      };
    });
    state.nodeDrag.moved = false;

    window.addEventListener("pointermove", moveNodeDrag);
    window.addEventListener("pointerup", endNodeDrag);
    window.addEventListener("pointercancel", endNodeDrag);
  }

  function moveNodeDrag(event) {
    if (!state.nodeDrag.active || event.pointerId !== state.nodeDrag.pointerId) {
      return;
    }

    const deltaX = (event.clientX - state.nodeDrag.startX) / state.view.scale;
    const deltaY = (event.clientY - state.nodeDrag.startY) / state.view.scale;
    const moved = Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3;

    if (!moved && !state.nodeDrag.moved) {
      return;
    }

    state.nodeDrag.moved = true;
    state.diagramLink.sourceId = "";
    state.nodeDrag.items.forEach((item) => {
      setManualPosition(item.id, item.originX + deltaX, item.originY + deltaY);
    });
    scheduleDragRender();
  }

  function endNodeDrag(event) {
    if (!state.nodeDrag.active || event.pointerId !== state.nodeDrag.pointerId) {
      return;
    }

    window.removeEventListener("pointermove", moveNodeDrag);
    window.removeEventListener("pointerup", endNodeDrag);
    window.removeEventListener("pointercancel", endNodeDrag);

    if (state.nodeDrag.moved) {
      state.suppressNodeClick = true;
      markDirty(state.nodeDrag.items.length > 1 ? "Positions enregistrées" : "Position enregistrée");
      window.setTimeout(() => {
        state.suppressNodeClick = false;
      }, 0);
    }

    state.nodeDrag.active = false;
    state.nodeDrag.id = "";
    state.nodeDrag.items = [];
  }

  function getRenderedNodePosition(personId) {
    const node = Array.from(el.treeNodes.querySelectorAll(".tree-node"))
      .find((candidate) => candidate.dataset.id === personId);

    if (!node) {
      return { x: 0, y: 0 };
    }

    return {
      x: Number.parseFloat(node.style.left) || 0,
      y: Number.parseFloat(node.style.top) || 0
    };
  }

  function setManualPosition(personId, x, y) {
    const person = getPerson(personId);
    if (!person) {
      return;
    }

    person.layout = {
      manual: true,
      x: Math.round(x),
      y: Math.round(y)
    };
  }

  function getViewportCenteredNodeLayout() {
    const viewportRect = el.treeViewport.getBoundingClientRect();
    const scale = Number.isFinite(state.view.scale) && state.view.scale > 0 ? state.view.scale : 1;
    const nodeWidth = Number.isFinite(TreeView.constants.NODE_WIDTH) ? TreeView.constants.NODE_WIDTH : 240;
    const nodeHeight = Number.isFinite(TreeView.constants.NODE_HEIGHT) ? TreeView.constants.NODE_HEIGHT : 100;
    const centerX = (viewportRect.width / 2 - state.view.x) / scale;
    const centerY = (viewportRect.height / 2 - state.view.y) / scale;

    return {
      manual: true,
      x: Math.round(centerX - nodeWidth / 2),
      y: Math.round(centerY - nodeHeight / 2)
    };
  }

  function scheduleDragRender() {
    if (state.nodeDrag.raf) {
      return;
    }

    state.nodeDrag.raf = window.requestAnimationFrame(() => {
      state.nodeDrag.raf = 0;
      renderTree();
      renderDiagramControls();
    });
  }

  function createNewTree() {
    const hasContent = state.tree.people.length > 0;
    if (hasContent && !window.confirm("Créer un nouvel arbre vide ?")) {
      return;
    }

    TreeStorage.clear();
    state.tree = TreeStorage.emptyTree();
    state.selectedId = "";
    state.manualSelectionIds = [];
    state.relationDraft.aId = "";
    state.relationDraft.bId = "";
    state.photoDraft = "";
    state.renderedFormId = null;
    state.diagramLink.sourceId = "";
    state.manualLayout = false;
    state.hiddenPersonIds.clear();
    state.maskedBranchRootIds.clear();
    state.dirty = false;
    renderAll();
    saveNow("Nouvel arbre enregistré");
    fitTree();
  }

  function updateTreeTitle() {
    state.tree.metadata.title = clean(el.treeTitle.value) || "Famille";
    markDirty("Titre modifié");
  }

  function exportTreeJson() {
    if (state.dirty) {
      saveNow();
    }

    TreeStorage.download(state.tree);
    updateStatus("Fichier JSON enregistre");
  }

  function exportTreeSvg() {
    if (state.dirty) {
      saveNow();
    }

    renderTree();
    const svg = buildTreeSvg();
    downloadText(svg, `${safeTreeFileName()}-genealogie.svg`, "image/svg+xml;charset=utf-8");
    updateStatus("Export SVG cree");
  }

  function buildTreeSvg() {
    const width = Math.max(620, Math.ceil(state.treeBounds.width || 620));
    const height = Math.max(420, Math.ceil(state.treeBounds.height || 420));
    const viewX = Math.floor(Number.isFinite(state.treeBounds.minX) ? state.treeBounds.minX : 0);
    const viewY = Math.floor(Number.isFinite(state.treeBounds.minY) ? state.treeBounds.minY : 0);
    const nodeWidth = TreeView.constants.NODE_WIDTH;
    const nodeHeight = TreeView.constants.NODE_HEIGHT;
    const connectorPaths = Array.from(el.treeConnectors.querySelectorAll("path"))
      .map((path) => {
        return `<path class="${escapeAttribute(path.getAttribute("class") || "")}" d="${escapeAttribute(path.getAttribute("d") || "")}" />`;
      })
      .join("");
    const nodes = Array.from(el.treeNodes.querySelectorAll(".tree-node"))
      .map((node) => {
        const person = getPerson(node.dataset.id);
        if (!person) {
          return "";
        }

        const x = Number.parseFloat(node.style.left) || 0;
        const y = Number.parseFloat(node.style.top) || 0;
        const textMaxLength = Math.max(10, Math.floor((nodeWidth - 22) / 7));
        const nameLines = wrapSvgText(getDisplayName(person), textMaxLength, 2);
        const meta = formatLifeDates(person);
        const place = person.birthPlace || person.currentPlace || "";
        const avatarText = getInitials(person);
        const genderSymbol = renderExportGenderSymbol(person, nodeWidth);
        const avatar = renderExportAvatar(person, nodeWidth);
        const nameStartY = 86;
        const metaY = nameStartY + nameLines.length * 15 + 7;
        const placeY = metaY + 15;
        const tagsY = place ? placeY + 13 : metaY + 14;
        const tags = renderExportTags(person, tagsY, nodeWidth);

        return [
          `<g class="export-node" transform="translate(${formatSvgNumber(x)} ${formatSvgNumber(y)})">`,
          `<rect class="export-card" width="${nodeWidth}" height="${nodeHeight}" rx="8" />`,
          avatar || [
            `<circle class="export-avatar" cx="${formatSvgNumber(nodeWidth / 2)}" cy="40" r="28" />`,
            `<text class="export-avatar-text" x="${formatSvgNumber(nodeWidth / 2)}" y="46">${escapeXml(avatarText)}</text>`
          ].join(""),
          genderSymbol,
          nameLines.map((line, index) => `<text class="export-name" x="${formatSvgNumber(nodeWidth / 2)}" y="${nameStartY + index * 15}">${escapeXml(line)}</text>`).join(""),
          `<text class="export-meta" x="${formatSvgNumber(nodeWidth / 2)}" y="${metaY}">${escapeXml(truncateText(meta, textMaxLength + 4))}</text>`,
          place ? `<text class="export-place" x="${formatSvgNumber(nodeWidth / 2)}" y="${placeY}">${escapeXml(truncateText(place, textMaxLength + 2))}</text>` : "",
          tags,
          "</g>"
        ].join("");
      })
      .join("");

    return [
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="${viewX} ${viewY} ${width} ${height}" role="img" aria-label="${escapeAttribute(state.tree.metadata.title || "Arbre genealogique")}">`,
      "<defs>",
      "<style>",
      ".export-bg{fill:#f7f9fb}.connector{fill:none;stroke:#8aa2a0;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}.family-trunk,.family-branch{stroke-width:3}.partner-line{fill:none;stroke:#a33a4a;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.former-partner-line{fill:none;stroke:#7048a8;stroke-width:2.75;stroke-dasharray:10 7;stroke-linecap:round;stroke-linejoin:round}.adoption-line{stroke:#2563eb;stroke-dasharray:8 7}.sibling-line{fill:none;stroke:#b7791f;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.half-sibling-line{fill:none;stroke:#b7791f;stroke-width:2.5;stroke-dasharray:7 6;stroke-linecap:round;stroke-linejoin:round}.custom-line{fill:none;stroke:#52616b;stroke-width:2.25;stroke-dasharray:2 7;stroke-linecap:round;stroke-linejoin:round}.custom-line-up,.custom-line-down{stroke:#3f6f6a;stroke-dasharray:5 6}.export-card{fill:#fff;stroke:#b8c2cc;stroke-width:1.2;filter:drop-shadow(0 8px 12px rgba(31,41,51,.12))}.export-avatar{fill:#0f766e}.export-avatar-text{font:800 15px Arial,sans-serif;fill:#fff;text-anchor:middle}.export-name{font:800 13px Arial,sans-serif;fill:#1f2933;text-anchor:middle}.export-meta,.export-place{font:11px Arial,sans-serif;fill:#667085;text-anchor:middle}.export-gender{font:900 17px Arial,sans-serif;text-anchor:middle}.export-gender-male{fill:#2563eb}.export-gender-female{fill:#d6336c}.export-tag{fill:#eef3f2}.export-tag-text{font:800 9.5px Arial,sans-serif;fill:#667085;text-anchor:middle}",
      "</style>",
      "</defs>",
      `<rect class="export-bg" x="${viewX}" y="${viewY}" width="${width}" height="${height}" />`,
      connectorPaths,
      nodes,
      "</svg>"
    ].join("");
  }

  function renderExportAvatar(person, nodeWidth) {
    if (!person.photo) {
      return "";
    }

    const clipId = `avatar-${safeSvgId(person.id)}`;
    const centerX = nodeWidth / 2;
    return [
      `<defs><clipPath id="${clipId}"><circle cx="${formatSvgNumber(centerX)}" cy="40" r="28" /></clipPath></defs>`,
      `<circle class="export-avatar" cx="${formatSvgNumber(centerX)}" cy="40" r="28" />`,
      `<image href="${escapeAttribute(person.photo)}" xlink:href="${escapeAttribute(person.photo)}" x="${formatSvgNumber(centerX - 28)}" y="12" width="56" height="56" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />`
    ].join("");
  }

  function renderExportGenderSymbol(person, nodeWidth) {
    if (person.gender === "male") {
      return `<text class="export-gender export-gender-male" x="${nodeWidth - 18}" y="26">&#9794;</text>`;
    }
    if (person.gender === "female") {
      return `<text class="export-gender export-gender-female" x="${nodeWidth - 18}" y="26">&#9792;</text>`;
    }

    return "";
  }

  function renderExportTags(person, y, nodeWidth) {
    const tags = [];

    if (person.occupation) {
      tags.push(person.occupation);
    }
    if (person.currentPlace && person.currentPlace !== person.birthPlace) {
      tags.push(person.currentPlace);
    }

    let currentY = y;
    const maxWidth = Math.max(44, nodeWidth - 24);
    return tags.slice(0, 2).map((tag) => {
      const width = Math.min(maxWidth, Math.max(44, Math.round(tag.length * 5.8) + 14));
      const x = (nodeWidth - width) / 2;
      const text = truncateText(tag, Math.max(5, Math.floor((width - 14) / 5.8)));
      const markup = [
        `<rect class="export-tag" x="${formatSvgNumber(x)}" y="${currentY}" width="${width}" height="16" rx="8" />`,
        `<text class="export-tag-text" x="${formatSvgNumber(nodeWidth / 2)}" y="${currentY + 11}">${escapeXml(text)}</text>`
      ].join("");
      currentY += 17;
      return markup;
    }).join("");
  }

  function downloadText(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function safeTreeFileName() {
    return (state.tree.metadata.title || "arbre")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "arbre";
  }

  function safeSvgId(value) {
    return String(value || "person")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "person";
  }

  function wrapSvgText(value, maxLength, maxLines) {
    const words = String(value || "").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";

    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (next.length <= maxLength || !current) {
        current = next;
        return;
      }
      lines.push(current);
      current = word;
    });

    if (current) {
      lines.push(current);
    }

    const limited = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
      limited[limited.length - 1] = truncateText(limited[limited.length - 1], maxLength);
    }

    return limited.length ? limited : ["Inconnu"];
  }

  function truncateText(value, maxLength) {
    const text = String(value || "");
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
  }

  function formatSvgNumber(value) {
    return String(Math.round(value * 100) / 100);
  }

  function escapeXml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function importTree(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    TreeStorage.readImport(file)
      .then((tree) => {
        const confirmed = !state.tree.people.length || window.confirm("Remplacer l’arbre actuel par ce fichier ?");
        if (!confirmed) {
          return;
        }

        state.tree = tree;
        state.selectedId = tree.people[0] ? tree.people[0].id : "";
        state.manualSelectionIds = state.selectedId ? [state.selectedId] : [];
        state.hiddenPersonIds.clear();
        state.maskedBranchRootIds.clear();
        state.relationDraft.aId = state.selectedId;
        state.relationDraft.bId = firstDifferentId(tree.people, state.relationDraft.aId);
        state.renderedFormId = null;
        state.photoDraft = "";
        state.dirty = true;
        saveNow("Arbre importé");
        renderAll();
        fitTree();
      })
      .catch((error) => {
        window.alert(error.message);
        updateStatus("Import échoué");
      })
      .finally(() => {
        el.importFile.value = "";
      });
  }

  function saveNow(message) {
    window.clearTimeout(state.saveTimer);
    state.tree = TreeStorage.save(state.tree);
    state.dirty = false;
    updateStatus(message || "Enregistré automatiquement");
  }

  function markDirty(message) {
    state.dirty = true;
    updateStatus(message || "Modifié");
    window.clearTimeout(state.saveTimer);
    state.saveTimer = window.setTimeout(() => saveNow(), 650);
  }

  function updateStatus(message) {
    el.saveStatus.textContent = message || "Prêt";
  }

  function handleViewportResize() {
    renderTree();
    fitTree();
  }

  function fitTree() {
    const viewportRect = el.treeViewport.getBoundingClientRect();
    const width = state.treeBounds.width || 600;
    const height = state.treeBounds.height || 420;
    const minX = Number.isFinite(state.treeBounds.minX) ? state.treeBounds.minX : 0;
    const minY = Number.isFinite(state.treeBounds.minY) ? state.treeBounds.minY : 0;
    const compactViewport = viewportRect.width < 520;
    const viewportPadding = compactViewport ? 28 : 48;
    const minFitScale = compactViewport ? 0.24 : 0.35;
    const scale = clamp(Math.min((viewportRect.width - viewportPadding) / width, (viewportRect.height - viewportPadding) / height, 1), minFitScale, 1);

    state.view.scale = scale;
    state.view.x = Math.max(viewportPadding / 2, (viewportRect.width - width * scale) / 2) - minX * scale;
    state.view.y = Math.max(viewportPadding / 2, (viewportRect.height - height * scale) / 2) - minY * scale;
    applyViewTransform();
  }

  function zoomAtCenter(factor) {
    const rect = el.treeViewport.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, state.view.scale * factor);
  }

  function handleWheel(event) {
    event.preventDefault();

    const rect = el.treeViewport.getBoundingClientRect();
    const nextScale = state.view.scale * (event.deltaY > 0 ? 0.9 : 1.1);
    zoomAt(event.clientX - rect.left, event.clientY - rect.top, nextScale);
  }

  function zoomAt(viewportX, viewportY, nextScale) {
    const scale = clamp(nextScale, 0.28, 1.7);
    const worldX = (viewportX - state.view.x) / state.view.scale;
    const worldY = (viewportY - state.view.y) / state.view.scale;

    state.view.scale = scale;
    state.view.x = viewportX - worldX * scale;
    state.view.y = viewportY - worldY * scale;
    applyViewTransform();
  }

  function startPan(event) {
    if (event.button !== 0 || event.target.closest(".tree-node")) {
      return;
    }

    state.drag.active = true;
    state.drag.startX = event.clientX;
    state.drag.startY = event.clientY;
    state.drag.originX = state.view.x;
    state.drag.originY = state.view.y;
    el.treeViewport.classList.add("dragging");
    el.treeViewport.setPointerCapture(event.pointerId);
  }

  function movePan(event) {
    if (!state.drag.active) {
      return;
    }

    state.view.x = state.drag.originX + event.clientX - state.drag.startX;
    state.view.y = state.drag.originY + event.clientY - state.drag.startY;
    applyViewTransform();
  }

  function endPan(event) {
    if (!state.drag.active) {
      return;
    }

    state.drag.active = false;
    el.treeViewport.classList.remove("dragging");

    if (el.treeViewport.hasPointerCapture(event.pointerId)) {
      el.treeViewport.releasePointerCapture(event.pointerId);
    }
  }

  function applyViewTransform() {
    el.treeSurface.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.scale})`;
  }

  function ensureSelectionExists() {
    state.manualSelectionIds = state.manualSelectionIds.filter((id) => getPerson(id));

    if (state.selectedId && getPerson(state.selectedId)) {
      if (state.manualLayout && !state.manualSelectionIds.length) {
        state.manualSelectionIds = [state.selectedId];
      }
      return;
    }

    if (state.selectedId) {
      state.selectedId = state.tree.people[0] ? state.tree.people[0].id : "";
      state.manualSelectionIds = state.selectedId ? [state.selectedId] : [];
      state.renderedFormId = null;
    }
  }

  function getPerson(personId) {
    return state.tree.people.find((person) => person.id === personId);
  }

  function getRelationEntries(person) {
    const entries = [];

    addRelationEntries(entries, person.parentIds, "Parent biologique");
    addRelationEntries(entries, person.adoptiveParentIds, "Parent adoptif");
    addRelationEntries(entries, person.partnerIds, "Couple");
    addRelationEntries(entries, person.formerPartnerIds, "Ex-conjoint");
    addRelationEntries(entries, person.siblingIds, "Frère / sœur");
    addRelationEntries(entries, person.halfSiblingIds, "Demi-fratrie");

    state.tree.people.forEach((candidate) => {
      if (candidate.parentIds.includes(person.id)) {
        entries.push({ name: getDisplayName(candidate), type: "Enfant biologique" });
      }
      if (candidate.adoptiveParentIds.includes(person.id)) {
        entries.push({ name: getDisplayName(candidate), type: "Enfant adoptif" });
      }
    });

    person.customRelations.forEach((relation) => {
      const linkedPerson = getPerson(relation.personId);
      if (linkedPerson) {
        entries.push({ name: getDisplayName(linkedPerson), type: `${relation.label} (${customDirectionLabel(relation.direction)})` });
      }
    });

    return entries.sort((first, second) => {
      const firstValue = `${first.type} ${first.name}`;
      const secondValue = `${second.type} ${second.name}`;
      return firstValue.localeCompare(secondValue, "fr", { sensitivity: "base" });
    });
  }

  function addRelationEntries(entries, ids, type) {
    ids.forEach((id) => {
      const person = getPerson(id);
      if (person) {
        entries.push({ name: getDisplayName(person), type });
      }
    });
  }

  function firstDifferentId(people, currentId) {
    const other = people.find((person) => person.id !== currentId);
    return other ? other.id : currentId || "";
  }

  function isValidPair(firstId, secondId) {
    return firstId && secondId && firstId !== secondId && getPerson(firstId) && getPerson(secondId);
  }

  function isAncestor(ancestorId, personId, visited) {
    const seen = visited || new Set();
    if (seen.has(personId)) {
      return false;
    }
    seen.add(personId);

    const person = getPerson(personId);
    if (!person) {
      return false;
    }

    const parentIds = getEffectiveParentIds(person);
    if (parentIds.includes(ancestorId)) {
      return true;
    }

    return parentIds.some((parentId) => isAncestor(ancestorId, parentId, seen));
  }

  function removeItem(items, value) {
    const index = items.indexOf(value);
    if (index === -1) {
      return false;
    }

    items.splice(index, 1);
    return true;
  }

  function addCustomRelation(person, personId, label, direction) {
    const exists = person.customRelations.some((relation) => {
      return relation.personId === personId &&
        relation.label.toLowerCase() === label.toLowerCase() &&
        (relation.direction || "same") === direction;
    });

    if (!exists) {
      person.customRelations.push({ personId, label, direction });
    }
  }

  function removeCustomRelationsBetween(person, personId) {
    const previousLength = person.customRelations.length;
    person.customRelations = person.customRelations.filter((relation) => relation.personId !== personId);
    return person.customRelations.length !== previousLength;
  }

  function getEffectiveParentIds(person) {
    return Array.from(new Set([...(person.parentIds || []), ...(person.adoptiveParentIds || [])]));
  }

  function inverseCustomDirection(direction) {
    if (direction === "up") {
      return "down";
    }
    if (direction === "down") {
      return "up";
    }

    return "same";
  }

  function canonicalCustomRelationKey(firstId, secondId, label, direction) {
    const ordered = [firstId, secondId].sort();
    const canonicalDirection = firstId === ordered[0] ? direction : inverseCustomDirection(direction);
    return `${ordered.join(":")}:${label.toLowerCase()}:${canonicalDirection}`;
  }

  function customDirectionLabel(direction) {
    if (direction === "up") {
      return "vers le haut";
    }
    if (direction === "down") {
      return "vers le bas";
    }

    return "même niveau";
  }

  function renderAvatar(person, className) {
    if (person.photo) {
      return `<span class="${className}"><img src="${escapeAttribute(person.photo)}" alt=""></span>`;
    }

    return `<span class="${className}">${escapeHtml(getInitials(person))}</span>`;
  }

  function memberMeta(person) {
    const dates = formatLifeDates(person);
    const place = person.birthPlace || person.currentPlace;
    return [genderLabel(person.gender), dates, place].filter(Boolean).join(" · ") || "Fiche à compléter";
  }

  function formatLifeDates(person) {
    const birth = formatPartialDate(person.birthDate);
    const death = formatPartialDate(person.deathDate);

    if (birth && death) {
      return `${birth} - ${death}`;
    }
    if (birth) {
      return `${bornLabel(person.gender)} en ${birth}`;
    }
    if (death) {
      return `décès ${death}`;
    }

    return "";
  }

  function readPartialDate(input, label) {
    const normalized = normalizePartialDate(input.value);
    if (normalized !== null) {
      input.value = normalized;
      return normalized;
    }

    input.focus();
    updateStatus("Date invalide");
    window.alert(`La ${label} doit être au format AAAA, AAAA-MM ou AAAA-MM-JJ.`);
    return null;
  }

  function normalizePartialDate(value) {
    const cleaned = clean(value);
    if (!cleaned) {
      return "";
    }

    const normalized = cleaned.replace(/[/. ]+/g, "-");
    const match = normalized.match(/^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/);

    if (!match) {
      return null;
    }

    const year = match[1];
    if (!match[2]) {
      return year;
    }

    const monthNumber = Number(match[2]);
    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return null;
    }

    const month = String(monthNumber).padStart(2, "0");
    if (!match[3]) {
      return `${year}-${month}`;
    }

    const dayNumber = Number(match[3]);
    const maxDay = daysInMonth(Number(year), monthNumber);
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > maxDay) {
      return null;
    }

    return `${year}-${month}-${String(dayNumber).padStart(2, "0")}`;
  }

  function daysInMonth(year, month) {
    if (month === 2) {
      if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
        return 29;
      }
      return 28;
    }

    return [4, 6, 9, 11].includes(month) ? 30 : 31;
  }

  function formatPartialDate(value) {
    const text = clean(value);
    const match = text.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
    const monthNames = ["", "janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

    if (!match) {
      return text;
    }
    if (!match[2]) {
      return match[1];
    }
    if (!monthNames[Number(match[2])]) {
      return text;
    }
    if (!match[3]) {
      return `${monthNames[Number(match[2])]} ${match[1]}`;
    }

    return `${Number(match[3])} ${monthNames[Number(match[2])]} ${match[1]}`;
  }

  function getInitials(person) {
    const source = getDisplayName(person);
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?";
  }

  function comparePeople(first, second) {
    const firstName = `${first.lastName || ""} ${first.firstName || ""} ${getDisplayName(first)}`;
    const secondName = `${second.lastName || ""} ${second.firstName || ""} ${getDisplayName(second)}`;
    return firstName.localeCompare(secondName, "fr", { sensitivity: "base" });
  }

  function getDisplayName(person) {
    return buildDisplayName(clean(person.firstName), clean(person.lastName));
  }

  function buildDisplayName(firstName, lastName) {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    if (lastName) {
      return lastName;
    }

    return "Inconnu";
  }

  function genderLabel(gender) {
    if (gender === "male") {
      return "Homme";
    }
    if (gender === "female") {
      return "Femme";
    }

    return "";
  }

  function bornLabel(gender) {
    if (gender === "male") {
      return "né";
    }
    if (gender === "female") {
      return "née";
    }

    return "né(e)";
  }

  function plural(count, singular, pluralValue) {
    return `${count} ${count > 1 ? pluralValue : singular}`;
  }

  function normalizeSearch(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function debounce(callback, delay) {
    let timer = 0;
    return function debounced() {
      window.clearTimeout(timer);
      timer = window.setTimeout(callback, delay);
    };
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }
}());
