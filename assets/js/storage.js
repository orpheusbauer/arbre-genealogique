(function () {
  "use strict";

  const STORAGE_KEY = "genealogy-builder-tree-v1";
  const CURRENT_VERSION = 2;

  function emptyTree() {
    return {
      version: CURRENT_VERSION,
      metadata: {
        title: "Famille",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      people: []
    };
  }

  function uniqueIds(values) {
    if (!Array.isArray(values)) {
      return [];
    }

    return Array.from(new Set(values.filter(Boolean).map(String)));
  }

  function normalizeGender(value) {
    return value === "male" || value === "female" ? value : "";
  }

  function normalizeCustomDirection(value) {
    return value === "up" || value === "down" || value === "same" ? value : "same";
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

  function normalizeCustomRelations(values) {
    if (!Array.isArray(values)) {
      return [];
    }

    const seen = new Set();
    const relations = [];

    values.forEach((relation) => {
      const personId = cleanText(relation.personId || relation.id);
      const label = cleanText(relation.label);
      const direction = normalizeCustomDirection(relation.direction);
      const key = `${personId}:${label.toLowerCase()}:${direction}`;

      if (!personId || !label || seen.has(key)) {
        return;
      }

      seen.add(key);
      relations.push({ personId, label, direction });
    });

    return relations;
  }

  function normalizeLayout(value) {
    if (!value || value.manual !== true) {
      return null;
    }

    const x = Number(value.x);
    const y = Number(value.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    return {
      manual: true,
      x: Math.round(x),
      y: Math.round(y)
    };
  }

  function normalizePerson(person) {
    const fallbackId = makeId();
    const firstName = cleanText(person.firstName);
    const lastName = cleanText(person.lastName);

    const normalized = {
      id: cleanText(person.id) || fallbackId,
      firstName,
      lastName,
      displayName: buildDisplayName(firstName, lastName),
      gender: normalizeGender(person.gender),
      birthDate: cleanText(person.birthDate),
      deathDate: cleanText(person.deathDate),
      birthPlace: cleanText(person.birthPlace),
      currentPlace: cleanText(person.currentPlace),
      occupation: cleanText(person.occupation),
      notes: cleanText(person.notes),
      photo: cleanText(person.photo),
      parentIds: uniqueIds(person.parentIds),
      adoptiveParentIds: uniqueIds(person.adoptiveParentIds || person.adoptedParentIds),
      partnerIds: uniqueIds(person.partnerIds),
      formerPartnerIds: uniqueIds(person.formerPartnerIds || person.exPartnerIds),
      siblingIds: uniqueIds(person.siblingIds),
      halfSiblingIds: uniqueIds(person.halfSiblingIds),
      customRelations: normalizeCustomRelations(person.customRelations || person.customLinks),
      createdAt: cleanText(person.createdAt) || new Date().toISOString(),
      updatedAt: cleanText(person.updatedAt) || new Date().toISOString()
    };

    const layout = normalizeLayout(person.layout);
    if (layout) {
      normalized.layout = layout;
    }

    return normalized;
  }

  function normalizeTree(input) {
    const source = Array.isArray(input) ? { people: input } : input;

    if (!source || !Array.isArray(source.people)) {
      return emptyTree();
    }

    const tree = emptyTree();
    const metadata = source.metadata || {};

    tree.version = CURRENT_VERSION;
    tree.metadata = {
      title: cleanText(metadata.title) || "Famille",
      createdAt: cleanText(metadata.createdAt) || new Date().toISOString(),
      updatedAt: cleanText(metadata.updatedAt) || new Date().toISOString()
    };

    tree.people = source.people.map(normalizePerson);

    const validIds = new Set(tree.people.map((person) => person.id));

    tree.people.forEach((person) => {
      person.parentIds = person.parentIds.filter((id) => validIds.has(id) && id !== person.id);
      person.adoptiveParentIds = person.adoptiveParentIds.filter((id) => validIds.has(id) && id !== person.id && !person.parentIds.includes(id));
      person.partnerIds = person.partnerIds.filter((id) => validIds.has(id) && id !== person.id);
      person.formerPartnerIds = person.formerPartnerIds.filter((id) => validIds.has(id) && id !== person.id && !person.partnerIds.includes(id));
      person.siblingIds = person.siblingIds.filter((id) => validIds.has(id) && id !== person.id);
      person.halfSiblingIds = person.halfSiblingIds.filter((id) => validIds.has(id) && id !== person.id);
      person.customRelations = person.customRelations.filter((relation) => {
        return validIds.has(relation.personId) && relation.personId !== person.id;
      });
    });

    tree.people.forEach((person) => {
      person.partnerIds.forEach((partnerId) => {
        const partner = tree.people.find((candidate) => candidate.id === partnerId);
        if (partner && !partner.partnerIds.includes(person.id)) {
          partner.partnerIds.push(person.id);
        }
      });

      person.formerPartnerIds.forEach((partnerId) => {
        const partner = tree.people.find((candidate) => candidate.id === partnerId);
        if (partner && !partner.formerPartnerIds.includes(person.id) && !partner.partnerIds.includes(person.id)) {
          partner.formerPartnerIds.push(person.id);
        }
      });

      person.siblingIds.forEach((siblingId) => {
        const sibling = tree.people.find((candidate) => candidate.id === siblingId);
        if (sibling && !sibling.siblingIds.includes(person.id)) {
          sibling.siblingIds.push(person.id);
        }
      });

      person.halfSiblingIds.forEach((siblingId) => {
        const sibling = tree.people.find((candidate) => candidate.id === siblingId);
        if (sibling && !sibling.halfSiblingIds.includes(person.id)) {
          sibling.halfSiblingIds.push(person.id);
        }
      });

      person.customRelations.forEach((relation) => {
        const linkedPerson = tree.people.find((candidate) => candidate.id === relation.personId);
        if (!linkedPerson) {
          return;
        }

        const exists = linkedPerson.customRelations.some((candidate) => {
          return candidate.personId === person.id &&
            candidate.label.toLowerCase() === relation.label.toLowerCase() &&
            candidate.direction === inverseCustomDirection(relation.direction);
        });

        if (!exists) {
          linkedPerson.customRelations.push({
            personId: person.id,
            label: relation.label,
            direction: inverseCustomDirection(relation.direction)
          });
        }
      });
    });

    tree.people.forEach((person) => {
      person.adoptiveParentIds = person.adoptiveParentIds.filter((id) => !person.parentIds.includes(id));
      person.formerPartnerIds = person.formerPartnerIds.filter((id) => !person.partnerIds.includes(id));
    });

    return tree;
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

  function load() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyTree();
    }

    try {
      return normalizeTree(JSON.parse(raw));
    } catch (error) {
      console.warn("Impossible de lire l’arbre sauvegardé.", error);
      return emptyTree();
    }
  }

  function save(tree) {
    const normalized = normalizeTree(tree);
    normalized.metadata.updatedAt = new Date().toISOString();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function clear() {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function download(tree) {
    const normalized = normalizeTree(tree);
    normalized.metadata.updatedAt = new Date().toISOString();

    const title = normalized.metadata.title || "arbre";
    const safeTitle = title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "arbre";

    const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeTitle}-genealogie.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function readImport(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        try {
          const parsed = JSON.parse(String(reader.result || ""));
          resolve(normalizeTree(parsed));
        } catch (error) {
          reject(new Error("Le fichier JSON n’a pas pu être lu."));
        }
      });

      reader.addEventListener("error", () => {
        reject(new Error("Le fichier n’a pas pu être ouvert."));
      });

      reader.readAsText(file);
    });
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function cleanText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  window.TreeStorage = {
    CURRENT_VERSION,
    STORAGE_KEY,
    clear,
    download,
    emptyTree,
    load,
    makeId,
    normalizeTree,
    save,
    readImport
  };
}());
