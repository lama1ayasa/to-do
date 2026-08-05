document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const taskInput = document.getElementById('task-input');
    const prioritySelect = document.getElementById('priority-select');
    const categorySelect = document.getElementById('category-select');
    const todoList = document.getElementById('todo-list');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const completedCounter = document.getElementById('completed-counter');
    const progressCircle = document.getElementById('progress-circle');
    const progressText = document.getElementById('progress-text');
    const currentDateDisplay = document.getElementById('current-date-display');
    const clearAllBtn = document.getElementById('clear-all-btn');

    let todos = [];
    try {
        todos = JSON.parse(localStorage.getItem('warm_todos')) || [];
    } catch (e) {
        todos = [];
    }

    let currentFilter = 'all';
    let searchQuery = '';

    if (currentDateDisplay) {
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const span = currentDateDisplay.querySelector('span');
        if (span) {
            span.textContent = new Date().toLocaleDateString('ar-EG', dateOptions);
        }
    }

    function saveTodos() {
        localStorage.setItem('warm_todos', JSON.stringify(todos));
    }

    function getPriorityBadge(priority) {
        switch(priority) {
            case 'high':
                return '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200/80 shadow-xs">عالية</span>';
            case 'medium':
                return '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-warm-200/60 text-warm-800 border border-warm-300/60 shadow-xs">متوسطة</span>';
            case 'low':
                return '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200/80 shadow-xs">منخفضة</span>';
            default:
                return '';
        }
    }

    function updateStats() {
        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        if (completedCounter) completedCounter.textContent = `${completed} من ${total} مهام`;
        if (progressText) progressText.textContent = `${percentage}%`;
        if (progressCircle) progressCircle.setAttribute('stroke-dasharray', `${percentage}, 100`);
    }

    function render() {
        if (!todoList) return;
        todoList.innerHTML = '';
        
        const filtered = todos.filter(todo => {
            const matchesFilter = 
                currentFilter === 'all' ? true :
                currentFilter === 'completed' ? todo.completed :
                !todo.completed;
            
            const matchesSearch = todo.text.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch;
        });

        if (emptyState) {
            if (filtered.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
            }
        }

        filtered.forEach(todo => {
            const li = document.createElement('li');
            li.className = `group bg-white border border-warm-200/80 rounded-2xl p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex items-center justify-between gap-3 ${todo.completed ? 'bg-warm-50/50 border-warm-200/40 opacity-75' : ''}`;
            
            li.innerHTML = `
                <div class="flex items-center gap-3.5 flex-grow min-w-0">
                    <button data-action="toggle" data-id="${todo.id}" class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 transform active:scale-90 ${todo.completed ? 'bg-warm-600 border-warm-600 text-white shadow-xs' : 'border-warm-300 hover:border-warm-500 bg-white'}">
                        ${todo.completed ? '<i class="fa-solid fa-check text-xs"></i>' : ''}
                    </button>
                    
                    <div class="min-w-0 flex-grow">
                        <p class="text-sm font-semibold text-warm-900 truncate transition-all duration-300 ${todo.completed ? 'line-through text-warm-400' : ''}">
                            ${escapeHtml(todo.text)}
                        </p>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[11px] font-medium text-warm-600 bg-warm-100/70 px-2.5 py-0.5 rounded-full border border-warm-200/50">${todo.category}</span>
                            ${getPriorityBadge(todo.priority)}
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-1 opacity-90 md:opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0">
                    <button data-action="edit" data-id="${todo.id}" class="p-2 text-warm-500 hover:text-warm-800 hover:bg-warm-100/60 rounded-xl transition-all duration-200 text-xs hover:scale-110 active:scale-95">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button data-action="delete" data-id="${todo.id}" class="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all duration-200 text-xs hover:scale-110 active:scale-95">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            todoList.appendChild(li);
        });

        updateStats();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    if (todoForm) {
        todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = taskInput.value.trim();
            if (!text) return;

            const newTodo = {
                id: Date.now(),
                text: text,
                priority: prioritySelect ? prioritySelect.value : 'medium',
                category: categorySelect ? categorySelect.value : 'أخرى',
                completed: false
            };

            todos.unshift(newTodo);
            saveTodos();
            render();
            taskInput.value = '';
        });
    }

    if (todoList) {
        todoList.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const id = Number(button.dataset.id);

            if (action === 'toggle') {
                todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
                saveTodos();
                render();
            } else if (action === 'delete') {
                todos = todos.filter(t => t.id !== id);
                saveTodos();
                render();
            } else if (action === 'edit') {
                const todo = todos.find(t => t.id === id);
                if (!todo) return;
                const newText = prompt('تعديل المهمة:', todo.text);
                if (newText !== null && newText.trim() !== '') {
                    todo.text = newText.trim();
                    saveTodos();
                    render();
                }
            }
        });
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => {
                b.classList.remove('bg-white', 'text-warm-900', 'shadow-sm');
                b.classList.add('text-warm-600');
            });
            btn.classList.add('bg-white', 'text-warm-900', 'shadow-sm');
            btn.classList.remove('text-warm-600');
            
            currentFilter = btn.dataset.filter;
            render();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            render();
        });
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (todos.length === 0) return;
            if (confirm('هل أنتِ متأكدة من حذف جميع المهام؟')) {
                todos = [];
                saveTodos();
                render();
            }
        });
    }

    render();
});