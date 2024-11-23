// Check authentication
function checkAuth() {
  const currentUser = localStorage.getItem("currentUser");
  const authContainer = document.getElementById("auth-container");
  const appContainer = document.getElementById("app-container");

  if (!currentUser) {
    authContainer.style.display = "flex";
    appContainer.style.display = "none";
    return false;
  }

  const user = JSON.parse(currentUser);
  document.getElementById("user-name").textContent = user.name;
  authContainer.style.display = "none";
  appContainer.style.display = "block";
  return true;
}

// Logout functionality
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.reload();
});

// Update assignee dropdown with registered users
function updateAssigneeDropdown() {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const assigneeSelect = document.getElementById("card-assignee");

  while (assigneeSelect.options.length > 1) {
    assigneeSelect.remove(1);
  }

  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = user.name;
    assigneeSelect.appendChild(option);
  });
}

// DOM Elements
const container = document.getElementById("kanban-container");
const cardModal = document.getElementById("card-modal");
const cardTitleInput = document.getElementById("card-title");
const cardDescriptionInput = document.getElementById("card-description");
const cardAssigneeInput = document.getElementById("card-assignee");
const saveCardBtn = document.getElementById("save-card-btn");
const cancelCardBtn = document.getElementById("cancel-card-btn");
const newColumnInput = document.getElementById("new-column-input");
const createColumnBtn = document.getElementById("create-column-btn");
const addListTrigger = document.getElementById("add-list-trigger");
const addListForm = document.getElementById("add-list-form");
const cancelAddList = document.getElementById("cancel-add-list");

// State Variables
let currentEditingCard = null;
let currentEditingColumn = null;
let draggedElement = null;
let draggedType = null;

// Default board structure
const defaultBoard = [
  { id: "todo", title: "To Do", cards: [] },
  { id: "in-progress", title: "In Progress", cards: [] },
  { id: "done", title: "Done", cards: [] },
];

// Load board from local storage
function getBoard() {
  const storedBoard = localStorage.getItem("kanbanBoard");
  try {
    const parsedBoard = JSON.parse(storedBoard);
    return Array.isArray(parsedBoard) ? parsedBoard : defaultBoard;
  } catch (error) {
    console.error("Failed to parse board data:", error);
    return defaultBoard;
  }
}

// Initialize board
let board = getBoard();

// Save board to localStorage
function saveBoard() {
  localStorage.setItem("kanbanBoard", JSON.stringify(board));
}

// Add Column functionality
function showAddListForm() {
  addListTrigger.style.display = "none";
  addListForm.style.display = "block";
  newColumnInput.focus();
}

function hideAddListForm() {
  addListTrigger.style.display = "block";
  addListForm.style.display = "none";
  newColumnInput.value = "";
}

addListTrigger.addEventListener("click", showAddListForm);
cancelAddList.addEventListener("click", hideAddListForm);

// Update the existing create column functionality
createColumnBtn.addEventListener("click", () => {
  const columnName = newColumnInput.value.trim();
  if (columnName) {
    const newColumn = {
      id: `column-${Date.now()}`,
      title: columnName,
      cards: [],
    };
    board.push(newColumn);
    renderBoard();
    saveBoard();
    hideAddListForm();
  }
});

// Handle Enter key in input
newColumnInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    createColumnBtn.click();
  }
});

// Handle click outside to close
document.addEventListener("click", (e) => {
  if (!addListForm.contains(e.target) && !addListTrigger.contains(e.target)) {
    hideAddListForm();
  }
});

// Open card modal
function openCardModal(card, column) {
  currentEditingCard = card;
  currentEditingColumn = column;

  updateAssigneeDropdown();

  if (card) {
    cardTitleInput.value = card.title;
    cardDescriptionInput.value = card.description || "";
    cardAssigneeInput.value = card.assigneeId || "";
  } else {
    cardTitleInput.value = "";
    cardDescriptionInput.value = "";
    cardAssigneeInput.value = "";
  }

  cardModal.style.display = "flex";
}

// Save card
function saveCard() {
  const title = cardTitleInput.value.trim();
  const description = cardDescriptionInput.value.trim();
  const assigneeId = cardAssigneeInput.value;

  if (!title) return;

  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const assignee = users.find((user) => user.id === assigneeId);
  const assigneeName = assignee ? assignee.name : "";

  if (currentEditingCard) {
    currentEditingCard.title = title;
    currentEditingCard.description = description;
    currentEditingCard.assigneeId = assigneeId;
    currentEditingCard.assigneeName = assigneeName;
  } else {
    const newCard = {
      id: Date.now().toString(),
      title,
      description,
      assigneeId,
      assigneeName,
      createdBy: JSON.parse(localStorage.getItem("currentUser")).id,
      createdAt: new Date().toISOString(),
    };
    currentEditingColumn.cards.push(newCard);
  }

  renderBoard();
  saveBoard();
  cardModal.style.display = "none";
}

// Create column header
function createColumnHeader(column) {
  const headerDiv = document.createElement("div");
  headerDiv.className = "column-header";
  headerDiv.draggable = true;

  const titleInput = document.createElement("input");
  titleInput.value = column.title;
  titleInput.className = "editable-title";
  titleInput.setAttribute("type", "text");

  const removeColumnBtn = document.createElement("button");
  removeColumnBtn.textContent = "✕";
  removeColumnBtn.className = "remove-column-btn";

  removeColumnBtn.addEventListener("click", () => {
    board = board.filter((col) => col.id !== column.id);
    renderBoard();
    saveBoard();
  });

  // Column Drag Events
  headerDiv.addEventListener("dragstart", (e) => {
    draggedElement = column;
    draggedType = "column";
    e.dataTransfer.setData("text/plain", "column:" + column.id);
    setTimeout(() => {
      headerDiv.closest(".column").classList.add("dragging");
    }, 0);
  });

  headerDiv.addEventListener("dragend", () => {
    headerDiv.closest(".column").classList.remove("dragging");
    draggedElement = null;
    draggedType = null;
  });

  titleInput.addEventListener("blur", () => {
    column.title = titleInput.value;
    saveBoard();
  });

  headerDiv.appendChild(titleInput);
  headerDiv.appendChild(removeColumnBtn);
  return headerDiv;
}

// Create card
function createCard(card, column) {
  const cardElement = document.createElement("div");
  cardElement.className = "card";
  cardElement.draggable = true;

  const titleElement = document.createElement("div");
  titleElement.className = "card-title";
  titleElement.textContent = card.title;

  const assigneeElement = document.createElement("div");
  assigneeElement.className = "card-assignee";
  assigneeElement.textContent = card.assigneeName
    ? `Assigned to: ${card.assigneeName}`
    : "Unassigned";

  cardElement.appendChild(titleElement);
  cardElement.appendChild(assigneeElement);

  cardElement.addEventListener("click", () => openCardModal(card, column));

  cardElement.addEventListener("dragstart", (e) => {
    draggedElement = card;
    draggedType = "card";
    // Continuing from the last card dragstart event...
    e.dataTransfer.setData("text/plain", "card:" + card.id);
    setTimeout(() => {
      cardElement.classList.add("dragging");
    }, 0);
  });

  cardElement.addEventListener("dragend", () => {
    cardElement.classList.remove("dragging");
    draggedElement = null;
    draggedType = null;
  });

  return cardElement;
}

// Create add card button
function createAddCardButton(column) {
  const addCardBtn = document.createElement("button");
  addCardBtn.textContent = "+ Add Card";
  addCardBtn.className = "add-card-btn";
  addCardBtn.addEventListener("click", () => openCardModal(null, column));
  return addCardBtn;
}

// Handle column reordering
function handleColumnDrop(targetColumn) {
  const sourceIndex = board.findIndex((col) => col.id === draggedElement.id);
  const targetIndex = board.findIndex((col) => col.id === targetColumn.id);

  if (sourceIndex !== -1 && targetIndex !== -1) {
    // Remove the column from its current position
    const [movedColumn] = board.splice(sourceIndex, 1);
    // Insert it at the new position
    board.splice(targetIndex, 0, movedColumn);
    renderBoard();
    saveBoard();
  }
}

// Handle card movement
function handleCardDrop(targetColumn) {
  const sourceColumn = board.find((col) =>
    col.cards.some((card) => card.id === draggedElement.id)
  );

  if (sourceColumn && targetColumn) {
    // Remove card from source column
    const cardIndex = sourceColumn.cards.findIndex(
      (card) => card.id === draggedElement.id
    );
    const [movedCard] = sourceColumn.cards.splice(cardIndex, 1);
    // Add card to target column
    targetColumn.cards.push(movedCard);
    renderBoard();
    saveBoard();
  }
}

// Render board
function renderBoard() {
  if (!checkAuth()) return;

  container.innerHTML = "";

  board.forEach((column) => {
    const columnDiv = document.createElement("div");
    columnDiv.className = "column";
    columnDiv.setAttribute("data-column-id", column.id);

    columnDiv.appendChild(createColumnHeader(column));

    const cardsContainer = document.createElement("div");
    cardsContainer.className = "cards-container";

    column.cards.forEach((card) => {
      cardsContainer.appendChild(createCard(card, column));
    });

    columnDiv.appendChild(cardsContainer);
    columnDiv.appendChild(createAddCardButton(column));

    // Column drag and drop handlers
    columnDiv.addEventListener("dragover", (e) => {
      e.preventDefault();
      columnDiv.classList.add("drag-over");
    });

    columnDiv.addEventListener("dragleave", () => {
      columnDiv.classList.remove("drag-over");
    });

    columnDiv.addEventListener("drop", (e) => {
      e.preventDefault();
      columnDiv.classList.remove("drag-over");

      if (!draggedElement) return;

      if (draggedType === "column") {
        handleColumnDrop(column);
      } else if (draggedType === "card") {
        handleCardDrop(column);
      }
    });

    container.appendChild(columnDiv);
  });
}

// Initialize the board
renderBoard();

// Modal event listeners
cancelCardBtn.addEventListener("click", () => {
  cardModal.style.display = "none";
  currentEditingCard = null;
  currentEditingColumn = null;
});

saveCardBtn.addEventListener("click", saveCard);

// Create column functionality
createColumnBtn.addEventListener("click", () => {
  const columnName = newColumnInput.value.trim();
  if (columnName) {
    const newColumn = {
      id: `column-${Date.now()}`,
      title: columnName,
      cards: [],
    };
    board.push(newColumn);
    renderBoard();
    saveBoard();
    newColumnInput.value = "";
  }
});
