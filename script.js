document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderCalendar();
});

const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const plantDisplay = document.getElementById('plant-display');
const progressText = document.getElementById('progress-text');

const getTodayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

addBtn.addEventListener('click', addTask);
input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

// --- TASK FUNCTIONS ---

function addTask() {
    const text = input.value.trim();
    if (!text) return;

    // We add a unique ID (Date.now()) so duplicate names don't break things
    const taskObj = { 
        id: Date.now(), 
        text: text, 
        completed: false 
    };
    
    saveTaskToStorage(taskObj);
    createTaskElement(taskObj);
    updatePlantGrowth();
    input.value = "";
}

function createTaskElement(taskObj) {
    const li = document.createElement('li');
    if (taskObj.completed) li.classList.add('completed');

    // 1. Create Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = taskObj.completed;

    // 2. Create Text Span
    const span = document.createElement('span');
    span.textContent = taskObj.text;
    span.className = 'task-text';

    // 3. Create Delete Button
    const delBtn = document.createElement('button');
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.className = 'delete-btn';

    // --- EVENTS ---
    
    // Toggle completion (clicking checkbox or the row)
    const toggleComplete = (e) => {
        // Prevent double toggling if clicking the checkbox directly
        if (e.target.closest('.delete-btn')) return; 
        
        // If we clicked the row (not checkbox), flip the checkbox manually
        if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
        }

        taskObj.completed = checkbox.checked;
        
        if (taskObj.completed) {
            li.classList.add('completed');
        } else {
            li.classList.remove('completed');
        }

        updateTaskInStorage(taskObj);
        updatePlantGrowth();
        renderCalendar();
    };

    checkbox.addEventListener('change', toggleComplete);
    li.addEventListener('click', toggleComplete);

    // Delete Logic
    delBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop the click from triggering the toggle
        li.remove();
        removeTaskFromStorage(taskObj.id);
        updatePlantGrowth();
        renderCalendar();
    });

    // Append everything to LI
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(delBtn);
    todoList.appendChild(li);
}

// --- STORAGE FUNCTIONS (Updated to use ID) ---

function getAllData() {
    return JSON.parse(localStorage.getItem('gardenTodoData')) || {};
}

function saveTaskToStorage(task) {
    const data = getAllData();
    const today = getTodayKey();
    if (!data[today]) data[today] = [];
    data[today].push(task);
    localStorage.setItem('gardenTodoData', JSON.stringify(data));
}

function updateTaskInStorage(updatedTask) {
    const data = getAllData();
    const today = getTodayKey();
    if (!data[today]) return;

    // Find task by ID
    const taskIndex = data[today].findIndex(t => t.id === updatedTask.id);
    if (taskIndex > -1) {
        data[today][taskIndex] = updatedTask;
        localStorage.setItem('gardenTodoData', JSON.stringify(data));
    }
}

function removeTaskFromStorage(taskId) {
    const data = getAllData();
    const today = getTodayKey();
    if (!data[today]) return;
    
    // Filter out the task with the matching ID
    data[today] = data[today].filter(t => t.id !== taskId);
    localStorage.setItem('gardenTodoData', JSON.stringify(data));
}

function loadTasks() {
    const data = getAllData();
    const today = getTodayKey();
    const tasks = data[today] || [];
    
    todoList.innerHTML = '';
    
    tasks.forEach(task => {
        // Patch for old data without IDs (just in case)
        if (!task.id) task.id = Date.now() + Math.random(); 
        createTaskElement(task);
    });
    
    updatePlantGrowth();
}

// --- PLANT GROWTH LOGIC ---

function updatePlantGrowth() {
    const data = getAllData();
    const today = getTodayKey();
    const tasks = data[today] || [];
    
    if (tasks.length === 0) {
        setPlantStage(0, true); // true = no tasks
        return;
    }

    const completedCount = tasks.filter(t => t.completed).length;
    const percentage = Math.round((completedCount / tasks.length) * 100);
    setPlantStage(percentage, false);
}

function setPlantStage(percentage, isEmpty) {
    progressText.textContent = isEmpty ? "Start adding tasks!" : `${percentage}% Completed`;
    plantDisplay.className = ''; 

    if (percentage === 0) {
        plantDisplay.textContent = "🌱";
        plantDisplay.classList.add('plant-stage-1');
    } else if (percentage < 50) {
        plantDisplay.textContent = "🌿";
        plantDisplay.classList.add('plant-stage-2');
    } else if (percentage < 100) {
        plantDisplay.textContent = "🌳";
        plantDisplay.classList.add('plant-stage-3');
    } else {
        plantDisplay.textContent = "🍎";
        plantDisplay.classList.add('plant-stage-4');
    }
}

// --- CALENDAR LOGIC ---

const calendarGrid = document.getElementById('calendar-grid');
const monthYearSpan = document.getElementById('month-year');
let currentDate = new Date();

document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

function renderCalendar() {
    calendarGrid.innerHTML = "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthYearSpan.textContent = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const data = getAllData();

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        calendarGrid.appendChild(emptyDiv);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = day;
        dayDiv.classList.add('day');

        const dateKey = `${year}-${month + 1}-${day}`;
        const tasks = data[dateKey];

        if (dateKey === getTodayKey()) {
            dayDiv.classList.add('today');
        }

        if (tasks && tasks.length > 0) {
            const completed = tasks.filter(t => t.completed).length;
            if (completed === tasks.length) {
                dayDiv.classList.add('all-done');
            } else {
                dayDiv.classList.add('has-tasks');
            }
        }

        calendarGrid.appendChild(dayDiv);
    }
}