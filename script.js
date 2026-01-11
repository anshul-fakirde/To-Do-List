document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURATION: Your Images Here ---
    const plantStages = [
        "apple-tree-growth-cycle_1.png", // 0% (Seed)
        "apple-tree-growth-cycle_2.png", // 25% (Sapling)
        "apple-tree-growth-cycle_3.png", // 50% (Small Tree)
        "apple-tree-growth-cycle_4.png", // 75% (Flowering)
        "apple-tree-growth-cycle_5.png"  // 100% (Fruits)
    ];

    // --- SELECT ELEMENTS ---
    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const plantImage = document.getElementById('plant-image');
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    const streakCountSpan = document.getElementById('streak-count');

    // --- STARTUP ---
    loadTasks();
    renderCalendar();
    updateStreak();

    // --- EVENTS ---
    addBtn.addEventListener('click', addTask);
    input.addEventListener('keypress', (e) => { if(e.key === 'Enter') addTask() });

    function getTodayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    // --- TASK LOGIC ---
    function addTask() {
        const text = input.value.trim();
        if (!text) return;
        
        const taskObj = { id: Date.now(), text: text, completed: false };
        saveTask(taskObj);
        renderTask(taskObj);
        updateProgress();
        
        input.value = ""; 
        input.focus();
    }

    function renderTask(task) {
        const li = document.createElement('li');
        if (task.completed) li.classList.add('completed');

        const checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        
        const span = document.createElement('span');
        span.textContent = task.text;
        
        const delBtn = document.createElement('button');
        delBtn.innerHTML = '<i class="fas fa-trash"></i>';
        delBtn.className = 'delete-btn';

        // Toggle Complete
        const toggle = (e) => {
            if (e.target.closest('.delete-btn')) return;
            if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
            
            task.completed = checkbox.checked;
            li.classList.toggle('completed', task.completed);
            
            updateTask(task);
            updateProgress();
            renderCalendar();
            updateStreak();
        };

        li.addEventListener('click', toggle);
        checkbox.addEventListener('change', toggle);

        // Delete
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            li.remove();
            removeTask(task.id);
            updateProgress();
            renderCalendar();
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(delBtn);
        todoList.appendChild(li);
    }

    // --- PROGRESS & IMAGE LOGIC ---
    function updateProgress() {
        const data = getData();
        const today = getTodayKey();
        const tasks = data[today] || [];
        
        if (tasks.length === 0) {
            setVisuals(0, true);
            return;
        }

        const completed = tasks.filter(t => t.completed).length;
        const total = tasks.length;
        const percentage = Math.round((completed / total) * 100);
        
        setVisuals(percentage, false);

        if (percentage === 100) launchConfetti();
    }

    function setVisuals(percentage, isEmpty) {
        // 1. Update Text
        progressText.textContent = isEmpty ? "Start your day!" : `${percentage}% Completed`;
        
        // 2. Update Progress Bar Width
        progressFill.style.width = `${percentage}%`;

        // 3. Update Image based on % range
        let stageIndex = 0;
        if (percentage === 0) stageIndex = 0;        // Seed
        else if (percentage <= 25) stageIndex = 1;   // Sapling
        else if (percentage <= 50) stageIndex = 2;   // Small Tree
        else if (percentage <= 75) stageIndex = 3;   // Flowering
        else stageIndex = 4;                         // Fruiting (80-100%)

        plantImage.src = plantStages[stageIndex];
    }

    // --- STORAGE ---
    function getData() { return JSON.parse(localStorage.getItem('gardenTodo')) || {}; }
    
    function saveTask(task) {
        const data = getData();
        const today = getTodayKey();
        if (!data[today]) data[today] = [];
        data[today].push(task);
        localStorage.setItem('gardenTodo', JSON.stringify(data));
    }

    function updateTask(task) {
        const data = getData();
        const today = getTodayKey();
        const idx = data[today].findIndex(t => t.id === task.id);
        if (idx > -1) {
            data[today][idx] = task;
            localStorage.setItem('gardenTodo', JSON.stringify(data));
        }
    }

    function removeTask(id) {
        const data = getData();
        const today = getTodayKey();
        data[today] = data[today].filter(t => t.id !== id);
        localStorage.setItem('gardenTodo', JSON.stringify(data));
    }

    function loadTasks() {
        const data = getData();
        const today = getTodayKey();
        const tasks = data[today] || [];
        todoList.innerHTML = "";
        tasks.forEach(t => renderTask(t));
        updateProgress();
    }

    // --- EXTRAS ---
    function launchConfetti() {
        const container = document.getElementById('confetti-container');
        if (container.children.length > 0) return;
        for(let i=0; i<30; i++) {
            const el = document.createElement('div');
            el.className = 'confetti';
            el.style.left = Math.random()*100 + 'vw';
            el.style.background = `hsl(${Math.random()*360}, 100%, 50%)`;
            el.style.animationDuration = (Math.random()*2 + 2) + 's';
            container.appendChild(el);
            setTimeout(() => el.remove(), 4000);
        }
    }

    function updateStreak() {
        // Simple streak logic
        const data = getData();
        let streak = 0;
        let d = new Date();
        while(true) {
            const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
            const tasks = data[key];
            if (tasks && tasks.some(t => t.completed)) {
                streak++;
                d.setDate(d.getDate()-1);
            } else {
                if (key === getTodayKey()) { d.setDate(d.getDate()-1); continue; }
                break;
            }
        }
        streakCountSpan.textContent = streak;
    }

    function renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const monthSpan = document.getElementById('month-year');
        if(!grid) return;
        
        const d = new Date();
        const year = d.getFullYear();
        const month = d.getMonth();
        monthSpan.textContent = d.toLocaleString('default', {month:'long', year:'numeric'});
        
        grid.innerHTML = "";
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month+1, 0).getDate();
        const data = getData();

        for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement('div'));
        
        for(let day=1; day<=daysInMonth; day++) {
            const el = document.createElement('div');
            el.className = 'day';
            el.textContent = day;
            
            const key = `${year}-${month+1}-${day}`;
            if (key === getTodayKey()) el.classList.add('today');
            
            if (data[key]) {
                const all = data[key].length;
                const done = data[key].filter(t => t.completed).length;
                if (all > 0 && all === done) el.classList.add('all-done');
                else if (all > 0) el.classList.add('has-tasks');
            }
            grid.appendChild(el);
        }
    }
});