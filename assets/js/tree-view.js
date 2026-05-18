(function () {
  "use strict";

  const NODE_WIDTH = 270;
  const NODE_HEIGHT = 116;
  const GAP_X = 72;
  const GAP_Y = 122;
  const PADDING = 64;
  const BLOCK_GAP = 136;
  const PARTNER_GAP = 18;
  const FORMER_PARTNER_GAP = 46;

  function render(options) {
    const hiddenIds = new Set(options.hiddenIds || []);
    const people = (options.tree.people || []).filter((person) => !hiddenIds.has(person.id));
    const nodesEl = options.nodesEl;
    const svgEl = options.svgEl;

    nodesEl.innerHTML = "";
    svgEl.innerHTML = "";

    if (!people.length) {
      nodesEl.innerHTML = [
        "<div class=\"empty-tree\">",
        "<strong>Aucun membre</strong>",
        "<span class=\"empty-state\">Ajoutez une première fiche pour commencer l’arbre.</span>",
        "</div>"
      ].join("");
      options.surfaceEl.style.width = "600px";
      options.surfaceEl.style.height = "420px";
      svgEl.setAttribute("width", "600");
      svgEl.setAttribute("height", "420");
      return { width: 600, height: 420, minX: 0, minY: 0 };
    }

    const layout = createLayout(people);

    options.surfaceEl.style.width = `${layout.width}px`;
    options.surfaceEl.style.height = `${layout.height}px`;
    svgEl.setAttribute("width", String(layout.width));
    svgEl.setAttribute("height", String(layout.height));

    drawConnectors(svgEl, people, layout.positions);
    drawNodes(nodesEl, people, layout.positions, options);

    nodesEl.querySelectorAll(".tree-node").forEach((node) => {
      node.addEventListener("click", (event) => {
        if (event.target.closest(".node-branch-button")) {
          return;
        }
        options.onSelect(node.dataset.id, event);
      });
      node.addEventListener("keydown", (event) => {
        if (event.target.closest(".node-branch-button")) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          options.onSelect(node.dataset.id, event);
        }
      });
    });

    nodesEl.querySelectorAll(".node-branch-button").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (typeof options.onHideBranch === "function") {
          options.onHideBranch(button.dataset.id);
        }
      });
    });

    return { width: layout.width, height: layout.height, minX: layout.minX, minY: layout.minY };
  }

  function createLayout(people) {
    const generations = computeGenerations(people);
    const byId = new Map(people.map((person) => [person.id, person]));
    const rows = Array.from(generations.entries()).sort((a, b) => a[0] - b[0]);
    const positions = new Map();
    let minX = Infinity;
    let maxX = -Infinity;

    rows.forEach((entry, rowIndex) => {
      const blocks = buildLayoutBlocks(entry[1], byId, positions);
      const y = PADDING + rowIndex * (NODE_HEIGHT + GAP_Y);
      let cursor = blocks.some((block) => Number.isFinite(block.targetX)) ? -Infinity : 0;

      blocks.forEach((block) => {
        const desiredX = Number.isFinite(block.targetX) ? block.targetX - block.width / 2 : cursor;
        const blockX = Number.isFinite(cursor) ? Math.max(cursor, desiredX) : desiredX;

        block.items.forEach((item) => {
          const x = blockX + item.x;
          positions.set(item.person.id, {
            x,
            y,
            width: NODE_WIDTH,
            height: NODE_HEIGHT
          });
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x + NODE_WIDTH);
        });

        cursor = blockX + block.width + BLOCK_GAP;
      });
    });

    const offsetX = PADDING - minX;
    positions.forEach((position) => {
      position.x += offsetX;
    });

    applyManualPositions(people, positions);

    const bounds = measurePositions(positions);
    const contentMinX = bounds.minX - PADDING;
    const contentMinY = bounds.minY - PADDING;
    const width = Math.max(620, bounds.maxX - bounds.minX + PADDING * 2);
    const autoHeight = PADDING * 2 + rows.length * NODE_HEIGHT + Math.max(0, rows.length - 1) * GAP_Y;
    const height = Math.max(autoHeight, bounds.maxY - bounds.minY + PADDING * 2, 420);
    return { positions, width, height, minX: contentMinX, minY: contentMinY };
  }

  function applyManualPositions(people, positions) {
    people.forEach((person) => {
      if (!person.layout || person.layout.manual !== true) {
        return;
      }

      const x = Number(person.layout.x);
      const y = Number(person.layout.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }

      positions.set(person.id, {
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT
      });
    });
  }

  function measurePositions(positions) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = 0;
    let maxY = 0;

    positions.forEach((position) => {
      minX = Math.min(minX, position.x);
      minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + position.width);
      maxY = Math.max(maxY, position.y + position.height);
    });

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
      return { minX: 0, minY: 0, maxX, maxY };
    }

    return { minX, minY, maxX, maxY };
  }

  function buildLayoutBlocks(rowPeople, byId, positions) {
    const rowIds = new Set(rowPeople.map((person) => person.id));
    const families = createFamilyUnion(rowPeople.map((person) => person.id));
    const parentGroups = new Map();

    rowPeople.forEach((person) => {
      const parentIds = positionedParentIds(person, positions);
      if (parentIds.length) {
        const key = parentIds.join(":");
        if (!parentGroups.has(key)) {
          parentGroups.set(key, []);
        }
        parentGroups.get(key).push(person.id);
      }
    });

    parentGroups.forEach((ids) => {
      unionAll(families, ids);
    });

    rowPeople.forEach((person) => {
      getPartnerIds(person).forEach((partnerId) => {
        if (rowIds.has(partnerId)) {
          families.union(person.id, partnerId);
        }
      });

      [...(person.siblingIds || []), ...(person.halfSiblingIds || [])].forEach((siblingId) => {
        const sibling = byId.get(siblingId);
        if (rowIds.has(siblingId) && !positionedParentIds(person, positions).length && !positionedParentIds(sibling, positions).length) {
          families.union(person.id, siblingId);
        }
      });
    });

    const grouped = new Map();
    rowPeople.forEach((person) => {
      const root = families.find(person.id);
      if (!grouped.has(root)) {
        grouped.set(root, []);
      }
      grouped.get(root).push(person);
    });

    return Array.from(grouped.values())
      .map((members) => createLayoutBlock(members, byId, positions))
      .sort(compareBlocks);
  }

  function createLayoutBlock(members, byId, positions) {
    const ordered = orderBlockMembers(members, byId, positions);
    const items = [];
    let x = 0;

    ordered.forEach((person, index) => {
      items.push({ person, x });

      const nextPerson = ordered[index + 1];
      if (nextPerson) {
        x += NODE_WIDTH + relationGap(person, nextPerson);
      }
    });

    const parentCenters = members.flatMap((person) => {
      return positionedParentIds(person, positions).map((parentId) => centerX(positions.get(parentId)));
    });

    return {
      items,
      sortName: ordered.map(getDisplayName).join(" "),
      targetX: parentCenters.length ? average(parentCenters) : Number.NaN,
      width: items.length ? items[items.length - 1].x + NODE_WIDTH : NODE_WIDTH
    };
  }

  function orderBlockMembers(members, byId, positions) {
    const memberIds = new Set(members.map((person) => person.id));
    const visited = new Set();
    const ordered = [];
    const sorted = members.slice().sort((first, second) => {
      const firstHasParents = positionedParentIds(first, positions).length ? 0 : 1;
      const secondHasParents = positionedParentIds(second, positions).length ? 0 : 1;
      return firstHasParents - secondHasParents || comparePeople(first, second);
    });

    sorted.forEach((person) => {
      if (visited.has(person.id)) {
        return;
      }

      const partners = getPartnerIds(person)
        .map((partnerId) => byId.get(partnerId))
        .filter((partner) => partner && memberIds.has(partner.id) && !visited.has(partner.id))
        .sort(comparePeople);

      if (partners.length) {
        const pair = orderCouple(person, partners[0]);
        pair.forEach((candidate) => {
          if (!visited.has(candidate.id)) {
            ordered.push(candidate);
            visited.add(candidate.id);
          }
        });

        partners.slice(1).forEach((partner) => {
          if (!visited.has(partner.id)) {
            ordered.push(partner);
            visited.add(partner.id);
          }
        });
        return;
      }

      ordered.push(person);
      visited.add(person.id);
    });

    return ordered;
  }

  function createFamilyUnion(ids) {
    const parents = new Map(ids.map((id) => [id, id]));

    function find(id) {
      const parent = parents.get(id);
      if (parent === id) {
        return id;
      }

      const root = find(parent);
      parents.set(id, root);
      return root;
    }

    function union(firstId, secondId) {
      const firstRoot = find(firstId);
      const secondRoot = find(secondId);

      if (firstRoot !== secondRoot) {
        parents.set(secondRoot, firstRoot);
      }
    }

    return { find, union };
  }

  function unionAll(unionSet, ids) {
    ids.slice(1).forEach((id) => {
      unionSet.union(ids[0], id);
    });
  }

  function positionedParentIds(person, positions) {
    if (!person) {
      return [];
    }

    return Array.from(new Set([
      ...(person.parentIds || []),
      ...(person.adoptiveParentIds || [])
    ].filter((parentId) => positions.has(parentId)))).sort();
  }

  function getParentLikeIds(person) {
    const customParents = (person.customRelations || [])
      .filter((relation) => relation.direction === "up")
      .map((relation) => relation.personId);

    return Array.from(new Set([
      ...(person.parentIds || []),
      ...(person.adoptiveParentIds || []),
      ...customParents
    ]));
  }

  function compareBlocks(first, second) {
    const firstHasTarget = Number.isFinite(first.targetX);
    const secondHasTarget = Number.isFinite(second.targetX);

    if (firstHasTarget && secondHasTarget && Math.abs(first.targetX - second.targetX) > 1) {
      return first.targetX - second.targetX;
    }
    if (firstHasTarget !== secondHasTarget) {
      return firstHasTarget ? -1 : 1;
    }

    return first.sortName.localeCompare(second.sortName, "fr", { sensitivity: "base" });
  }

  function arePartners(first, second) {
    return (first.partnerIds || []).includes(second.id) || (second.partnerIds || []).includes(first.id);
  }

  function areFormerPartners(first, second) {
    return (first.formerPartnerIds || []).includes(second.id) || (second.formerPartnerIds || []).includes(first.id);
  }

  function getPartnerIds(person) {
    return Array.from(new Set([...(person.partnerIds || []), ...(person.formerPartnerIds || [])]));
  }

  function relationGap(first, second) {
    if (arePartners(first, second)) {
      return PARTNER_GAP;
    }
    if (areFormerPartners(first, second)) {
      return FORMER_PARTNER_GAP;
    }

    return GAP_X;
  }

  function orderCouple(first, second) {
    if (first.gender === "male" && second.gender === "female") {
      return [first, second];
    }
    if (first.gender === "female" && second.gender === "male") {
      return [second, first];
    }

    return comparePeople(first, second) <= 0 ? [first, second] : [second, first];
  }

  function computeGenerations(people) {
    const byId = new Map(people.map((person) => [person.id, person]));
    const cache = new Map();

    function baseGeneration(personId, stack) {
      if (cache.has(personId)) {
        return cache.get(personId);
      }

      const person = byId.get(personId);
      if (!person || stack.has(personId)) {
        return 0;
      }

      const parents = getParentLikeIds(person).filter((id) => byId.has(id));
      if (!parents.length) {
        cache.set(personId, 0);
        return 0;
      }

      stack.add(personId);
      const generation = 1 + Math.max(...parents.map((parentId) => baseGeneration(parentId, stack)));
      stack.delete(personId);
      cache.set(personId, generation);
      return generation;
    }

    const generations = new Map();

    people.forEach((person) => {
      generations.set(person.id, baseGeneration(person.id, new Set()));
    });

    for (let index = 0; index < people.length * 4; index += 1) {
      let changed = false;

      people.forEach((person) => {
        getParentLikeIds(person).forEach((parentId) => {
          if (!generations.has(parentId)) {
            return;
          }

          const neededGeneration = generations.get(parentId) + 1;
          if (generations.get(person.id) < neededGeneration) {
            generations.set(person.id, neededGeneration);
            changed = true;
          }
        });
      });

      people.forEach((person) => {
        getPartnerIds(person).forEach((partnerId) => {
          if (!generations.has(partnerId)) {
            return;
          }

          const targetGeneration = Math.max(generations.get(person.id), generations.get(partnerId));
          if (generations.get(person.id) !== targetGeneration) {
            generations.set(person.id, targetGeneration);
            changed = true;
          }
          if (generations.get(partnerId) !== targetGeneration) {
            generations.set(partnerId, targetGeneration);
            changed = true;
          }
        });
      });

      people.forEach((person) => {
        [...(person.siblingIds || []), ...(person.halfSiblingIds || [])].forEach((siblingId) => {
          if (!generations.has(siblingId)) {
            return;
          }

          const targetGeneration = Math.max(generations.get(person.id), generations.get(siblingId));
          if (generations.get(person.id) !== targetGeneration) {
            generations.set(person.id, targetGeneration);
            changed = true;
          }
          if (generations.get(siblingId) !== targetGeneration) {
            generations.set(siblingId, targetGeneration);
            changed = true;
          }
        });
      });

      if (!changed) {
        break;
      }
    }

    const grouped = new Map();
    people.forEach((person) => {
      const generation = generations.get(person.id) || 0;
      if (!grouped.has(generation)) {
        grouped.set(generation, []);
      }
      grouped.get(generation).push(person);
    });

    return grouped;
  }

  function drawConnectors(svgEl, people, positions) {
    drawParentGroups(svgEl, people, positions);
    drawPartnerLines(svgEl, people, positions, "partnerIds", "partner-line");
    drawPartnerLines(svgEl, people, positions, "formerPartnerIds", "former-partner-line");
    // drawPairLines(svgEl, people, positions, "siblingIds", "sibling-line");
    drawPairLines(svgEl, people, positions, "halfSiblingIds", "half-sibling-line");
    drawCustomLines(svgEl, people, positions);
  }

  function drawPartnerLines(svgEl, people, positions, fieldName, className) {
    const byId = new Map(people.map((person) => [person.id, person]));
    const pairs = new Set();

    people.forEach((person) => {
      (person[fieldName] || []).forEach((partnerId) => {
        if (!byId.has(partnerId)) {
          return;
        }

        const key = [person.id, partnerId].sort().join(":");
        if (pairs.has(key)) {
          return;
        }
        pairs.add(key);

        const first = positions.get(person.id);
        const second = positions.get(partnerId);
        if (!first || !second) {
          return;
        }

        const line = createSvg("path");
        line.setAttribute("class", className);
        line.setAttribute("d", makePairPath(first, second, 24 + (pairs.size % 4) * 9));

        svgEl.appendChild(line);
      });
    });
  }

  function drawParentGroups(svgEl, people, positions) {
    const groups = new Map();

    people.forEach((child) => {
      const childPosition = positions.get(child.id);
      if (!childPosition) {
        return;
      }

      addParentGroupEntry(groups, child, child.parentIds || [], false, positions);
      addParentGroupEntry(groups, child, child.adoptiveParentIds || [], true, positions);
    });

    Array.from(groups.values())
      .sort((first, second) => groupCenter(first, positions) - groupCenter(second, positions))
      .forEach((group, index) => {
        drawParentGroup(svgEl, group, positions, index);
      });
  }

  function addParentGroupEntry(groups, child, rawParentIds, adopted, positions) {
    const parentIds = Array.from(new Set(rawParentIds.filter((parentId) => {
      return parentId !== child.id && positions.has(parentId);
    }))).sort();

    if (!parentIds.length) {
      return;
    }

    const key = parentIds.join(":");
    if (!groups.has(key)) {
      groups.set(key, {
        parentIds,
        children: []
      });
    }

    const group = groups.get(key);
    const exists = group.children.some((entry) => entry.person.id === child.id && entry.adopted === adopted);
    if (!exists) {
      group.children.push({ person: child, adopted });
    }
  }

  function groupCenter(group, positions) {
    const centers = group.parentIds
      .map((parentId) => positions.get(parentId))
      .filter(Boolean)
      .map(centerX);

    return centers.length ? average(centers) : 0;
  }

  function drawParentGroup(svgEl, group, positions, groupIndex) {
    const parentRects = group.parentIds
      .map((parentId) => positions.get(parentId))
      .filter(Boolean);
    const childEntries = group.children
      .map((entry) => ({
        adopted: entry.adopted,
        person: entry.person,
        rect: positions.get(entry.person.id)
      }))
      .filter((entry) => entry.rect)
      .sort((first, second) => centerX(first.rect) - centerX(second.rect));
    const childRects = childEntries.map((entry) => entry.rect);

    if (!parentRects.length || !childRects.length) {
      return;
    }

    const groupIsAdoptive = childEntries.every((entry) => entry.adopted);
    const parentClass = groupIsAdoptive ? "connector adoption-line" : "connector";
    const parentBottomY = Math.max(...parentRects.map((rect) => rect.y + rect.height));
    const childTopY = Math.min(...childRects.map((rect) => rect.y));
    const joinX = average(parentRects.map(centerX));
    const verticalGap = childTopY - parentBottomY;
    const laneOffset = clamp(verticalGap * 0.3, 24, 42);
    const parentLaneY = verticalGap > 64 ? parentBottomY + laneOffset : parentBottomY + 24 + (groupIndex % 3) * 8;
    const branchOffset = clamp(verticalGap * 0.28, 28, 46) + (groupIndex % 3) * 6;
    const branchY = verticalGap > 64
      ? clamp(childTopY - branchOffset, parentLaneY + 20, childTopY - 18)
      : parentLaneY + 24;
    const childCenterX = average(childRects.map(centerX));

    parentRects.forEach((parentRect) => {
      const parentPath = createSvg("path");
      parentPath.setAttribute("class", parentClass);
      parentPath.setAttribute("d", makeParentLanePath(centerX(parentRect), parentRect.y + parentRect.height, joinX, parentLaneY));
      svgEl.appendChild(parentPath);
    });

    if (childRects.length === 1) {
      const childEntry = childEntries[0];
      const childRect = childEntry.rect;
      const path = createSvg("path");

      path.setAttribute("class", childEntry.adopted ? "connector adoption-line" : "connector");
      path.setAttribute("d", makeChildLanePath(joinX, parentLaneY, centerX(childRect), childRect.y, branchY));
      svgEl.appendChild(path);
      return;
    }

    const trunk = createSvg("path");
    trunk.setAttribute("class", `${parentClass} family-trunk`);
    trunk.setAttribute("d", makeChildLanePath(joinX, parentLaneY, childCenterX, branchY, branchY));
    svgEl.appendChild(trunk);

    const branch = createSvg("path");
    branch.setAttribute("class", `${parentClass} family-branch`);
    branch.setAttribute("d", makeHorizontalConnectorPath(centerX(childRects[0]), branchY, centerX(childRects[childRects.length - 1]), branchY));
    svgEl.appendChild(branch);

    childEntries.forEach((childEntry) => {
      const childPath = createSvg("path");
      childPath.setAttribute("class", childEntry.adopted ? "connector adoption-line" : "connector");
      childPath.setAttribute("d", makeVerticalConnectorPath(centerX(childEntry.rect), branchY, centerX(childEntry.rect), childEntry.rect.y, 0));
      svgEl.appendChild(childPath);
    });
  }

  function drawPairLines(svgEl, people, positions, fieldName, className, options) {
    const byId = new Map(people.map((person) => [person.id, person]));
    const pairs = new Set();
    const settings = options || {};

    people.forEach((person) => {
      (person[fieldName] || []).forEach((linkedId) => {
        const linkedPerson = byId.get(linkedId);
        if (!linkedPerson) {
          return;
        }

        const key = [person.id, linkedId].sort().join(":");
        if (pairs.has(key)) {
          return;
        }
        pairs.add(key);

        if (settings.skipSharedParents && shareParents(person, linkedPerson)) {
          return;
        }

        const first = positions.get(person.id);
        const second = positions.get(linkedId);
        if (!first || !second) {
          return;
        }

        const line = createSvg("path");
        line.setAttribute("class", className);
        line.setAttribute("d", makePairPath(first, second, 28 + (pairs.size % 4) * 9));
        svgEl.appendChild(line);
      });
    });
  }

  function drawCustomLines(svgEl, people, positions) {
    const byId = new Map(people.map((person) => [person.id, person]));
    const pairs = new Set();

    people.forEach((person) => {
      (person.customRelations || []).forEach((relation) => {
        if (!byId.has(relation.personId)) {
          return;
        }

        const direction = relation.direction || "same";
        const key = canonicalCustomKey(person.id, relation.personId, relation.label, direction);
        if (pairs.has(key)) {
          return;
        }
        pairs.add(key);

        const first = positions.get(person.id);
        const second = positions.get(relation.personId);
        if (!first || !second) {
          return;
        }

        const line = createSvg("path");
        line.setAttribute("class", `custom-line custom-line-${direction}`);
        line.setAttribute("d", makeCustomPath(first, second, direction, 32 + (pairs.size % 4) * 9));
        svgEl.appendChild(line);
      });
    });
  }

  function canonicalCustomKey(firstId, secondId, label, direction) {
    const ordered = [firstId, secondId].sort();
    const canonicalDirection = firstId === ordered[0] ? direction : inverseCustomDirection(direction);
    return `${ordered.join(":")}:${label.toLowerCase()}:${canonicalDirection}`;
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

  function makeCustomPath(first, second, direction, offset) {
    if (direction === "same") {
      return makePairPath(first, second, offset);
    }

    const startX = first.x + first.width / 2;
    const endX = second.x + second.width / 2;
    const startY = direction === "down" ? first.y + first.height : first.y;
    const endY = direction === "down" ? second.y : second.y + second.height;
    return makeVerticalConnectorPath(startX, startY, endX, endY, offset / 3);
  }

  function makePairPath(first, second, offset) {
    if (Math.abs(first.y - second.y) < 2) {
      const left = centerX(first) <= centerX(second) ? first : second;
      const right = left === first ? second : first;
      const startX = left.x + left.width;
      const endX = right.x;
      const y = (centerY(left) + centerY(right)) / 2;

      if (endX > startX) {
        return makeHorizontalConnectorPath(startX, y, endX, y);
      }

      return makeSameLevelRoutedPath(
        left.x + left.width / 2,
        left.y + left.height,
        right.x + right.width / 2,
        right.y + right.height,
        offset
      );
    }

    const upper = first.y <= second.y ? first : second;
    const lower = first.y <= second.y ? second : first;
    return makeVerticalConnectorPath(
      upper.x + upper.width / 2,
      upper.y + upper.height,
      lower.x + lower.width / 2,
      lower.y,
      offset / 2
    );
  }

  function makeHorizontalConnectorPath(startX, startY, endX, endY) {
    return makeRoundedConnectorPath([
      { x: startX, y: startY },
      { x: endX, y: endY }
    ]);
  }

  function makeSameLevelRoutedPath(startX, startY, endX, endY, offset) {
    const laneY = Math.max(startY, endY) + offset;
    return makeRoundedConnectorPath([
      { x: startX, y: startY },
      { x: startX, y: laneY },
      { x: endX, y: laneY },
      { x: endX, y: endY }
    ]);
  }

  function makeParentLanePath(startX, startY, endX, laneY) {
    return makeRoundedConnectorPath([
      { x: startX, y: startY },
      { x: startX, y: laneY },
      { x: endX, y: laneY }
    ]);
  }

  function makeChildLanePath(startX, startY, endX, endY, laneY) {
    return makeRoundedConnectorPath([
      { x: startX, y: startY },
      { x: startX, y: laneY },
      { x: endX, y: laneY },
      { x: endX, y: endY }
    ]);
  }

  function makeVerticalConnectorPath(startX, startY, endX, endY, offset) {
    const direction = endY >= startY ? 1 : -1;
    const midY = (startY + endY) / 2 + offset * direction;
    return makeRoundedConnectorPath([
      { x: startX, y: startY },
      { x: startX, y: midY },
      { x: endX, y: midY },
      { x: endX, y: endY }
    ]);
  }

  function makeRoundedConnectorPath(points) {
    const radius = 10;
    const cleaned = simplifyConnectorPoints(points);

    if (!cleaned.length) {
      return "";
    }
    if (cleaned.length === 1) {
      return `M ${formatCoord(cleaned[0].x)} ${formatCoord(cleaned[0].y)}`;
    }

    const commands = [`M ${formatCoord(cleaned[0].x)} ${formatCoord(cleaned[0].y)}`];

    for (let index = 1; index < cleaned.length - 1; index += 1) {
      const previous = cleaned[index - 1];
      const current = cleaned[index];
      const next = cleaned[index + 1];
      const previousDistance = distance(previous, current);
      const nextDistance = distance(current, next);
      const cornerRadius = Math.min(radius, previousDistance / 2, nextDistance / 2);

      if (cornerRadius <= 0 || isCollinear(previous, current, next)) {
        commands.push(`L ${formatCoord(current.x)} ${formatCoord(current.y)}`);
        continue;
      }

      const beforeCorner = moveToward(current, previous, cornerRadius);
      const afterCorner = moveToward(current, next, cornerRadius);
      commands.push(`L ${formatCoord(beforeCorner.x)} ${formatCoord(beforeCorner.y)}`);
      commands.push(`Q ${formatCoord(current.x)} ${formatCoord(current.y)} ${formatCoord(afterCorner.x)} ${formatCoord(afterCorner.y)}`);
    }

    const last = cleaned[cleaned.length - 1];
    commands.push(`L ${formatCoord(last.x)} ${formatCoord(last.y)}`);
    return commands.join(" ");
  }

  function simplifyConnectorPoints(points) {
    const cleaned = [];

    points.forEach((point) => {
      const previous = cleaned[cleaned.length - 1];
      if (!previous || Math.abs(previous.x - point.x) > 0.01 || Math.abs(previous.y - point.y) > 0.01) {
        cleaned.push(point);
      }
    });

    return cleaned.filter((point, index) => {
      if (index === 0 || index === cleaned.length - 1) {
        return true;
      }

      return !isCollinear(cleaned[index - 1], point, cleaned[index + 1]);
    });
  }

  function isCollinear(first, second, third) {
    return (Math.abs(first.x - second.x) < 0.01 && Math.abs(second.x - third.x) < 0.01) ||
      (Math.abs(first.y - second.y) < 0.01 && Math.abs(second.y - third.y) < 0.01);
  }

  function distance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function moveToward(from, to, amount) {
    const total = distance(from, to);
    if (!total) {
      return from;
    }

    return {
      x: from.x + (to.x - from.x) / total * amount,
      y: from.y + (to.y - from.y) / total * amount
    };
  }

  function formatCoord(value) {
    return String(Math.round(value * 100) / 100);
  }

  function shareParents(first, second) {
    const firstParents = new Set([...(first.parentIds || []), ...(first.adoptiveParentIds || [])]);
    return [...(second.parentIds || []), ...(second.adoptiveParentIds || [])].some((parentId) => firstParents.has(parentId));
  }

  function centerX(rect) {
    return rect.x + rect.width / 2;
  }

  function centerY(rect) {
    return rect.y + rect.height / 2;
  }

  function average(values) {
    if (!values.length) {
      return 0;
    }

    return values.reduce((total, value) => total + value, 0) / values.length;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function drawNodes(nodesEl, people, positions, options) {
    const fragment = document.createDocumentFragment();
    const selectedIds = new Set(options.selectedIds || []);
    const maskedBranchRootIds = new Set(options.maskedBranchRootIds || []);

    people.forEach((person) => {
      const position = positions.get(person.id);
      if (!position) {
        return;
      }

      const branchMasked = maskedBranchRootIds.has(person.id);
      const node = document.createElement("article");
      node.className = [
        "tree-node",
        person.id === options.selectedId ? "selected" : "",
        selectedIds.has(person.id) ? "multi-selected" : "",
        person.id === options.linkSourceId ? "link-source" : "",
        branchMasked ? "branch-collapsed" : "",
        person.layout && person.layout.manual ? "manual-position" : ""
      ].filter(Boolean).join(" ");
      node.dataset.id = person.id;
      node.style.left = `${position.x}px`;
      node.style.top = `${position.y}px`;
      node.tabIndex = 0;
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", `Ouvrir la fiche de ${getDisplayName(person)}${branchMasked ? ", branche masquee" : ""}`);

      node.innerHTML = [
        renderBranchButton(person, branchMasked),
        renderGenderSymbol(person),
        renderNodeAvatar(person),
        `<div class="node-name">${escapeHtml(getDisplayName(person))}</div>`,
        `<div class="node-meta">${escapeHtml(formatLifeDates(person))}</div>`,
        `<div class="node-place">${escapeHtml(person.birthPlace || person.currentPlace || "")}</div>`,
        renderTags(person)
      ].join("");

      if (typeof options.onDragStart === "function") {
        node.addEventListener("pointerdown", (event) => {
          options.onDragStart(event, person.id, position);
        });
      }

      fragment.appendChild(node);
    });

    nodesEl.appendChild(fragment);
  }

  function renderBranchButton(person, branchMasked) {
    if (!person) {
      return "";
    }

    const activeClass = branchMasked ? " is-active" : "";
    const title = branchMasked ? "Demasquer cette branche" : "Masquer cette branche";
    const symbol = branchMasked ? "&plus;" : "&times;";
    return `<button class="node-branch-button${activeClass}" type="button" data-id="${escapeAttribute(person.id)}" title="${escapeAttribute(title)}" aria-label="${escapeAttribute(title)}">${symbol}</button>`;
  }

  function renderNodeAvatar(person) {
    if (person.photo) {
      return `<span class="node-avatar"><img src="${escapeAttribute(person.photo)}" alt=""></span>`;
    }

    return `<span class="node-avatar">${escapeHtml(getInitials(person))}</span>`;
  }

  function renderGenderSymbol(person) {
    if (person.gender === "male") {
      return "<span class=\"gender-symbol male\" aria-label=\"Homme\">♂</span>";
    }
    if (person.gender === "female") {
      return "<span class=\"gender-symbol female\" aria-label=\"Femme\">♀</span>";
    }

    return "";
  }

  function renderTags(person) {
    const tags = [];

    if (person.occupation) {
      tags.push(person.occupation);
    }
    if (person.currentPlace && person.currentPlace !== person.birthPlace) {
      tags.push(person.currentPlace);
    }

    if (!tags.length) {
      return "<div class=\"node-tags\"></div>";
    }

    return `<div class="node-tags">${tags.slice(0, 2).map((tag) => `<span class="node-tag">${escapeHtml(tag)}</span>`).join("")}</div>`;
  }

  function comparePeople(first, second) {
    const firstName = `${first.lastName || ""} ${first.firstName || ""} ${getDisplayName(first)} ${first.birthDate || ""}`;
    const secondName = `${second.lastName || ""} ${second.firstName || ""} ${getDisplayName(second)} ${second.birthDate || ""}`;
    return firstName.localeCompare(secondName, "fr", { sensitivity: "base" });
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

    return "Dates à compléter";
  }

  function formatPartialDate(value) {
    const text = String(value || "").trim();
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

  function getDisplayName(person) {
    return buildDisplayName(person.firstName || "", person.lastName || "");
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

  function bornLabel(gender) {
    if (gender === "male") {
      return "né";
    }
    if (gender === "female") {
      return "née";
    }

    return "né(e)";
  }

  function createSvg(tagName) {
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
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

  window.TreeView = {
    render,
    constants: {
      NODE_WIDTH,
      NODE_HEIGHT
    }
  };
}());
