// ===========================
// APP STATE & INITIALIZATION
// ===========================

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
    },
    currentNoteName: '',
    PASSWORD_HASH: 2147093827,
    currentView: 'projects',
    timelineProjects: [],
    dragState: null,
    timelineStartMonth: new Date().getMonth()
};

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

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

function saveToLocalStorage() {
    if (typeof localStorage !== 'undefined') {
        const data = {
            projects: APP.projects,
            categories: APP.categories,
            statuses: APP.statuses,
            users: APP.users,
            lastUpdated: APP.lastUpdated,
            notes: APP.notes,
            timelineProjects: APP.timelineProjects
        };
        try {
            localStorage.setItem('pkdDashboardData', JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }
}

// ===========================
// UI HELPERS & NOTIFICATIONS
// ===========================

function updateStats() {
    const active = APP.projects.filter(p => p.status !== 'complete').length;
    const complete = APP.projects.filter(p => p.status === 'complete').length;
    
    document.getElementById('activeCount').textContent = active;
    document.getElementById('completeCount').textContent = complete;
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

// ===========================
// FILTERS & DROPDOWNS
// ===========================

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
    APP.categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        const isChecked = APP.selectedCategories.includes(cat) ? 'checked' : '';
        item.innerHTML = `
            <input type="checkbox" id="cat-${cat}" onchange="toggleCategory('${cat}')" ${isChecked}>
            <label for="cat-${cat}">${cat}</label>
        `;
        categoryMenu.appendChild(item);
    });

    const statusMenu = document.getElementById('statusMenu');
    statusMenu.innerHTML = '';
    APP.statuses.forEach(status => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        const isChecked = APP.selectedStatuses.includes(status) ? 'checked' : '';
        item.innerHTML = `
            <input type="checkbox" id="status-${status}" onchange="toggleStatus('${status}')" ${isChecked}>
            <label for="status-${status}">${status}</label>
        `;
        statusMenu.appendChild(item);
    });

    const userMenu = document.getElementById('userMenu');
    userMenu.innerHTML = '';
    APP.users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        const isChecked = APP.selectedUsers.includes(user) ? 'checked' : '';
        item.innerHTML = `
            <input type="checkbox" id="user-${user}" onchange="toggleUser('${user}')" ${isChecked}>
            <label for="user-${user}">${user}</label>
        `;
        userMenu.appendChild(item);
    });
    
    updateFilterCounts();
}

function toggleDropdown(menuId) {
    const menu = document.getElementById(menuId);
    menu.classList.toggle('open');
}

function toggleCategory(category) {
    const index = APP.selectedCategories.indexOf(category);
    if (index > -1) {
        APP.selectedCategories.splice(index, 1);
    } else {
        APP.selectedCategories.push(category);
    }
    updateFilterCounts();
    renderProjects();
}

function toggleStatus(status) {
    const index = APP.selectedStatuses.indexOf(status);
    if (index > -1) {
        APP.selectedStatuses.splice(index, 1);
    } else {
        APP.selectedStatuses.push(status);
    }
    updateFilterCounts();
    renderProjects();
}

function toggleUser(user) {
    const index = APP.selectedUsers.indexOf(user);
    if (index > -1) {
        APP.selectedUsers.splice(index, 1);
    } else {
        APP.selectedUsers.push(user);
    }
    updateFilterCounts();
    renderProjects();
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

// ===========================
// PROJECTS RENDERING
// ===========================

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

function markComplete(id) {
    const project = APP.projects.find(p => p.id === id);
    if (!project) return;
    
    showConfirm(`Mark "${project.title}" as complete?`, function() {
        project.status = 'complete';
        
        saveToLocalStorage();
        updateStats();
        renderProjects();
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
        showNotification('Project deleted successfully', 'success');
    });
}

// ===========================
// NOTES MANAGEMENT
// ===========================

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

// ===========================
// EVENT LISTENERS
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
        passwordInput.focus();
    }
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown-filter')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('open');
            });
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => modal.remove());
        }
    });
});
