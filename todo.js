const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const taskCounter = document.getElementById('task-counter');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const emptyState = document.getElementById('empty-state');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('theme-toggle');

let tasks = JSON.parse(localStorage.getItem('completeit-tasks')) || [];
let currentFilter = 'all';
let dragSrcIndex = null;

const savedTheme = localStorage.getItem('completeit-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('completeit-theme', next);
}

themeToggle.addEventListener('click', toggleTheme);

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function saveTasks() {
    localStorage.setItem('completeit-tasks', JSON.stringify(tasks));
}

function getFilteredTasks() {
    if (currentFilter === 'active') return tasks.filter(t => !t.completed);
    if (currentFilter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
}

function updateCounter() {
    const left = tasks.filter(t => !t.completed).length;
    taskCounter.textContent = left === 1 ? '1 item left' : `${left} items left`;
}

function updateEmptyState() {
    const filtered = getFilteredTasks();
    emptyState.classList.toggle('hidden', filtered.length > 0);
}

function createCheckbox() {
    const div = document.createElement('div');
    div.className = 'checkbox';
    div.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    return div;
}

function createTaskElement(task, index) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;
    li.draggable = true;
    if (task.completed) li.classList.add('completed');

    const checkbox = createCheckbox();
    checkbox.addEventListener('click', () => toggleTask(task.id));

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;
    span.addEventListener('click', () => toggleTask(task.id));
    span.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        startEdit(task.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.addEventListener('click', () => removeTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);

    li.addEventListener('dragstart', (e) => {
        dragSrcIndex = tasks.findIndex(t => t.id === task.id);
        li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        li.classList.add('drag-over');
    });

    li.addEventListener('dragleave', () => {
        li.classList.remove('drag-over');
    });

    li.addEventListener('drop', (e) => {
        e.preventDefault();
        li.classList.remove('drag-over');
        const dropIndex = tasks.findIndex(t => t.id === task.id);
        if (dragSrcIndex !== null && dragSrcIndex !== dropIndex) {
            const [moved] = tasks.splice(dragSrcIndex, 1);
            tasks.splice(dropIndex, 0, moved);
            saveTasks();
            renderTasks(false);
        }
        dragSrcIndex = null;
    });

    return li;
}

function renderTasks(animate = true) {
    taskList.innerHTML = '';
    const filtered = getFilteredTasks();
    filtered.forEach((task, i) => {
        const el = createTaskElement(task, i);
        if (!animate) el.style.animation = 'none';
        taskList.appendChild(el);
    });
    updateCounter();
    updateEmptyState();
}

function addTask(text) {
    const task = { id: generateId(), text, completed: false };
    tasks.unshift(task);
    saveTasks();
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks(false);
    }
}

function removeTask(id) {
    const el = taskList.querySelector(`[data-id="${id}"]`);
    if (el) {
        el.style.animation = 'fadeOut 0.3s ease forwards';
        el.addEventListener('animationend', () => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks(false);
        }, { once: true });
    }
}

function startEdit(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const li = taskList.querySelector(`[data-id="${id}"]`);
    if (!li) return;

    const span = li.querySelector('.task-text');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.text;

    span.replaceWith(input);
    input.focus();
    input.select();

    function finishEdit() {
        const newText = input.value.trim();
        if (newText && newText !== task.text) {
            task.text = newText;
            saveTasks();
        }
        renderTasks(false);
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') finishEdit();
        if (e.key === 'Escape') renderTasks(false);
    });

    input.addEventListener('blur', finishEdit);
}

function clearCompleted() {
    const completedEls = taskList.querySelectorAll('.task-item.completed');
    if (completedEls.length === 0) return;

    let remaining = completedEls.length;
    completedEls.forEach(el => {
        el.style.animation = 'fadeOut 0.3s ease forwards';
        el.addEventListener('animationend', () => {
            remaining--;
            if (remaining === 0) {
                tasks = tasks.filter(t => !t.completed);
                saveTasks();
                renderTasks(false);
            }
        }, { once: true });
    });
}

function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTasks(false);
}

taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const text = taskInput.value.trim();
        if (text) {
            addTask(text);
            taskInput.value = '';
        }
    }
});

addBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (text) {
        addTask(text);
        taskInput.value = '';
        taskInput.focus();
    }
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

renderTasks(false);
