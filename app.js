// ============================================================================
// APPLICATION STATE
// ============================================================================

const APP = {
    projects: [],
    categories: [],
    statuses: [],
    users: [],
    selectedCategories: [],
    selectedStatuses: [],
    selectedUsers: [],
    showCompleted: false,
    lastUpdated: 'Never',
    currentEditingProject: null,
    currentProjectLinks: [],
    notes: {
        nymbl: '',
        cindy: '',
        me: ''
    },
    currentNoteName: 'Nymbl',
    currentPage: 'projects',
    PASSWORD_HASH: 2147093827,
    timelineFilters: {
        categories: [],
        statuses: [],
        users: []
    },
    timelineStartDate: new Date(),
    timelineMonthsToShow: 12,
    timelineProjects: [],
    isDraggingGantt: false,
    ganttDragData: null,
    timelineDragIndex: undefined
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

function saveToLocalStorage() {
    if (typeof localStorage !== 'undefined') {
        const data = {
            projects: APP.projects,
            categories: APP.categories,
            statuses: APP.statuses,
            users: APP.users,
            lastUpdated: APP.lastUpdated,
            notes: APP.notes,
            timelineProjects: APP.timelineProjects,
            timelineMonthsToShow: APP.timelineMonthsToShow
        };
        try {
            localStorage.setItem('pkdDashboardData', JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    container.appendChild(notification);
    
    setTimeout(() => {
        if (container.contains(notification)) {
            container.removeChild(notification);
        }
    }, 3000);
}

function showConfirm(message, onConfirm) {
    const confirmDiv = document.createElement('div');
    confirmDiv.id = 'confirmDialog';
    confirmDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 9999;';
    confirmDiv.innerHTML = `
        <div style="background: rgba(35, 35, 38, 0.98); backdrop-filter: blur(10px); border: 1px solid var(--border-color); border-radius: 12px; padding: 2rem; max-width: 400px; box-shadow: var(--shadow);">
            <p style="margin-bottom: 1.5rem; color: var(--text-primary);">${message}</p>
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button onclick="cancelConfirm()" style="padding: 0.5rem 1.5rem; background: var(--bg-secondary); border: 1px solid var(--pastel-red); color: var(--pastel-red); border-radius: 6px; cursor: pointer; font-weight: 500;">Cancel</button>
                <button onclick="acceptConfirm()" style="padding: 0.5rem 1.5rem; background: var(--pastel-green); color: var(--bg-primary); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Confirm</button>
            </div>
        </div>
    `;
    document.body.appendChild(confirmDiv);
    
    window.acceptConfirm = function() {
        confirmDiv.remove();
        if (onConfirm) onConfirm();
    };
    
    window.cancelConfirm = function() {
        confirmDiv.remove();
    };
}

// ============================================================================
// PASSWORD & INITIALIZATION
// ============================================================================

function checkPassword() {
    const input = document.getElementById('passwordInput');
    const error = document.getElementById('passwordError');
    const password = input.value;
    
    if (hashCode(password) === APP.PASSWORD_HASH) {
        document.getElementById('passwordScreen').style.display = 'none';
        document.getElementById('dashboardWrapper').style.display = 'block';
        initializeDashboard();
    } else {
        input.classList.add('error');
        error.classList.add('show');
        setTimeout(() => {
            input.classList.remove('error');
            error.classList.remove('show');
        }, 2000);
    }
}

function initializeDashboard() {
    updateStats();
    updateFilterDropdowns();
    loadNotes();
    
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-secondary); grid-column: 1 / -1;"><h3>Welcome to PKD Dashboard</h3><p style="margin-top: 1rem;">Upload a PKD file to get started, or create your first project.</p></div>';
    
    document.getElementById('lastUpdatedText').textContent = `Last Updated: ${APP.lastUpdated}`;
}

// ============================================================================
// NAVIGATION
// ============================================================================

function showPage(page) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.page-container').forEach(container => container.classList.remove('active'));
    document.getElementById(`${page}Page`).classList.add('active');
    
    const projectsOnlyBtn = document.getElementById('projectsOnlyBtn');
    const manageBtn = document.getElementById('manageBtn');
    const timelineHeaderActions = document.getElementById('timelineHeaderActions');
    
    if (page === 'projects') {
        projectsOnlyBtn.style.display = 'inline-block';
        manageBtn.style.display = 'inline-block';
        if (timelineHeaderActions) timelineHeaderActions.style.display = 'none';
    } else {
        projectsOnlyBtn.style.display = 'none';
        manageBtn.style.display = 'none';
        if (timelineHeaderActions) timelineHeaderActions.style.display = 'flex';
    }
    
    APP.currentPage = page;
    
    if (page === 'timeline') {
        renderTimeline();
    }
}

// ============================================================================
// STATS & FILTERS
// ============================================================================

function updateStats() {
    const active = APP.projects.filter(p => p.status !== 'complete').length;
    const complete = APP.projects.filter(p => p.status === 'complete').length;
    
    document.getElementById('activeCount').textContent = active;
    document.getElementById('completeCount').textContent = complete;
}

function updateFilterDropdowns() {
    if (APP.selectedCategories.length === 0 && APP.categories.length > 0) {
        APP.selectedCategories = [...APP.categories];
    }
    if (APP.selectedStatuses.length === 0 && APP.statuses.length > 0) {
        APP.selectedStatuses = [...APP.statuses];
    }
    if (APP.selectedUsers.length === 0 && APP.users.length > 0) {
        APP.selectedUsers = [...APP.users];
    }
    
    const categoryMenu = document.getElementById('categoryMenu');
    categoryMenu.innerHTML = '';
    
    const categoryControls = document.createElement('div');
    categoryControls.className = 'dropdown-select-controls';
    categoryControls.innerHTML = `
        <button class="dropdown-select-btn" onclick="selectAllCategories()">Select All</button>
        <button class="dropdown-select-btn" onclick="deselectAllCategories()">Deselect All</button>
    `;
    categoryMenu.appendChild(categoryControls);
    
    APP.categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        const isChecked = APP.selectedCategories.includes(cat) ? 'checked' : '';
        item.innerHTML = `
            <input type="checkbox" id="cat-${cat}" onchange="toggleCategory('${cat}', event)" ${isChecked}>
            <label for="cat-${cat}">${cat}</label>
        `;
        categoryMenu.appendChild(item);
    });

    const statusMenu = document.getElementById('statusMenu');
    statusMenu.innerHTML = '';
    
    const statusControls = document.createElement('div');
    statusControls.className = 'dropdown-select-controls';
    statusControls.innerHTML = `
        <button class="dropdown-select-btn" onclick="selectAllStatuses()">Select All</button>
        <button class="dropdown-select-btn" onclick="deselectAllStatuses()">Deselect All</button>
    `;
    statusMenu.appendChild(statusControls);
    
    APP.statuses.forEach(status => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        const isChecked = APP.selectedStatuses.includes(status) ? 'checked' : '';
        item.innerHTML = `
            <input type="checkbox" id="status-${status}" onchange="toggleStatus('${status}', event)" ${isChecked}>
            <label for="status-${status}">${status}</label>
        `;
        statusMenu.appendChild(item);
    });

    const userMenu = document.getElementById('userMenu');
    userMenu.innerHTML = '';
    
    const userControls = document.createElement('div');
    userControls.className = 'dropdown-select-controls';
    userControls.innerHTML = `
        <button class="dropdown-select-btn" onclick="selectAllUsers()">Select All</button>
        <button class="dropdown-select-btn" onclick="deselectAllUsers()">Deselect All</button>
    `;
    userMenu.appendChild(userControls);
    
    APP.users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        const isChecked = APP.selectedUsers.includes(user) ? 'checked' : '';
        item.innerHTML = `
            <input type="checkbox" id="user-${user}" onchange="toggleUser('${user}', event)" ${isChecked}>
            <label for="user-${user}">${user}</label>
        `;
        userMenu.appendChild(item);
    });
    
    updateTimelineFilterDropdowns();
    updateFilterCounts();
}

function updateTimelineFilterDropdowns() {
    if (APP.timelineFilters.categories.length === 0 && APP.categories.length > 0) {
        APP.timelineFilters.categories = [...APP.categories];
    }
    if (APP.timelineFilters.statuses.length === 0 && APP.statuses.length > 0) {
        APP.timelineFilters.statuses = [...APP.statuses];
    }
    if (APP.timelineFilters.users.length === 0 && APP.users.length > 0) {
        APP.timelineFilters.users = [...APP.users];
    }

    const timelineCategoryMenu = document.getElementById('timelineCategoryMenu');
    if (timelineCategoryMenu) {
        timelineCategoryMenu.innerHTML = '';
        
        const categoryControls = document.createElement('div');
        categoryControls.className = 'dropdown-select-controls';
        categoryControls.innerHTML = `
            <button class="dropdown-select-btn" onclick="selectAllTimelineCategories()">Select All</button>
            <button class="dropdown-select-btn" onclick="deselectAllTimelineCategories()">Deselect All</button>
        `;
        timelineCategoryMenu.appendChild(categoryControls);
        
        APP.categories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            const isChecked = APP.timelineFilters.categories.includes(cat) ? 'checked' : '';
            item.innerHTML = `
                <input type="checkbox" id="timeline-cat-${cat}" onchange="toggleTimelineCategory('${cat}', event)" ${isChecked}>
                <label for="timeline-cat-${cat}">${cat}</label>
            `;
            timelineCategoryMenu.appendChild(item);
        });
    }

    const timelineStatusMenu = document.getElementById('timelineStatusMenu');
    if (timelineStatusMenu) {
        timelineStatusMenu.innerHTML = '';
        
        const statusControls = document.createElement('div');
        statusControls.className = 'dropdown-select-controls';
        statusControls.innerHTML = `
            <button class="dropdown-select-btn" onclick="selectAllTimelineStatuses()">Select All</button>
            <button class="dropdown-select-btn" onclick="deselectAllTimelineStatuses()">Deselect All</button>
        `;
        timelineStatusMenu.appendChild(statusControls);
        
        APP.statuses.forEach(status => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            const isChecked = APP.timelineFilters.statuses.includes(status) ? 'checked' : '';
            item.innerHTML = `
                <input type="checkbox" id="timeline-status-${status}" onchange="toggleTimelineStatus('${status}', event)" ${isChecked}>
                <label for="timeline-status-${status}">${status}</label>
            `;
            timelineStatusMenu.appendChild(item);
        });
    }

    const timelineUserMenu = document.getElementById('timelineUserMenu');
    if (timelineUserMenu) {
        timelineUserMenu.innerHTML = '';
        
        const userControls = document.createElement('div');
        userControls.className = 'dropdown-select-controls';
        userControls.innerHTML = `
            <button class="dropdown-select-btn" onclick="selectAllTimelineUsers()">Select All</button>
            <button class="dropdown-select-btn" onclick="deselectAllTimelineUsers()">Deselect All</button>
        `;
        timelineUserMenu.appendChild(userControls);
        
        APP.users.forEach(user => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            const isChecked = APP.timelineFilters.users.includes(user) ? 'checked' : '';
            item.innerHTML = `
                <input type="checkbox" id="timeline-user-${user}" onchange="toggleTimelineUser('${user}', event)" ${isChecked}>
                <label for="timeline-user-${user}">${user}</label>
            `;
            timelineUserMenu.appendChild(item);
        });
    }

    const timelineCategoryCount = document.getElementById('timelineCategoryCount');
    if (timelineCategoryCount) {
        timelineCategoryCount.textContent = APP.timelineFilters.categories.length > 0 ? `(${APP.timelineFilters.categories.length})` : '';
    }

    const timelineStatusCount = document.getElementById('timelineStatusCount');
    if (timelineStatusCount) {
        timelineStatusCount.textContent = APP.timelineFilters.statuses.length > 0 ? `(${APP.timelineFilters.statuses.length})` : '';
    }

    const timelineUserCount = document.getElementById('timelineUserCount');
    if (timelineUserCount) {
        timelineUserCount.textContent = APP.timelineFilters.users.length > 0 ? `(${APP.timelineFilters.users.length})` : '';
    }
}

function toggleDropdown(menuId) {
    const menu = document.getElementById(menuId);
    menu.classList.toggle('open');
}

function toggleCategory(category, event) {
    if (event) event.stopPropagation();
    const index = APP.selectedCategories.indexOf(category);
    if (index > -1) {
        APP.selectedCategories.splice(index, 1);
    } else {
        APP.selectedCategories.push(category);
    }
    updateFilterCounts();
    renderProjects();
}

function toggleStatus(status, event) {
    if (event) event.stopPropagation();
    const index = APP.selectedStatuses.indexOf(status);
    if (index > -1) {
        APP.selectedStatuses.splice(index, 1);
    } else {
        APP.selectedStatuses.push(status);
    }
    updateFilterCounts();
    renderProjects();
}

function toggleUser(user, event) {
    if (event) event.stopPropagation();
    const index = APP.selectedUsers.indexOf(user);
    if (index > -1) {
        APP.selectedUsers.splice(index, 1);
    } else {
        APP.selectedUsers.push(user);
    }
    updateFilterCounts();
    renderProjects();
}

function selectAllCategories() {
    APP.selectedCategories = [...APP.categories];
    updateFilterDropdowns();
    renderProjects();
}

function deselectAllCategories() {
    APP.selectedCategories = [];
    updateFilterDropdowns();
    renderProjects();
}

function selectAllStatuses() {
    APP.selectedStatuses = [...APP.statuses];
    updateFilterDropdowns();
    renderProjects();
}

function deselectAllStatuses() {
    APP.selectedStatuses = [];
    updateFilterDropdowns();
    renderProjects();
}

function selectAllUsers() {
    APP.selectedUsers = [...APP.users];
    updateFilterDropdowns();
    renderProjects();
}

function deselectAllUsers() {
    APP.selectedUsers = [];
    updateFilterDropdowns();
    renderProjects();
}

function toggleTimelineCategory(category, event) {
    if (event) event.stopPropagation();
    const index = APP.timelineFilters.categories.indexOf(category);
    if (index > -1) {
        APP.timelineFilters.categories.splice(index, 1);
    } else {
        APP.timelineFilters.categories.push(category);
    }
    updateTimelineFilterDropdowns();
    renderTimeline();
}

function toggleTimelineStatus(status, event) {
    if (event) event.stopPropagation();
    const index = APP.timelineFilters.statuses.indexOf(status);
    if (index > -1) {
        APP.timelineFilters.statuses.splice(index, 1);
    } else {
        APP.timelineFilters.statuses.push(status);
    }
    updateTimelineFilterDropdowns();
    renderTimeline();
}

function toggleTimelineUser(user, event) {
    if (event) event.stopPropagation();
    const index = APP.timelineFilters.users.indexOf(user);
    if (index > -1) {
        APP.timelineFilters.users.splice(index, 1);
    } else {
        APP.timelineFilters.users.push(user);
    }
    updateTimelineFilterDropdowns();
    renderTimeline();
}

function selectAllTimelineCategories() {
    APP.timelineFilters.categories = [...APP.categories];
    updateTimelineFilterDropdowns();
    renderTimeline();
}

function deselectAllTimelineCategories() {
    APP.timelineFilters.categories = [];
    updateTimelineFilterDropdowns();
    renderTimeline();
}

function selectAllTimelineStatuses() {
    APP.timelineFilters.statuses = [...APP.statuses];
    updateTimelineFilterDropdowns();
    renderTimeline();
}

function deselectAllTimelineStatuses() {
    APP.timelineFilters.statuses = [];
    updateTimelineFilterDropdowns();
    renderTimeline();
}

function selectAllTimelineUsers() {
    APP.timelineFilters.users = [...APP.users];
    updateTimelineFilterDropdowns();
    renderTimeline();
}

function deselectAllTimelineUsers() {
    APP.timelineFilters.users = [];
    updateTimelineFilterDropdowns();
    renderTimeline();
}

function updateFilterCounts() {
    document.getElementById('categoryCount').textContent = APP.selectedCategories.length > 0 ? `(${APP.selectedCategories.length})` : '';
    document.getElementById('statusCount').textContent = APP.selectedStatuses.length > 0 ? `(${APP.selectedStatuses.length})` : '';
    document.getElementById('userCount').textContent = APP.selectedUsers.length > 0 ? `(${APP.selectedUsers.length})` : '';
}

function toggleCompleted() {
    APP.showCompleted = !APP.showCompleted;
    document.getElementById('showCompletedToggle').classList.toggle('active');
    renderProjects();
}

// ============================================================================
// PROJECT RENDERING
// ============================================================================

function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = APP.projects.filter(project => {
        if (!APP.showCompleted && project.status === 'complete') return false;
        
        if (APP.selectedCategories.length > 0) {
            const hasCategory = project.categories && 
                project.categories.some(cat => APP.selectedCategories.includes(cat));
            if (!hasCategory) return false;
        }
        
        if (APP.selectedStatuses.length > 0) {
            if (!APP.selectedStatuses.includes(project.status)) return false;
        }

        if (APP.selectedUsers.length > 0) {
            const hasUser = project.users && project.users.length > 0 &&
                project.users.some(user => APP.selectedUsers.includes(user));
            if (!hasUser) return false;
        }
        
        if (search) {
            const searchInProject = 
                project.title.toLowerCase().includes(search) ||
                (project.keyDetails && project.keyDetails.toLowerCase().includes(search)) ||
                (project.nextSteps && project.nextSteps.toLowerCase().includes(search));
            if (!searchInProject) return false;
        }
        
        return true;
    });
    
    filtered.sort((a, b) => {
        const priorityA = a.priority || 999;
        const priorityB = b.priority || 999;
        return priorityA - priorityB;
    });
    
    grid.innerHTML = '';
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-secondary); grid-column: 1 / -1;">No projects found. Upload a PKD file to get started.</div>';
        return;
    }
    
    filtered.forEach(project => {
        const card = createProjectCard(project);
        grid.appendChild(card);
    });
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    let statusColor = '--pastel-blue';
    if (project.status === 'complete') statusColor = '--text-secondary';
    else if (project.status === 'on-hold') statusColor = '--pastel-red';
    else if (project.status === 'moving') statusColor = '--pastel-green';
    else if (project.status === 'stable') statusColor = '--pastel-purple';
    else if (project.status === 'in-progress') statusColor = '--pastel-blue';
    else if (project.status === 'idea') statusColor = '--accent-orange';
    
    card.innerHTML = `
        <div class="project-header">
            <div>
                <div class="project-title" onclick="openProjectModal(${project.id})">${project.title}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">ID: ${project.id} | Priority: ${project.priority || 999}</div>
            </div>
            <span class="status-badge" style="background: var(${statusColor}); color: ${statusColor.includes('text-secondary') ? 'var(--text-secondary)' : 'var(--bg-primary)'};">${project.status}</span>
        </div>
        ${project.users && project.users.length > 0 ? `<div style="margin-bottom: 0.5rem; color: var(--pastel-purple); font-size: 0.875rem;">Users: ${project.users.join(', ')}</div>` : ''}
        <div style="margin: 1rem 0; color: var(--text-secondary); font-size: 0.875rem;">
            ${project.keyDetails ? project.keyDetails.substring(0, 100) + (project.keyDetails.length > 100 ? '...' : '') : 'No details'}
        </div>
        <div class="project-footer">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${project.categories && project.categories.length > 0 ? project.categories.map(cat => 
                    `<span style="padding: 0.25rem 0.5rem; background: rgba(147, 197, 253, 0.15); border-radius: 6px; font-size: 0.75rem; color: var(--pastel-blue);">${cat}</span>`
                ).join('') : ''}
            </div>
            <div class="project-actions">
                <button class="edit-btn" style="background: var(--pastel-purple); color: var(--bg-primary); font-weight: 500;" onclick="openEditModal(${project.id})">Edit</button>
                ${project.status !== 'complete' ? 
                    `<button class="complete-btn" style="background: var(--pastel-green); color: var(--bg-primary); font-weight: 500;" onclick="markComplete(${project.id})">Complete</button>` : ''}
                <button class="delete-btn" style="background: var(--pastel-red); color: var(--bg-primary); font-weight: 500;" onclick="deleteProject(${project.id})">Delete</button>
            </div>
        </div>
    `;
    
    return card;
}

// ============================================================================
// PROJECT ACTIONS
// ============================================================================

function markComplete(id) {
    const project = APP.projects.find(p => p.id === id);
    if (!project) return;
    
    showConfirm(`Mark "${project.title}" as complete?`, function() {
        project.status = 'complete';
        
        saveToLocalStorage();
        updateStats();
        renderProjects();
        if (APP.currentPage === 'timeline') {
            renderTimeline();
        }
        showNotification('Project marked as complete', 'success');
    });
}

function deleteProject(id) {
    const project = APP.projects.find(p => p.id === id);
    if (!project) return;
    
    showConfirm(`Delete project "${project.title}"? This action cannot be undone.`, function() {
        APP.projects = APP.projects.filter(p => p.id !== id);
        
        saveToLocalStorage();
        updateStats();
        renderProjects();
        if (APP.currentPage === 'timeline') {
            renderTimeline();
        }
        showNotification('Project deleted successfully', 'success');
    });
}

function openProjectModal(id) {
    showNotification('Project modal not yet implemented', 'info');
}

function openEditModal(id) {
    showNotification('Edit modal not yet implemented', 'info');
}

function openCreateModal() {
    showNotification('Create modal not yet implemented', 'info');
}

function openManageModal() {
    showNotification('Manage modal not yet implemented', 'info');
}

// ============================================================================
// NOTES MANAGEMENT
// ============================================================================

function switchNote() {
    saveCurrentNote();
    const selector = document.getElementById('notesSelector');
    APP.currentNoteName = selector.value;
    loadNotes();
}

function saveCurrentNote() {
    const textarea = document.getElementById('notesTextarea');
    const noteName = APP.currentNoteName;
    const noteKey = noteName.toLowerCase().replace(/\s+/g, '_');
    APP.notes[noteKey] = textarea.value;
    saveToLocalStorage();
}

function loadNotes() {
    const textarea = document.getElementById('notesTextarea');
    const selector = document.getElementById('notesSelector');
    
    if (!textarea || !selector) return;
    
    const noteName = APP.currentNoteName;
    const noteKey = noteName.toLowerCase().replace(/\s+/g, '_');
    textarea.value = APP.notes[noteKey] || '';
    selector.value = noteName;
}

function addNewNote() {
    const noteName = prompt('Enter note name:');
    if (!noteName || !noteName.trim()) return;
    
    const trimmedName = noteName.trim();
    const noteKey = trimmedName.toLowerCase().replace(/\s+/g, '_');
    
    if (APP.notes[noteKey] !== undefined) {
        showNotification('A note with this name already exists', 'error');
        return;
    }
    
    APP.notes[noteKey] = '';
    
    const selector = document.getElementById('notesSelector');
    const option = document.createElement('option');
    option.value = trimmedName;
    option.textContent = trimmedName;
    selector.appendChild(option);
    
    APP.currentNoteName = trimmedName;
    selector.value = trimmedName;
    loadNotes();
    
    saveToLocalStorage();
    showNotification(`Note "${trimmedName}" created`, 'success');
}

function deleteCurrentNote() {
    const selector = document.getElementById('notesSelector');
    const currentNoteName = selector.value;
    const noteKey = currentNoteName.toLowerCase().replace(/\s+/g, '_');

    const defaultNotes = ['Nymbl', 'Cindy', 'Me'];
    if (defaultNotes.includes(currentNoteName)) {
        showNotification('Cannot delete default notes', 'error');
        return;
    }

    showConfirm(`Delete note "${currentNoteName}"? This action cannot be undone.`, function() {
        delete APP.notes[noteKey];

        const optionToRemove = Array.from(selector.options).find(opt => opt.value === currentNoteName);
        if (optionToRemove) {
            selector.removeChild(optionToRemove);
        }

        APP.currentNoteName = 'Nymbl';
        selector.value = 'Nymbl';
        loadNotes();

        saveToLocalStorage();
        showNotification('Note deleted successfully', 'success');
    });
}

function handleNotesInput(e) {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    let value = textarea.value;
    let newValue = value.replace(/^-\s/gm, '• ');
    
    if (value !== newValue) {
        const beforeCursor = value.substring(0, start);
        const beforeCursorNew = beforeCursor.replace(/^-\s/gm, '• ');
        const diff = beforeCursorNew.length - beforeCursor.length;
        
        textarea.value = newValue;
        textarea.selectionStart = start + diff;
        textarea.selectionEnd = end + diff;
    }
    
    saveCurrentNote();
}

// ============================================================================
// EXPORT/IMPORT
// ============================================================================

function exportPKD() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    let content = `**Project Knowledge Document**\n\n`;
    content += `*Last Updated: ${dateStr}*\n\n`;
    content += `**Quick Reference List**\n\n`;
    
    APP.projects.forEach((project, index) => {
        content += `${index + 1}.  ${project.title}\n\n`;
    });
    
    if (APP.users.length > 0) {
        content += `**Users List**\n\n`;
        APP.users.forEach(user => {
            content += `-   ${user}\n`;
        });
        content += `\n`;
    }
    
    content += `**Active Projects**\n\n`;
    
    APP.projects.forEach(project => {
        content += `**${project.id}. ${project.title}**\n\n`;
        content += `-   **Status**: ${project.status}\n\n`;
        content += `-   **Priority**: ${project.priority || 999}\n\n`;
        content += `-   **Project Category**: ${project.categories ? project.categories.join(', ') : ''}\n\n`;
        if (project.users && project.users.length > 0) {
            content += `-   **Users**: ${project.users.join(', ')}\n\n`;
        }
        
        content += `-   **Key Details**: `;
        if (project.keyDetails && project.keyDetails.trim()) {
            const detailLines = project.keyDetails.split('\n');
            if (detailLines.length === 1) {
                content += `${project.keyDetails}\n\n`;
            } else {
                content += `\n`;
                detailLines.forEach((line) => {
                    content += `    ${line}\n`;
                });
                content += '\n';
            }
        } else {
            content += '\n\n';
        }
        
        content += `-   **Next Steps**: `;
        if (project.nextSteps && project.nextSteps.trim()) {
            const stepLines = project.nextSteps.split('\n');
            if (stepLines.length === 1) {
                content += `${project.nextSteps}\n\n`;
            } else {
                content += `\n`;
                stepLines.forEach((line) => {
                    content += `    ${line}\n`;
                });
                content += '\n';
            }
        } else {
            content += '\n\n';
        }
        
        if (project.links && project.links.length > 0) {
            content += `-   **Links**: `;
            project.links.forEach((link, idx) => {
                if (idx > 0) content += ', ';
                content += `[${link.alias}](${link.url})`;
            });
            content += '\n\n';
        }
    });
    
    content += `**Notes**\n\n`;
    
    const noteNames = Object.keys(APP.notes);
    const displayNoteNames = {
        'nymbl': 'Nymbl',
        'cindy': 'Cindy',
        'me': 'Personal'
    };
    
    noteNames.forEach(noteKey => {
        const displayName = displayNoteNames[noteKey] || 
            noteKey.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        content += `**${displayName} Notes:**\n`;
        if (APP.notes[noteKey] && APP.notes[noteKey].trim()) {
            const noteLines = APP.notes[noteKey].split('\n');
            noteLines.forEach(line => {
                content += `${line}\n`;
            });
        } else {
            content += `(No notes)\n`;
        }
        content += '\n';
    });
    
    if (APP.timelineProjects.length > 0) {
        content += `**Timeline Data**\n\n`;
        content += `<!-- TIMELINE_DATA_START\n`;
        content += JSON.stringify({
            timelineProjects: APP.timelineProjects,
            timelineMonthsToShow: APP.timelineMonthsToShow,
            timelineStartDate: APP.timelineStartDate.toISOString()
        }, null, 2);
        content += `\nTIMELINE_DATA_END -->\n\n`;
    }
    
    content += `**Weekly Review Checklist**\n\n`;
    content += `-   [ ] Update project statuses\n\n`;
    content += `-   [ ] Review blockers and dependencies\n\n`;
    content += `-   [ ] Check upcoming deadlines\n\n`;
    content += `-   [ ] Update team member progress\n\n`;
    content += `-   [ ] Document completed milestones\n\n`;
    content += `-   [ ] Plan next week's priorities\n\n`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PKD_${today.getFullYear()}_${(today.getMonth() + 1).toString().padStart(2, '0')}_${today.getDate().toString().padStart(2, '0')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    APP.lastUpdated = dateStr;
    document.getElementById('lastUpdatedText').textContent = `Last Updated: ${APP.lastUpdated}`;
    saveToLocalStorage();
    showNotification('PKD exported successfully', 'success');
}

function parsePKDContent(content) {
    const result = {
        projects: [],
        categories: [],
        statuses: [],
        users: [],
        lastUpdated: 'Never',
        notes: {
            nymbl: '',
            cindy: '',
            me: ''
        },
        timelineProjects: [],
        timelineMonthsToShow: 12,
        timelineStartDate: new Date()
    };
    
    const categoriesSet = new Set();
    const statusesSet = new Set();
    const usersSet = new Set();
    
    const lines = content.split('\n');
    
    const timelineDataMatch = content.match(/<!-- TIMELINE_DATA_START\n([\s\S]*?)\nTIMELINE_DATA_END -->/);
    if (timelineDataMatch) {
        try {
            const timelineData = JSON.parse(timelineDataMatch[1]);
            result.timelineProjects = timelineData.timelineProjects || [];
            result.timelineMonthsToShow = timelineData.timelineMonthsToShow || 12;
            result.timelineStartDate = timelineData.timelineStartDate ? new Date(timelineData.timelineStartDate) : new Date();
        } catch (e) {
            console.error('Error parsing timeline data:', e);
        }
    }
    
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i];
        if (line.includes('Last Updated:')) {
            const match = line.match(/\*Last Updated:\s*(.+?)\*/);
            if (match) {
                result.lastUpdated = match[1].trim();
                break;
            }
        }
    }
    
    const projectsStart = lines.findIndex(line => line.includes('**Active Projects**'));
    const notesStart = lines.findIndex(line => line.includes('**Notes**'));
    const usersStart = lines.findIndex(line => line.includes('**Users List**'));
    
    if (usersStart !== -1 && usersStart < projectsStart) {
        const usersEnd = projectsStart !== -1 ? projectsStart : lines.length;
        for (let i = usersStart + 1; i < usersEnd; i++) {
            const line = lines[i].trim();
            if (line.startsWith('-')) {
                const user = line.replace(/^-\s*/, '').trim();
                if (user && !line.includes('**')) {
                    usersSet.add(user);
                }
            }
        }
    }
    
    if (projectsStart === -1) {
        console.log('No Active Projects section found');
        return result;
    }
    
    let currentProject = null;
    const projectsEnd = notesStart !== -1 ? notesStart : lines.length;
    
    for (let i = projectsStart + 1; i < projectsEnd; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        const projectMatch = trimmedLine.match(/^\*\*(\d+)\.\s+(.+)\*\*$/);
        if (projectMatch) {
            if (currentProject) {
                result.projects.push(currentProject);
            }
            currentProject = {
                id: parseInt(projectMatch[1]),
                title: projectMatch[2],
                status: 'idea',
                users: [],
                categories: [],
                keyDetails: '',
                nextSteps: '',
                links: [],
                priority: 999
            };
            continue;
        }
        
        if (!currentProject) continue;
        
        if (line.includes('**Status**:')) {
            const parts = line.split('**Status**:');
            if (parts.length > 1) {
                const status = parts[1].trim().toLowerCase().replace(/\s+/g, '-');
                currentProject.status = status;
                statusesSet.add(status);
            }
        }
        
        if (line.includes('**Priority**:')) {
            const parts = line.split('**Priority**:');
            if (parts.length > 1) {
                const priority = parseInt(parts[1].trim());
                if (!isNaN(priority)) {
                    currentProject.priority = priority;
                }
            }
        }
        
        if (line.includes('**Project Category**:')) {
            const parts = line.split('**Project Category**:');
            if (parts.length > 1) {
                const cats = parts[1].trim();
                if (cats) {
                    const categoryList = cats.split(',').map(c => c.trim()).filter(c => c);
                    currentProject.categories = categoryList;
                    categoryList.forEach(c => categoriesSet.add(c));
                }
            }
        }
        
        if (line.includes('**User**:') || line.includes('**Users**:')) {
            const parts = line.includes('**Users**:') ? line.split('**Users**:') : line.split('**User**:');
            if (parts.length > 1) {
                const usersString = parts[1].trim();
                if (usersString) {
                    const usersList = usersString.split(',').map(u => u.trim()).filter(u => u);
                    currentProject.users = usersList;
                    usersList.forEach(u => usersSet.add(u));
                }
            }
        }
        
        if (line.includes('**Key Details**:')) {
            const parts = line.split('**Key Details**:');
            if (parts.length > 1 && parts[1].trim()) {
                currentProject.keyDetails = parts[1].trim();
            } else {
                const detailLines = [];
                let j = i + 1;
                while (j < projectsEnd && lines[j] && !lines[j].includes('**') && !lines[j].trim().startsWith('-')) {
                    if (lines[j].trim()) {
                        detailLines.push(lines[j].replace(/^    /, ''));
                    }
                    j++;
                }
                currentProject.keyDetails = detailLines.join('\n').trim();
            }
        }
        
        if (line.includes('**Next Steps**:')) {
            const parts = line.split('**Next Steps**:');
            if (parts.length > 1 && parts[1].trim()) {
                currentProject.nextSteps = parts[1].trim();
            } else {
                const stepLines = [];
                let j = i + 1;
                while (j < projectsEnd && lines[j] && !lines[j].includes('**') && !lines[j].trim().startsWith('-')) {
                    if (lines[j].trim()) {
                        stepLines.push(lines[j].replace(/^    /, ''));
                    }
                    j++;
                }
                currentProject.nextSteps = stepLines.join('\n').trim();
            }
        }
        
        if (line.includes('**Links**:')) {
            const parts = line.split('**Links**:');
            if (parts.length > 1) {
                const linksText = parts[1].trim();
                const linkMatches = [...linksText.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];
                linkMatches.forEach(match => {
                    currentProject.links.push({ alias: match[1], url: match[2] });
                });
            }
        }
        
        if (line.includes('**Weekly Review Checklist**')) {
            if (currentProject) {
                result.projects.push(currentProject);
            }
            break;
        }
    }
    
    if (currentProject && !result.projects.find(p => p.id === currentProject.id)) {
        result.projects.push(currentProject);
    }
    
    if (notesStart !== -1) {
        let currentNote = null;
        let noteContent = {};
        
        noteContent.nymbl = [];
        noteContent.cindy = [];
        noteContent.me = [];
        
        for (let i = notesStart + 1; i < lines.length; i++) {
            const line = lines[i];
            
            const noteHeaderMatch = line.match(/\*\*(.+?)\s+Notes:\*\*/);
            if (noteHeaderMatch) {
                const noteName = noteHeaderMatch[1];
                if (noteName === 'Nymbl') {
                    currentNote = 'nymbl';
                } else if (noteName === 'Cindy') {
                    currentNote = 'cindy';
                } else if (noteName === 'Personal') {
                    currentNote = 'me';
                } else {
                    const noteKey = noteName.toLowerCase().replace(/\s+/g, '_');
                    currentNote = noteKey;
                    if (!noteContent[noteKey]) {
                        noteContent[noteKey] = [];
                    }
                }
                continue;
            } else if (line.includes('**Timeline Data**') || line.includes('**Weekly Review Checklist**')) {
                break;
            } else if (line.startsWith('**') && line.endsWith('**') && !line.includes('Notes:')) {
                currentNote = null;
                continue;
            }
            
            if (currentNote && !line.includes('(No notes)')) {
                if (!noteContent[currentNote]) {
                    noteContent[currentNote] = [];
                }
                noteContent[currentNote].push(line);
            }
        }
        
        Object.keys(noteContent).forEach(key => {
            result.notes[key] = noteContent[key].join('\n').trim();
        });
    }
    
    result.categories = Array.from(categoriesSet).sort();
    result.statuses = Array.from(statusesSet).sort();
    result.users = Array.from(usersSet).sort();
    
    return result;
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const parsed = parsePKDContent(content);
            
            if (parsed.lastUpdated) {
                APP.lastUpdated = parsed.lastUpdated;
                document.getElementById('lastUpdatedText').textContent = `Last Updated: ${APP.lastUpdated}`;
            }
            
            if (parsed.projects.length > 0) {
                APP.projects = parsed.projects;
                APP.categories = parsed.categories;
                APP.statuses = parsed.statuses;
                APP.users = parsed.users;
                APP.notes = parsed.notes;
                
                if (parsed.timelineProjects) {
                    APP.timelineProjects = parsed.timelineProjects;
                }
                if (parsed.timelineMonthsToShow) {
                    APP.timelineMonthsToShow = parsed.timelineMonthsToShow;
                }
                if (parsed.timelineStartDate) {
                    APP.timelineStartDate = parsed.timelineStartDate;
                }
                
                const selector = document.getElementById('notesSelector');
                if (selector) {
                    selector.innerHTML = '';
                    
                    const displayNames = {
                        'nymbl': 'Nymbl',
                        'cindy': 'Cindy',
                        'me': 'Me'
                    };
                    
                    Object.keys(APP.notes).forEach(noteKey => {
                        const option = document.createElement('option');
                        const displayName = displayNames[noteKey] || 
                            noteKey.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        option.value = displayName;
                        option.textContent = displayName;
                        selector.appendChild(option);
                    });
                    
                    if (Object.keys(APP.notes).length > 0) {
                        const firstNoteKey = Object.keys(APP.notes)[0];
                        const firstDisplayName = displayNames[firstNoteKey] || 
                            firstNoteKey.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        APP.currentNoteName = firstDisplayName;
                        loadNotes();
                    }
                }
                
                saveToLocalStorage();
                updateStats();
                updateFilterDropdowns();
                renderProjects();
                
                showNotification(`Loaded ${APP.projects.length} projects with ${APP.categories.length} categories and ${APP.users.length} users`, 'success');
            } else {
                showNotification('No projects found in file', 'error');
            }
        } catch (error) {
            console.error('Parse error:', error);
            showNotification('Error parsing file: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ============================================================================
// TIMELINE - Core Functions
// ============================================================================

function renderTimeline() {
    const timelineWrapper = document.querySelector('.timeline-wrapper');
    if (!timelineWrapper) return;

    const currentYear = APP.timelineStartDate.getFullYear();
    const currentMonth = APP.timelineStartDate.getMonth();
    
    const months = [];
    
    for (let i = 0; i < APP.timelineMonthsToShow; i++) {
        const date = new Date(currentYear, currentMonth + i, 1);
        months.push({
            name: date.toLocaleDateString('en-US', { month: 'short' }),
            year: date.getFullYear()
        });
    }
    
    const yearSpans = [];
    let currentYearSpan = { year: months[0].year, count: 1 };
    
    for (let i = 1; i < months.length; i++) {
        if (months[i].year === currentYearSpan.year) {
            currentYearSpan.count++;
        } else {
            yearSpans.push(currentYearSpan);
            currentYearSpan = { year: months[i].year, count: 1 };
        }
    }
    yearSpans.push(currentYearSpan);
    
    const timelineHTML = `
        <div class="timeline-controls">
            <button class="btn-primary" onclick="shiftTimelineBack()">← Previous</button>
            <button class="btn-primary" onclick="resetTimelineToToday()">Today</button>
            <button class="btn-primary" onclick="shiftTimelineForward()">Next →</button>
            
            <div class="dropdown-filter">
                <button class="dropdown-button" onclick="toggleDropdown('timelineCategoryMenu')">
                    Filter by Category <span id="timelineCategoryCount"></span>
                </button>
                <div class="dropdown-menu" id="timelineCategoryMenu"></div>
            </div>
            
            <div class="dropdown-filter">
                <button class="dropdown-button" onclick="toggleDropdown('timelineStatusMenu')">
                    Filter by Status <span id="timelineStatusCount"></span>
                </button>
                <div class="dropdown-menu" id="timelineStatusMenu"></div>
            </div>
            
            <div class="dropdown-filter">
                <button class="dropdown-button" onclick="toggleDropdown('timelineUserMenu')">
                    Filter by User <span id="timelineUserCount"></span>
                </button>
                <div class="dropdown-menu" id="timelineUserMenu"></div>
            </div>
            
            <div style="flex: 1;"></div>
            <select id="timelineMonthsSelect" onchange="changeTimelineMonths()" style="padding: 0.5rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-size: 0.875rem;">
                <option value="6" ${APP.timelineMonthsToShow === 6 ? 'selected' : ''}>6 Months</option>
                <option value="12" ${APP.timelineMonthsToShow === 12 ? 'selected' : ''}>12 Months</option>
                <option value="18" ${APP.timelineMonthsToShow === 18 ? 'selected' : ''}>18 Months</option>
                <option value="24" ${APP.timelineMonthsToShow === 24 ? 'selected' : ''}>24 Months</option>
            </select>
        </div>
        <div class="timeline-header">
            <div class="timeline-year-row" style="grid-template-columns: 250px ${yearSpans.map(y => `repeat(${y.count}, 1fr)`).join(' ')};">
                <div class="timeline-year-cell" style="border-right: 2px solid var(--border-color);">Project</div>
                ${yearSpans.map(y => `<div class="timeline-year-cell" style="grid-column: span ${y.count};">${y.year}</div>`).join('')}
            </div>
            <div class="timeline-month-row" style="grid-template-columns: 250px repeat(${months.length}, 1fr);">
                <div class="timeline-month-cell" style="border-right: 2px solid var(--border-color);">Users & Allocation</div>
                ${months.map(m => `<div class="timeline-month-cell">${m.name}</div>`).join('')}
            </div>
        </div>
        <div class="timeline-body" id="timelineBody">
            ${getFilteredTimelineProjects().map((tp, idx) => renderTimelineProjectRow(tp, idx)).join('')}
            ${getFilteredTimelineProjects().length === 0 ? '<div style="text-align: center; padding: 3rem; color: var(--text-secondary);">No projects match the current filters. Add projects using the "+ Add to Timeline" button above.</div>' : ''}
        </div>
    `;
    
    timelineWrapper.innerHTML = timelineHTML;
    updateTimelineFilterDropdowns();
    
    const totalsHTML = renderTotalsTable();
    const totalsSection = document.createElement('div');
    totalsSection.innerHTML = totalsHTML;
    timelineWrapper.appendChild(totalsSection.firstChild);
}

function getFilteredTimelineProjects() {
    return APP.timelineProjects.filter((tp, index) => {
        const project = APP.projects.find(p => p.id === tp.projectId);
        if (!project) return false;
        
        if (APP.timelineFilters.categories.length > 0) {
            const hasCategory = project.categories && 
                project.categories.some(cat => APP.timelineFilters.categories.includes(cat));
            if (!hasCategory) return false;
        }
        
        if (APP.timelineFilters.statuses.length > 0) {
            if (!APP.timelineFilters.statuses.includes(project.status)) return false;
        }
        
        if (APP.timelineFilters.users.length > 0) {
            const hasUser = project.users && project.users.length > 0 &&
                project.users.some(user => APP.timelineFilters.users.includes(user));
            if (!hasUser) return false;
        }
        
        return true;
    }).map((tp, filteredIndex) => {
        const originalIndex = APP.timelineProjects.indexOf(tp);
        return { ...tp, originalIndex };
    });
}

function renderTimelineProjectRow(timelineProjectData, displayIndex) {
    const timelineProject = timelineProjectData;
    const actualIndex = timelineProject.originalIndex !== undefined ? timelineProject.originalIndex : displayIndex;
    const project = APP.projects.find(p => p.id === timelineProject.projectId);
    if (!project) return '';
    
    const startDate = timelineProject.startDate || null;
    const endDate = timelineProject.endDate || null;
    
    const currentYear = APP.timelineStartDate.getFullYear();
    const currentMonth = APP.timelineStartDate.getMonth();
    
    let ganttHTML = '<div style="color: var(--text-secondary); font-size: 0.75rem; padding: 0.5rem;">Click to set timeline</div>';
    
    if (startDate && endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        const timelineStart = new Date(currentYear, currentMonth, 1);
        
        const startPosition = dateToMonthPosition(startDateObj, timelineStart);
        const endPosition = dateToMonthPosition(endDateObj, timelineStart);
        
        const leftPercent = (startPosition / APP.timelineMonthsToShow) * 100;
        const widthPercent = ((endPosition - startPosition) / APP.timelineMonthsToShow) * 100;
        
        if (leftPercent < 100 && leftPercent + widthPercent > 0) {
            const clampedLeft = Math.max(0, leftPercent);
            const clampedWidth = Math.min(100 - clampedLeft, widthPercent + Math.min(0, leftPercent));
            
            const label = formatDateRangeLabel(startDateObj, endDateObj);
            
            ganttHTML = `
                <div class="timeline-gantt-bar" 
                     style="left: ${clampedLeft}%; width: ${clampedWidth}%;"
                     data-project-index="${actualIndex}">
                    <div class="timeline-gantt-handle timeline-gantt-handle-left" 
                         onmousedown="startGanttDrag(event, ${actualIndex}, 'resize-left')"></div>
                    <div class="timeline-gantt-bar-body"
                         onmousedown="startGanttDrag(event, ${actualIndex}, 'move')">
                        ${label}
                    </div>
                    <div class="timeline-gantt-handle timeline-gantt-handle-right" 
                         onmousedown="startGanttDrag(event, ${actualIndex}, 'resize-right')"></div>
                </div>
            `;
        }
    }
    
    return `
        <div class="timeline-project-row" 
             data-project-index="${actualIndex}"
             draggable="true"
             ondragstart="handleTimelineRowDragStart(event, ${actualIndex})"
             ondragover="handleTimelineRowDragOver(event)"
             ondrop="handleTimelineRowDrop(event, ${actualIndex})"
             ondragend="handleTimelineRowDragEnd(event)"
             ondragleave="handleTimelineRowDragLeave(event)">
            <div class="timeline-project-info" onclick="openAllocationModal(${actualIndex})">
                <div class="timeline-project-title">${project.title}</div>
                <div class="timeline-project-users">
                    ${project.users && project.users.length > 0 ? project.users.join(', ') : 'No users assigned'}
                </div>
            </div>
            <div class="timeline-gantt-container" onclick="handleGanttContainerClick(event, ${actualIndex})">
                ${ganttHTML}
            </div>
        </div>
    `;
}

function renderTotalsTable() {
    return '<div class="timeline-totals-section"><h3 class="timeline-totals-title">Resource Allocation Totals</h3><p style="color: var(--text-secondary);">Totals table not yet implemented</p></div>';
}

function dateToMonthPosition(date, timelineStart) {
    const yearDiff = date.getFullYear() - timelineStart.getFullYear();
    const monthDiff = date.getMonth() - timelineStart.getMonth();
    return yearDiff * 12 + monthDiff;
}

function formatDateRangeLabel(startDate, endDate) {
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
}

function shiftTimelineBack() {
    const currentYear = APP.timelineStartDate.getFullYear();
    const currentMonth = APP.timelineStartDate.getMonth();
    APP.timelineStartDate = new Date(currentYear, currentMonth - 1, 1);
    saveToLocalStorage();
    renderTimeline();
}

function shiftTimelineForward() {
    const currentYear = APP.timelineStartDate.getFullYear();
    const currentMonth = APP.timelineStartDate.getMonth();
    APP.timelineStartDate = new Date(currentYear, currentMonth + 1, 1);
    saveToLocalStorage();
    renderTimeline();
}

function resetTimelineToToday() {
    APP.timelineStartDate = new Date();
    APP.timelineStartDate.setDate(1);
    saveToLocalStorage();
    renderTimeline();
}

function changeTimelineMonths() {
    const select = document.getElementById('timelineMonthsSelect');
    APP.timelineMonthsToShow = parseInt(select.value);
    saveToLocalStorage();
    renderTimeline();
}

function handleGanttContainerClick(event, projectIndex) {
    event.stopPropagation();
    
    const timelineProject = APP.timelineProjects[projectIndex];
    if (!timelineProject) return;
    
    if (timelineProject.startDate && timelineProject.endDate) {
        return;
    }
    
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    timelineProject.startDate = startDate.toISOString().split('T')[0];
    timelineProject.endDate = endDate.toISOString().split('T')[0];
    
    saveToLocalStorage();
    renderTimeline();
    
    const project = APP.projects.find(p => p.id === timelineProject.projectId);
    showNotification(`Set timeline for "${project?.title}" to current month`, 'success');
}

function startGanttDrag(event, projectIndex, dragType) {
    event.stopPropagation();
    event.preventDefault();
    
    APP.isDraggingGantt = true;
    APP.ganttDragData = {
        projectIndex: projectIndex,
        dragType: dragType,
        startX: event.clientX,
        originalStartDate: APP.timelineProjects[projectIndex].startDate,
        originalEndDate: APP.timelineProjects[projectIndex].endDate
    };
    
    const bar = event.target.closest('.timeline-gantt-bar');
    if (bar) {
        bar.classList.add('dragging');
    }
    
    document.addEventListener('mousemove', handleGanttDragMove);
    document.addEventListener('mouseup', handleGanttDragEnd);
    
    document.body.style.cursor = dragType === 'move' ? 'grabbing' : 'ew-resize';
}

function handleGanttDragMove(event) {
    if (!APP.isDraggingGantt || !APP.ganttDragData) return;
    
    const container = document.querySelector('.timeline-gantt-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width;
    const monthWidth = containerWidth / APP.timelineMonthsToShow;
    
    const deltaX = event.clientX - APP.ganttDragData.startX;
    const monthsDelta = Math.round(deltaX / monthWidth);
    
    if (monthsDelta === 0) return;
    
    const timelineProject = APP.timelineProjects[APP.ganttDragData.projectIndex];
    const originalStart = new Date(APP.ganttDragData.originalStartDate);
    const originalEnd = new Date(APP.ganttDragData.originalEndDate);
    
    let newStart, newEnd;
    
    if (APP.ganttDragData.dragType === 'move') {
        newStart = new Date(originalStart.getFullYear(), originalStart.getMonth() + monthsDelta, 1);
        newEnd = new Date(originalEnd.getFullYear(), originalEnd.getMonth() + monthsDelta, originalEnd.getDate());
    } else if (APP.ganttDragData.dragType === 'resize-left') {
        newStart = new Date(originalStart.getFullYear(), originalStart.getMonth() + monthsDelta, 1);
        newEnd = originalEnd;
        
        if (newStart >= newEnd) {
            return;
        }
    } else if (APP.ganttDragData.dragType === 'resize-right') {
        newStart = originalStart;
        const tempEnd = new Date(originalEnd.getFullYear(), originalEnd.getMonth() + monthsDelta + 1, 0);
        newEnd = tempEnd;
        
        if (newEnd <= newStart) {
            return;
        }
    }
    
    timelineProject.startDate = newStart.toISOString().split('T')[0];
    timelineProject.endDate = newEnd.toISOString().split('T')[0];
    
    renderTimeline();
}

function handleGanttDragEnd(event) {
    if (!APP.isDraggingGantt) return;
    
    APP.isDraggingGantt = false;
    APP.ganttDragData = null;
    
    document.removeEventListener('mousemove', handleGanttDragMove);
    document.removeEventListener('mouseup', handleGanttDragEnd);
    
    document.body.style.cursor = '';
    
    saveToLocalStorage();
    
    const bars = document.querySelectorAll('.timeline-gantt-bar');
    bars.forEach(bar => bar.classList.remove('dragging'));
}

function openAllocationModal(projectIndex) {
    showNotification('Allocation modal not yet implemented', 'info');
}

function handleTimelineRowDragStart(event, projectIndex) {
    APP.timelineDragIndex = projectIndex;
    event.target.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
}

function handleTimelineRowDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const row = event.currentTarget;
    if (!row.classList.contains('dragging')) {
        row.classList.add('drag-over');
    }
}

function handleTimelineRowDragLeave(event) {
    const row = event.currentTarget;
    row.classList.remove('drag-over');
}

function handleTimelineRowDrop(event, targetIndex) {
    event.preventDefault();
    const row = event.currentTarget;
    row.classList.remove('drag-over');
    
    if (APP.timelineDragIndex === undefined || APP.timelineDragIndex === targetIndex) {
        return;
    }
    
    const draggedItem = APP.timelineProjects[APP.timelineDragIndex];
    APP.timelineProjects.splice(APP.timelineDragIndex, 1);
    
    const newIndex = APP.timelineDragIndex < targetIndex ? targetIndex - 1 : targetIndex;
    APP.timelineProjects.splice(newIndex, 0, draggedItem);
    
    saveToLocalStorage();
    renderTimeline();
}

function handleTimelineRowDragEnd(event) {
    event.target.classList.remove('dragging');
    APP.timelineDragIndex = undefined;
    document.querySelectorAll('.timeline-project-row').forEach(row => {
        row.classList.remove('drag-over');
    });
}

// ============================================================================
// TIMELINE - Add Project Functions
// ============================================================================

function showAddTimelineProjectMenu() {
    const availableProjects = APP.projects.filter(p => {
        return !APP.timelineProjects.some(tp => tp.projectId === p.id);
    });
    
    if (availableProjects.length === 0) {
        showNotification('All projects are already in the timeline', 'info');
        return;
    }
    
    const menuDiv = document.createElement('div');
    menuDiv.id = 'addTimelineProjectMenu';
    menuDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 9999;';
    
    menuDiv.innerHTML = `
        <div style="background: rgba(35, 35, 38, 0.98); backdrop-filter: blur(10px); border: 1px solid var(--border-color); border-radius: 12px; padding: 2rem; max-width: 500px; max-height: 70vh; overflow-y: auto; box-shadow: var(--shadow);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="color: var(--text-primary); margin: 0;">Add Project to Timeline</h3>
                <button onclick="closeAddTimelineProjectMenu()" style="background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${availableProjects.map(p => `
                    <div onclick="addProjectToTimeline(${p.id})" style="padding: 1rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                        <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${p.title}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">
                            ${p.status} ${p.categories && p.categories.length > 0 ? '• ' + p.categories.join(', ') : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(menuDiv);
}

function closeAddTimelineProjectMenu() {
    const menu = document.getElementById('addTimelineProjectMenu');
    if (menu) {
        menu.remove();
    }
}

function addProjectToTimeline(projectId) {
    const project = APP.projects.find(p => p.id === projectId);
    if (!project) return;
    
    if (APP.timelineProjects.some(tp => tp.projectId === projectId)) {
        showNotification('Project is already in the timeline', 'error');
        closeAddTimelineProjectMenu();
        return;
    }
    
    APP.timelineProjects.push({
        projectId: projectId,
        allocations: {},
        startDate: null,
        endDate: null
    });
    
    saveToLocalStorage();
    renderTimeline();
    closeAddTimelineProjectMenu();
    showNotification(`Added "${project.title}" to timeline`, 'success');
}
