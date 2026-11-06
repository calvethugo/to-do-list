// TASK CONSOLE // operações locais
// Mantém compatibilidade com os registros antigos em localStorage ("todos").

const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const editForm = document.querySelector("#edit-form");
const editInput = document.querySelector("#edit-input");
const cancelEditBtn = document.querySelector("#cancel-edit-btn");
const searchInput = document.querySelector("#search-input");
const eraseBtn = document.querySelector("#erase-button");
const filterSelect = document.querySelector("#filter-select");
const taskCount = document.querySelector("#task-count");
const emptyState = document.querySelector("#empty-state");
const progressPercent = document.querySelector("#progress-percent");
const progressBar = document.querySelector("#progress-bar");
const progressCompleted = document.querySelector("#progress-completed");
const progressTotal = document.querySelector("#progress-total");

let editingId = null;

function createId() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTodos() {
  try {
    const todos = JSON.parse(localStorage.getItem("todos") || "[]");
    if (!Array.isArray(todos)) return [];
    let changed = false;
    const normalized = todos.map((todo) => {
      if (todo && typeof todo === "object") {
        if (!todo.id) { todo.id = createId(); changed = true; }
        return { id: String(todo.id), text: String(todo.text ?? ""), done: Boolean(todo.done) };
      }
      changed = true;
      return { id: createId(), text: String(todo ?? ""), done: false };
    });
    if (changed) localStorage.setItem("todos", JSON.stringify(normalized));
    return normalized.filter((todo) => todo.text.trim().length > 0);
  } catch (error) {
    console.warn("Não foi possível ler a fila de tarefas.", error);
    return [];
  }
}

function saveTodos(todos) {
  try {
    localStorage.setItem("todos", JSON.stringify(todos));
    return true;
  } catch (error) {
    console.error("Falha ao salvar tarefas.", error);
    alert("Não foi possível salvar. Verifique o espaço disponível no navegador.");
    return false;
  }
}

function updateStats(todos) {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.done).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  taskCount.textContent = `[ ${String(total).padStart(2, "0")} ]`;
  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
  progressCompleted.textContent = `${completed} COMPLETE`;
  progressTotal.textContent = `${total} TOTAL`;
}

function makeButton(className, iconName, label, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", label);
  button.title = label;
  const icon = document.createElement("i");
  icon.className = iconName;
  button.appendChild(icon);
  button.addEventListener("click", handler);
  return button;
}

function createTodoElement(todo) {
  const element = document.createElement("article");
  element.className = "todo";
  element.dataset.id = todo.id;
  if (todo.done) element.classList.add("done");

  const status = document.createElement("span");
  status.className = "todo-status";
  status.setAttribute("aria-label", todo.done ? "Concluída" : "Pendente");
  const statusIcon = document.createElement("i");
  statusIcon.className = "bi bi-check-lg";
  status.appendChild(statusIcon);
  element.appendChild(status);

  const title = document.createElement("h3");
  title.textContent = todo.text;
  element.appendChild(title);

  const actions = document.createElement("div");
  actions.className = "todo-actions";
  actions.appendChild(makeButton("finish-todo", todo.done ? "bi bi-arrow-counterclockwise" : "bi bi-check2", todo.done ? "Reabrir tarefa" : "Concluir tarefa", () => toggleTodo(todo.id)));
  actions.appendChild(makeButton("edit-todo", "bi bi-pencil", "Editar tarefa", () => startEdit(todo.id)));
  actions.appendChild(makeButton("remove-todo", "bi bi-trash3", "Excluir tarefa", () => removeTodo(todo.id)));
  element.appendChild(actions);
  return element;
}

function renderTodos() {
  const allTodos = getTodos();
  const term = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const filter = filterSelect.value;
  const visible = allTodos.filter((todo) => {
    const matchesSearch = todo.text.toLocaleLowerCase("pt-BR").includes(term);
    const matchesFilter = filter === "all" || (filter === "done" ? todo.done : !todo.done);
    return matchesSearch && matchesFilter;
  });

  todoList.replaceChildren();
  visible.forEach((todo) => todoList.appendChild(createTodoElement(todo)));
  emptyState.hidden = visible.length > 0;
  updateStats(allTodos);
}

function addTodo(text) {
  const cleanText = text.trim();
  if (!cleanText) { todoInput.focus(); return; }
  const todos = getTodos();
  todos.unshift({ id: createId(), text: cleanText, done: false });
  if (saveTodos(todos)) {
    todoInput.value = "";
    searchInput.value = "";
    filterSelect.value = "all";
    renderTodos();
    todoInput.focus();
  }
}

function toggleTodo(id) {
  const todos = getTodos();
  const target = todos.find((todo) => todo.id === id);
  if (!target) return;
  target.done = !target.done;
  if (saveTodos(todos)) renderTodos();
}

function removeTodo(id) {
  const todos = getTodos().filter((todo) => todo.id !== id);
  if (saveTodos(todos)) renderTodos();
}

function startEdit(id) {
  const target = getTodos().find((todo) => todo.id === id);
  if (!target) return;
  editingId = id;
  editInput.value = target.text;
  todoForm.classList.add("hide");
  editForm.classList.remove("hide");
  editInput.focus();
  editInput.select();
}

function stopEdit() {
  editingId = null;
  editInput.value = "";
  editForm.classList.add("hide");
  todoForm.classList.remove("hide");
  todoInput.focus();
}

function updateTodo(text) {
  const cleanText = text.trim();
  if (!cleanText || !editingId) return;
  const todos = getTodos();
  const target = todos.find((todo) => todo.id === editingId);
  if (!target) { stopEdit(); return; }
  target.text = cleanText;
  if (saveTodos(todos)) {
    stopEdit();
    renderTodos();
  }
}

// Eventos
todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTodo(todoInput.value);
});
editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateTodo(editInput.value);
});
cancelEditBtn.addEventListener("click", stopEdit);
searchInput.addEventListener("input", renderTodos);
filterSelect.addEventListener("change", renderTodos);
eraseBtn.addEventListener("click", () => {
  searchInput.value = "";
  renderTodos();
  searchInput.focus();
});
document.addEventListener("keydown", (event) => {
  const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
  if (event.key === "/" && !isTyping) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape") {
    if (editingId) stopEdit();
    if (document.activeElement === searchInput) {
      searchInput.value = "";
      renderTodos();
      searchInput.blur();
    }
  }
});

renderTodos();