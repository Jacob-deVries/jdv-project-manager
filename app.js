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
    PASSWORD_HASH: 2147093827
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
            notes: APP.notes
        };
        try {
            localStorage.setItem('pkdDashboardData', JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }
}

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

function openCreateModal() {
    if (APP.categories.length === 0) {
        showNotification('Please upload a PKD file first or add categories in Manage Settings', 'error');
        return;
    }
    
    APP.currentEditingProject = null;
    APP.currentProjectLinks = [];
    
    const modal = createEditModal();
    document.body.appendChild(modal);
    
    const maxId = APP.projects.length > 0 ? Math.max(...APP.projects.map(p => p.id)) + 1 : 1;
    document.getElementById('projectIdInput').value = maxId;
    
    const maxPriority = APP.projects.length > 0 ? Math.max(...APP.projects.map(p => p.priority || 999)) + 1 : 1;
    document.getElementById('projectPriorityInput').value = maxPriority;
    
    const statusSelect = document.getElementById('projectStatusSelect');
    if (APP.statuses.includes('idea')) {
        statusSelect.value = 'idea';
    } else if (APP.statuses.length > 0) {
        statusSelect.value = APP.statuses[0];
    }
    
    modal.style.display = 'block';
}

function openEditModal(id) {
    APP.currentEditingProject = id;
    const project = APP.projects.find(p => p.id === id);
    if (!project) return;
    
    APP.currentProjectLinks = project.links ? [...project.links] : [];
    
    const modal = createEditModal();
    document.body.appendChild(modal);
    
    document.getElementById('projectIdInput').value = project.id;
    document.getElementById('projectTitleInput').value = project.title;
    document.getElementById('projectStatusSelect').value = project.status;
    document.getElementById('projectPriorityInput').value = project.priority || 999;
    document.getElementById('projectDetailsInput').value = project.keyDetails || '';
    document.getElementById('projectNextStepsInput').value = project.nextSteps || '';
    
    if (project.categories) {
        project.categories.forEach(cat => {
            const checkbox = document.getElementById(`cat-check-${cat}`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    if (project.users && project.users.length > 0) {
        project.users.forEach(user => {
            const checkbox = document.getElementById(`user-check-${user}`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    updateLinksDisplay();
    modal.style.display = 'block';
}

function createEditModal() {
    const existing = document.getElementById('editModal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'editModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${APP.currentEditingProject ? 'Edit Project' : 'Create New Project'}</h2>
                <button class="close-btn" onclick="closeEditModal()">&times;</button>
            </div>
            <div class="form-group">
                <label class="form-label">Project ID</label>
                <input type="text" class="form-input" id="projectIdInput" disabled>
            </div>
            <div class="form-group">
                <label class="form-label">Priority (lower numbers appear first)</label>
                <input type="number" class="form-input" id="projectPriorityInput" placeholder="1" min="1">
            </div>
            <div class="form-group">
                <label class="form-label">Title *</label>
                <input type="text" class="form-input" id="projectTitleInput" placeholder="Enter project title">
            </div>
            <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-select" id="projectStatusSelect">
                    ${APP.statuses.length > 0 ? 
                        APP.statuses.map(s => `<option value="${s}">${s}</option>`).join('') :
                        '<option value="idea">idea</option>'}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Users</label>
                <div id="userCheckboxes" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    ${APP.users.length > 0 ? 
                        APP.users.map(user => `
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" id="user-check-${user}" value="${user}">
                                ${user}
                            </label>
                        `).join('') :
                        '<span style="color: var(--text-secondary);">No users available</span>'}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Categories ${APP.categories.length === 0 ? '(Add categories in Manage Settings)' : '*'}</label>
                <div id="categoryCheckboxes" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    ${APP.categories.length > 0 ? 
                        APP.categories.map(cat => `
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" id="cat-check-${cat}" value="${cat}">
                                ${cat}
                            </label>
                        `).join('') :
                        '<span style="color: var(--text-secondary);">No categories available</span>'}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Key Details</label>
                <textarea class="form-textarea" id="projectDetailsInput" placeholder="Enter key details..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Next Steps</label>
                <textarea class="form-textarea" id="projectNextStepsInput" placeholder="Enter next steps..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Links</label>
                <div id="projectLinksDisplay" style="margin-bottom: 1rem;"></div>
                <button class="btn-primary" onclick="addLink()" style="font-size: 0.875rem; padding: 0.5rem 1rem;">Add Link</button>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button class="btn-primary" onclick="closeEditModal()" style="background: var(--bg-secondary); border: 1px solid var(--pastel-red); color: var(--pastel-red); font-weight: 500;">Cancel</button>
                <button class="btn-save" onclick="saveProject()">Save Project</button>
            </div>
        </div>
    `;
    
    updateLinksDisplay();
    return modal;
}

function updateLinksDisplay() {
    const container = document.getElementById('projectLinksDisplay');
    if (!container) return;
    
    if (APP.currentProjectLinks.length === 0) {
        container.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.875rem;">No links added</div>';
    } else {
        container.innerHTML = APP.currentProjectLinks.map((link, idx) => `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <a href="${link.url}" target="_blank" style="color: var(--pastel-blue);">${link.alias}</a>
                <button onclick="removeLink(${idx})" style="padding: 0.25rem 0.5rem; background: var(--pastel-red); color: var(--bg-primary); border: none; border-radius: 4px; font-size: 0.75rem; cursor: pointer; font-weight: 500;">Remove</button>
            </div>
        `).join('');
    }
}

function addLink() {
    const container = document.getElementById('projectLinksDisplay');
    if (!container) return;
    
    if (document.getElementById('linkAddForm')) return;
    
    const formDiv = document.createElement('div');
    formDiv.id = 'linkAddForm';
    formDiv.style.cssText = 'padding: 1rem; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 1rem;';
    formDiv.innerHTML = `
        <div style="margin-bottom: 0.5rem;">
            <input type="text" id="linkAliasInput" placeholder="Display text" style="width: 100%; padding: 0.5rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); margin-bottom: 0.5rem;">
            <input type="url" id="linkUrlInput" placeholder="https://example.com" style="width: 100%; padding: 0.5rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary);">
        </div>
        <div style="display: flex; gap: 0.5rem;">
            <button onclick="saveLinkFromForm()" style="padding: 0.5rem 1rem; background: var(--pastel-green); color: var(--bg-primary); border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">Save</button>
            <button onclick="cancelLinkForm()" style="padding: 0.5rem 1rem; background: var(--bg-secondary); border: 1px solid var(--pastel-red); color: var(--pastel-red); border-radius: 4px; cursor: pointer; font-weight: 500;">Cancel</button>
        </div>
    `;
    
    container.parentNode.insertBefore(formDiv, container);
}

function saveLinkFromForm() {
    const aliasInput = document.getElementById('linkAliasInput');
    const urlInput = document.getElementById('linkUrlInput');
    
    if (!aliasInput || !urlInput) return;
    
    const alias = aliasInput.value.trim();
    const url = urlInput.value.trim();
    
    if (!alias || !url) {
        showNotification('Please enter both display text and URL', 'error');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showNotification('URL must start with http:// or https://', 'error');
        return;
    }
    
    APP.currentProjectLinks.push({ alias, url });
    updateLinksDisplay();
    
    const form = document.getElementById('linkAddForm');
    if (form) form.remove();
    
    showNotification('Link added successfully', 'success');
}

function cancelLinkForm() {
    const form = document.getElementById('linkAddForm');
    if (form) form.remove();
}

function removeLink(index) {
    APP.currentProjectLinks.splice(index, 1);
    updateLinksDisplay();
    showNotification('Link removed', 'success');
}

function saveProject() {
    const id = parseInt(document.getElementById('projectIdInput').value);
    const priority = parseInt(document.getElementById('projectPriorityInput').value) || 999;
    const title = document.getElementById('projectTitleInput').value.trim();
    const status = document.getElementById('projectStatusSelect').value;
    const keyDetails = document.getElementById('projectDetailsInput').value.trim();
    const nextSteps = document.getElementById('projectNextStepsInput').value.trim();
    
    const categories = [];
    document.querySelectorAll('#categoryCheckboxes input:checked').forEach(cb => {
        categories.push(cb.value);
    });
    
    const users = [];
    document.querySelectorAll('#userCheckboxes input:checked').forEach(cb => {
        users.push(cb.value);
    });
    
    if (!title) {
        showNotification('Please enter a project title', 'error');
        return;
    }
    
    if (categories.length === 0) {
        showNotification('Please select at least one category', 'error');
        return;
    }
    
    const projectData = {
        id,
        priority,
        title,
        status,
        users: users,
        categories,
        keyDetails,
        nextSteps,
        links: APP.currentProjectLinks
    };
    
    if (APP.currentEditingProject) {
        const index = APP.projects.findIndex(p => p.id === APP.currentEditingProject);
        if (index !== -1) {
            APP.projects[index] = projectData;
            showNotification('Project updated successfully', 'success');
        }
    } else {
        APP.projects.push(projectData);
        showNotification('Project created successfully', 'success');
    }
    
    const now = new Date();
    APP.lastUpdated = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('lastUpdatedText').textContent = `Last Updated: ${APP.lastUpdated}`;
    
    saveToLocalStorage();
    updateStats();
    renderProjects();
    closeEditModal();
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.remove();
}

function openProjectModal(id) {
    const project = APP.projects.find(p => p.id === id);
    if (!project) return;
    
    const modal = document.createElement('div');
    modal.id = 'projectModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${project.title}</h2>
                <button class="close-btn" onclick="closeProjectModal()">&times;</button>
            </div>
            <div class="form-group">
                <label class="form-label">Project ID</label>
                <div>${project.id}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Priority</label>
                <div>${project.priority || 999}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Status</label>
                <div><span style="background: var(--pastel-blue); color: var(--bg-primary); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.875rem; font-weight: 500;">${project.status}</span></div>
            </div>
            ${project.users && project.users.length > 0 ? `
            <div class="form-group">
                <label class="form-label">Assigned Users</label>
                <div>${project.users.join(', ')}</div>
            </div>
            ` : ''}
            <div class="form-group">
                <label class="form-label">Categories</label>
                <div>${project.categories ? project.categories.join(', ') : 'None'}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Key Details</label>
                <div style="white-space: pre-wrap; line-height: 1.5;">${project.keyDetails || 'No details provided'}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Next Steps</label>
                <div style="white-space: pre-wrap; line-height: 1.5;">${project.nextSteps || 'No next steps defined'}</div>
            </div>
            ${project.links && project.links.length > 0 ? `
                <div class="form-group">
                    <label class="form-label">Links</label>
                    <div>
                        ${project.links.map(link => 
                            `<div style="margin-bottom: 0.5rem;"><a href="${link.url}" target="_blank" style="color: var(--pastel-blue);">${link.alias}</a></div>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) modal.remove();
}

function openManageModal() {
    const modal = document.createElement('div');
    modal.id = 'manageModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Manage Settings</h2>
                <button class="close-btn" onclick="closeManageModal()">&times;</button>
            </div>
            
            <div class="form-group">
                <label class="form-label">Categories</label>
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    <input type="text" class="form-input" id="newCategoryInput" placeholder="Enter category name" style="flex: 1;">
                    <button class="btn-save" onclick="addCategory()">Add</button>
                </div>
                <div id="categoriesList">
                    ${APP.categories.map((cat, idx) => `
                        <div class="settings-list-item">
                            <span class="drag-handle">≡</span>
                            <input type="text" id="cat-edit-${idx}" value="${cat}" style="flex: 1; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; padding: 0.25rem 0.5rem; color: var(--text-primary);">
                            <button onclick="deleteCategory('${cat.replace(/'/g, "\\'")}')" style="padding: 0.25rem 0.5rem; background: var(--pastel-red); color: var(--bg-primary); border: none; border-radius: 4px; font-size: 0.75rem; cursor: pointer; font-weight: 500;">Delete</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Statuses</label>
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    <input type="text" class="form-input" id="newStatusInput" placeholder="Enter status name" style="flex: 1;">
                    <button class="btn-save" onclick="addStatus()">Add</button>
                </div>
                <div id="statusesList">
                    ${APP.statuses.map((status, idx) => `
                        <div class="settings-list-item">
                            <span class="drag-handle">≡</span>
                            <input type="text" id="status-edit-${idx}" value="${status}" style="flex: 1; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; padding: 0.25rem 0.5rem; color: var(--text-primary);">
                            <button onclick="deleteStatus('${status}')" style="padding: 0.25rem 0.5rem; background: var(--pastel-red); color: var(--bg-primary); border: none; border-radius: 4px; font-size: 0.75rem; cursor: pointer; font-weight: 500;">Delete</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Users</label>
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    <input type="text" class="form-input" id="newUserInput" placeholder="Enter user name" style="flex: 1;">
                    <button class="btn-save" onclick="addUser()">Add</button>
                </div>
                <div id="usersList">
                    ${APP.users.map((user, idx) => `
                        <div class="settings-list-item">
                            <span class="drag-handle">≡</span>
                            <input type="text" id="user-edit-${idx}" value="${user}" style="flex: 1; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; padding: 0.25rem 0.5rem; color: var(--text-primary);">
                            <button onclick="deleteUser('${user.replace(/'/g, "\\'")}')" style="padding: 0.25rem 0.5rem; background: var(--pastel-red); color: var(--bg-primary); border: none; border-radius: 4px; font-size: 0.75rem; cursor: pointer; font-weight: 500;">Delete</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeManageModal() {
    const modal = document.getElementById('manageModal');
    if (modal) modal.remove();
}

function addCategory() {
    const input = document.getElementById('newCategoryInput');
    const category = input.value.trim();
    
    if (!category) {
        showNotification('Please enter a category name', 'error');
        return;
    }
    
    if (APP.categories.includes(category)) {
        showNotification('This category already exists', 'error');
        return;
    }
    
    APP.categories.push(category);
    saveToLocalStorage();
    updateFilterDropdowns();
    closeManageModal();
    setTimeout(() => openManageModal(), 100);
    showNotification('Category added successfully', 'success');
}

function deleteCategory(category) {
    showConfirm(`Delete category "${category}"? This will remove it from all projects.`, function() {
        APP.categories = APP.categories.filter(c => c !== category);
        APP.projects.forEach(p => {
            if (p.categories) {
                p.categories = p.categories.filter(c => c !== category);
            }
        });
        saveToLocalStorage();
        updateFilterDropdowns();
        renderProjects();
        closeManageModal();
        setTimeout(() => openManageModal(), 100);
        showNotification('Category deleted successfully', 'success');
    });
}

function addStatus() {
    const input = document.getElementById('newStatusInput');
    const status = input.value.trim().toLowerCase().replace(/\s+/g, '-');
    
    if (!status) {
        showNotification('Please enter a status name', 'error');
        return;
    }
    
    if (APP.statuses.includes(status)) {
        showNotification('This status already exists', 'error');
        return;
    }
    
    APP.statuses.push(status);
    saveToLocalStorage();
    updateFilterDropdowns();
    closeManageModal();
    setTimeout(() => openManageModal(), 100);
    showNotification('Status added successfully', 'success');
}

function deleteStatus(status) {
    showConfirm(`Delete status "${status}"? Projects with this status will be set to "idea".`, function() {
        APP.statuses = APP.statuses.filter(s => s !== status);
        APP.projects.forEach(p => {
            if (p.status === status) p.status = 'idea';
        });
        saveToLocalStorage();
        updateFilterDropdowns();
        renderProjects();
        closeManageModal();
        setTimeout(() => openManageModal(), 100);
        showNotification('Status deleted successfully', 'success');
    });
}

function addUser() {
    const input = document.getElementById('newUserInput');
    const user = input.value.trim();
    
    if (!user) {
        showNotification('Please enter a user name', 'error');
        return;
    }
    
    if (APP.users.includes(user)) {
        showNotification('This user already exists', 'error');
        return;
    }
    
    APP.users.push(user);
    saveToLocalStorage();
    updateFilterDropdowns();
    closeManageModal();
    setTimeout(() => openManageModal(), 100);
    showNotification('User added successfully', 'success');
}

function deleteUser(user) {
    showConfirm(`Delete user "${user}"? This will remove them from all projects.`, function() {
        APP.users = APP.users.filter(u => u !== user);
        APP.projects.forEach(p => {
            if (p.users && p.users.length > 0) {
                p.users = p.users.filter(u => u !== user);
            }
        });
        saveToLocalStorage();
        updateFilterDropdowns();
        renderProjects();
        closeManageModal();
        setTimeout(() => openManageModal(), 100);
        showNotification('User deleted successfully', 'success');
    });
}

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
    
    APP.projects.forEach(proj => {
        content += `**${proj.id}. ${proj.title}**\n\n`;
        content += `-   **Status**: ${proj.status}\n\n`;
        content += `-   **Priority**: ${proj.priority || 999}\n\n`;
        content += `-   **Project Category**: ${proj.categories ? proj.categories.join(', ') : ''}\n\n`;
        if (proj.users && proj.users.length > 0) {
            content += `-   **Users**: ${proj.users.join(', ')}\n\n`;
        }
        
        content += `-   **Key Details**: `;
        if (proj.keyDetails && proj.keyDetails.trim()) {
            const detailLines = proj.keyDetails.split('\n');
            if (detailLines.length === 1) {
                content += `${proj.keyDetails}\n\n`;
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
        if (proj.nextSteps && proj.nextSteps.trim()) {
            const stepLines = proj.nextSteps.split('\n');
            if (stepLines.length === 1) {
                content += `${proj.nextSteps}\n\n`;
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
        
        if (proj.links && proj.links.length > 0) {
            content += `-   **Links**: `;
            proj.links.forEach((link, idx) => {
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
        }
    };
    
    const categoriesSet = new Set();
    const statusesSet = new Set();
    const usersSet = new Set();
    
    const lines = content.split('\n');
    
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
            } else if (line.includes('**Weekly Review Checklist**')) {
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

// Add this to app.js - View switching functionality with proper timeline initialization

let currentView = 'projects';

function switchView(view) {
    currentView = view;
    
    // Hide all views
    document.getElementById('projectsView').classList.remove('active');
    document.getElementById('timelineView').classList.remove('active');
    
    // Reset all buttons to default state
    document.getElementById('btnProjectsView').style.background = 'var(--bg-secondary)';
    document.getElementById('btnProjectsView').style.border = '1px solid var(--border-color)';
    document.getElementById('btnProjectsView').style.color = 'var(--text-primary)';
    
    document.getElementById('btnTimelineView').style.background = 'var(--bg-secondary)';
    document.getElementById('btnTimelineView').style.border = '1px solid var(--border-color)';
    document.getElementById('btnTimelineView').style.color = 'var(--text-primary)';
    
    // Show selected view and update button
    if (view === 'projects') {
        document.getElementById('projectsView').classList.add('active');
        document.getElementById('btnProjectsView').style.background = 'var(--pastel-blue)';
        document.getElementById('btnProjectsView').style.border = 'none';
        document.getElementById('btnProjectsView').style.color = 'var(--bg-primary)';
        document.getElementById('btnProjectsView').style.fontWeight = '600';
    } else if (view === 'timeline') {
        document.getElementById('timelineView').classList.add('active');
        document.getElementById('btnTimelineView').style.background = 'var(--pastel-blue)';
        document.getElementById('btnTimelineView').style.border = 'none';
        document.getElementById('btnTimelineView').style.color = 'var(--bg-primary)';
        document.getElementById('btnTimelineView').style.fontWeight = '600';
        
        // Initialize timeline on first switch
        if (!TIMELINE.initialized) {
            initTimeline();
            TIMELINE.initialized = true;
        } else {
            // Reload timeline data when switching back to timeline view
            loadTimelineData();
            renderTimeline();
        }
    }
}

// Initialize view on load
document.addEventListener('DOMContentLoaded', function() {
    switchView('projects');
});
