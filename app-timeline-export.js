// ===========================
// PROJECT MODALS & EDITING
// ===========================

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
            const oldProject = APP.projects[index];
            projectData.startDate = oldProject.startDate;
            projectData.endDate = oldProject.endDate;
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

// ===========================
// SETTINGS MANAGEMENT
// ===========================

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

// ===========================
// VIEW SWITCHING & TIMELINE
// ===========================

function switchView(view) {
    APP.currentView = view;
    
    if (view === 'projects') {
        document.getElementById('projectsView').style.display = 'grid';
        document.getElementById('timelineView').style.display = 'none';
        document.getElementById('projectsViewBtn').classList.add('active');
        document.getElementById('timelineViewBtn').classList.remove('active');
    } else if (view === 'timeline') {
        document.getElementById('projectsView').style.display = 'none';
        document.getElementById('timelineView').style.display = 'block';
        document.getElementById('projectsViewBtn').classList.remove('active');
        document.getElementById('timelineViewBtn').classList.add('active');
        renderTimelineFilters();
        renderTimeline();
    }
}

function openAddToTimelineModal() {
    const modal = document.createElement('div');
    modal.id = 'addToTimelineModal';
    modal.className = 'modal';
    
    const availableProjects = APP.projects.filter(p => {
        return !APP.timelineProjects.find(tp => tp.projectId === p.id);
    });
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add Projects to Timeline</h2>
                <button class="close-btn" onclick="closeAddToTimelineModal()">&times;</button>
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
                ${availableProjects.length > 0 ? availableProjects.map(p => `
                    <label style="display: flex; align-items: center; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.2s;">
                        <input type="checkbox" value="${p.id}" style="margin-right: 0.75rem;">
                        <div>
                            <div style="font-weight: 500;">${p.title}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">ID: ${p.id} | Status: ${p.status}</div>
                        </div>
                    </label>
                `).join('') : '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">All projects are already on the timeline</div>'}
            </div>
            ${availableProjects.length > 0 ? `
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button class="btn-primary" onclick="closeAddToTimelineModal()" style="background: var(--bg-secondary); border: 1px solid var(--pastel-red); color: var(--pastel-red);">Cancel</button>
                    <button class="btn-save" onclick="addProjectsToTimeline()">Add Selected</button>
                </div>
            ` : ''}
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeAddToTimelineModal() {
    const modal = document.getElementById('addToTimelineModal');
    if (modal) modal.remove();
}

function addProjectsToTimeline() {
    const modal = document.getElementById('addToTimelineModal');
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
    
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    checkboxes.forEach(cb => {
        const projectId = parseInt(cb.value);
        const project = APP.projects.find(p => p.id === projectId);
        
        if (project && !APP.timelineProjects.find(tp => tp.projectId === projectId)) {
            APP.timelineProjects.push({
                projectId: projectId,
                startDate: project.startDate || firstDay.toISOString().split('T')[0],
                endDate: project.endDate || lastDay.toISOString().split('T')[0]
            });
            
            if (!project.startDate) project.startDate = firstDay.toISOString().split('T')[0];
            if (!project.endDate) project.endDate = lastDay.toISOString().split('T')[0];
        }
    });
    
    APP.timelineProjects.sort((a, b) => {
        const projectA = APP.projects.find(p => p.id === a.projectId);
        const projectB = APP.projects.find(p => p.id === b.projectId);
        
        const priorityA = projectA?.priority ?? 999;
        const priorityB = projectB?.priority ?? 999;
        
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        
        return a.projectId - b.projectId;
    });
    
    saveToLocalStorage();
    closeAddToTimelineModal();
    renderTimeline();
    showNotification(`Added ${checkboxes.length} project(s) to timeline`, 'success');
}

function shiftTimelineMonth(direction) {
    if (direction > 0) {
        APP.timelineStartMonth = (APP.timelineStartMonth + 1) % 24;
    } else if (direction < 0) {
        APP.timelineStartMonth = (APP.timelineStartMonth - 1 + 24) % 24;
    }
    
    renderTimeline();
}

function moveTimelineProject(projectId, direction) {
    const filteredProjects = getFilteredTimelineProjects();
    const currentIndex = filteredProjects.findIndex(tp => tp.projectId === projectId);
    if (currentIndex === -1) return;
    
    const actualIndex = APP.timelineProjects.findIndex(tp => tp.projectId === projectId);
    if (actualIndex === -1) return;
    
    const newIndex = actualIndex + direction;
    if (newIndex < 0 || newIndex >= APP.timelineProjects.length) return;
    
    [APP.timelineProjects[actualIndex], APP.timelineProjects[newIndex]] = 
    [APP.timelineProjects[newIndex], APP.timelineProjects[actualIndex]];
    
    saveToLocalStorage();
    renderTimeline();
}

function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    
    const filteredProjects = getFilteredTimelineProjects();
    
    if (filteredProjects.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-secondary);"><h3>No Projects on Timeline</h3><p style="margin-top: 1rem;">Click "Add Project to Timeline" to get started.</p></div>';
        return;
    }
    
    const now = new Date();
    const months = [];
    const startMonth = APP.timelineStartMonth;
    
    for (let i = 0; i < 12; i++) {
        const monthIndex = (startMonth + i) % 12;
        const year = now.getFullYear() + Math.floor((startMonth + i) / 12);
        months.push(new Date(year, monthIndex, 1));
    }
    
    let maxProjectNameLength = "Month".length;
    filteredProjects.forEach(tp => {
        const project = APP.projects.find(p => p.id === tp.projectId);
        if (project && project.title.length > maxProjectNameLength) {
            maxProjectNameLength = project.title.length;
        }
    });
    const projectColumnWidth = Math.max(200, maxProjectNameLength * 7.5 + 32 + 95);
    
    let html = '<div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden;">';
    
    html += `<div class="timeline-row" style="grid-template-columns: ${projectColumnWidth}px auto 1fr;">`;
    html += '<div class="timeline-label timeline-header"></div>';
    html += '<div class="timeline-nav-controls" style="display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 0.5rem; background: var(--bg-secondary); border-right: 1px solid var(--border-color);">';
    html += '<button onclick="shiftTimelineMonth(-1)" style="padding: 0.5rem 1rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); cursor: pointer; font-weight: 500;">← Prev</button>';
    html += `<span style="font-size: 0.875rem; color: var(--text-secondary); min-width: 100px; text-align: center;">${months[0].toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${months[11].toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>`;
    html += '<button onclick="shiftTimelineMonth(1)" style="padding: 0.5rem 1rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); cursor: pointer; font-weight: 500;">Next →</button>';
    html += '</div></div>';
    
    html += `<div class="timeline-row" style="grid-template-columns: ${projectColumnWidth}px 1fr;"><div class="timeline-label timeline-header">Month</div><div class="timeline-content"><div class="timeline-grid">`;
    months.forEach(month => {
        const monthName = month.toLocaleDateString('en-US', { month: 'short' });
        html += `<div class="timeline-cell" style="display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 0.875rem;">${monthName}</div>`;
    });
    html += '</div></div></div>';
    
    filteredProjects.forEach((tp, displayIndex) => {
        const project = APP.projects.find(p => p.id === tp.projectId);
        if (!project) return;
        
        const startDate = new Date(tp.startDate);
        const endDate = new Date(tp.endDate);
        
        if (!tp.startDate || !tp.endDate) return;
        
        const firstMonthStart = new Date(months[0]);
        firstMonthStart.setDate(1);
        const lastMonthStart = new Date(months[11]);
        const lastMonthEnd = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth() + 1, 0);
        
        const totalDays = Math.floor((lastMonthEnd - firstMonthStart) / (1000 * 60 * 60 * 24)) + 1;
        
        const startDayOffset = Math.floor((startDate - firstMonthStart) / (1000 * 60 * 60 * 24));
        const endDayOffset = Math.floor((endDate - firstMonthStart) / (1000 * 60 * 60 * 24));
        
        let leftPercent = 0;
        let widthPercent = 100;
        let isVisible = true;
        
        if (startDayOffset >= totalDays && endDayOffset >= totalDays) {
            isVisible = false;
        } else if (endDayOffset < 0) {
            isVisible = false;
        }
        
        if (!isVisible) return;
        
        if (startDayOffset >= 0 && startDayOffset < totalDays) {
            leftPercent = (startDayOffset / totalDays) * 100;
            const daysSpanned = Math.min(endDayOffset - startDayOffset + 1, totalDays - startDayOffset);
            widthPercent = (daysSpanned / totalDays) * 100;
        } else if (startDayOffset < 0 && endDayOffset >= 0) {
            leftPercent = 0;
            widthPercent = ((Math.min(endDayOffset, totalDays - 1)) / totalDays) * 100;
        } else if (startDayOffset >= totalDays) {
            isVisible = false;
        }
        
        if (!isVisible) return;
        
        html += `<div class="timeline-row" style="grid-template-columns: ${projectColumnWidth}px 1fr;">
            <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0 0.5rem;">
                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                    ${displayIndex > 0 ? `<button onclick="moveTimelineProject(${tp.projectId}, -1)" style="padding: 0.25rem 0.5rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); cursor: pointer; font-size: 0.75rem;">▲</button>` : `<div style="padding: 0.25rem 0.5rem; height: 20px;"></div>`}
                    ${displayIndex < filteredProjects.length - 1 ? `<button onclick="moveTimelineProject(${tp.projectId}, 1)" style="padding: 0.25rem 0.5rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); cursor: pointer; font-size: 0.75rem;">▼</button>` : `<div style="padding: 0.25rem 0.5rem; height: 20px;"></div>`}
                </div>
                <button onclick="openEditModal(${tp.projectId})" style="padding: 0.5rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; color: var(--pastel-blue); cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;" title="Edit project">📋</button>
                <div class="timeline-label" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; flex: 1;" onclick="if (!APP.isDragging) { openTimelineProjectModal(event, ${tp.projectId}); }">${project.title}</div>
            </div>
            <div class="timeline-content">
                <div class="timeline-grid">`;
        
        months.forEach(() => {
            html += '<div class="timeline-cell"></div>';
        });
        
        html += `</div>
                <div class="project-bar" 
                     data-project-id="${tp.projectId}"
                     onmousedown="event.stopPropagation(); startDrag(event, ${tp.projectId}, 'move')"
                     onclick="if (!APP.isDragging) { openTimelineProjectModal(event, ${tp.projectId}); }">
                    <div class="project-bar-handle left" onmousedown="startDrag(event, ${tp.projectId}, 'left')"></div>
                    <span style="flex: 1; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 0.25rem;">${project.title}</span>
                    <div class="project-bar-handle right" onmousedown="startDrag(event, ${tp.projectId}, 'right')"></div>
                </div>
            </div>
        </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    filteredProjects.forEach(tp => {
        const project = APP.projects.find(p => p.id === tp.projectId);
        if (!project) return;
        
        const startDate = new Date(tp.startDate);
        const endDate = new Date(tp.endDate);
        
        if (!tp.startDate || !tp.endDate) return;
        
        const now = new Date();
        const months = [];
        for (let i = 0; i < 12; i++) {
            const monthIndex = (APP.timelineStartMonth + i) % 12;
            const year = now.getFullYear() + Math.floor((APP.timelineStartMonth + i) / 12);
            months.push(new Date(year, monthIndex, 1));
        }
        
        const firstMonthStart = new Date(months[0]);
        firstMonthStart.setDate(1);
        const lastMonthStart = new Date(months[11]);
        const lastMonthEnd = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth() + 1, 0);
        
        const totalDays = Math.floor((lastMonthEnd - firstMonthStart) / (1000 * 60 * 60 * 24)) + 1;
        
        const startDayOffset = Math.floor((startDate - firstMonthStart) / (1000 * 60 * 60 * 24));
        const endDayOffset = Math.floor((endDate - firstMonthStart) / (1000 * 60 * 60 * 24));
        
        let leftPercent = 0;
        let widthPercent = 100;
        
        if (startDayOffset >= 0 && startDayOffset < totalDays) {
            leftPercent = (startDayOffset / totalDays) * 100;
            const daysSpanned = Math.min(endDayOffset - startDayOffset + 1, totalDays - startDayOffset);
            widthPercent = (daysSpanned / totalDays) * 100;
        } else if (startDayOffset < 0 && endDayOffset >= 0) {
            leftPercent = 0;
            widthPercent = ((Math.min(endDayOffset, totalDays - 1)) / totalDays) * 100;
        } else if (startDayOffset >= totalDays) {
            return;
        }
        
        const bar = document.querySelector(`[data-project-id="${tp.projectId}"]`);
        if (bar) {
            bar.style.left = `${leftPercent}%`;
            bar.style.width = `${widthPercent}%`;
        }
    });
}

function startDrag(e, projectId, type) {
    e.stopPropagation();
    e.preventDefault();
    
    if (APP.dragState) {
        stopDrag();
    }
    
    const timelineProject = APP.timelineProjects.find(tp => tp.projectId === projectId);
    if (!timelineProject) return;
    
    const bar = e.currentTarget.closest('.project-bar');
    if (!bar) return;
    
    const container = bar.closest('.timeline-content');
    if (!container) return;
    
    const gridContainer = container.querySelector('.timeline-grid');
    if (!gridContainer) return;
    
    const gridRect = gridContainer.getBoundingClientRect();
    const dragHandler = (event) => handleDrag(event);
    const stopHandler = () => stopDrag();
    
    const barRect = bar.getBoundingClientRect();
    const containerRect = gridContainer.getBoundingClientRect();
    const originalLeftPixels = barRect.left - containerRect.left;
    const originalLeftPercent = (originalLeftPixels / containerRect.width) * 100;
    const originalWidthPercent = (barRect.width / containerRect.width) * 100;
    
    APP.isDragging = true;
    
    APP.dragState = {
        projectId,
        type,
        startX: e.clientX,
        containerWidth: gridRect.width,
        containerRect,
        originalStartDate: new Date(timelineProject.startDate),
        originalEndDate: new Date(timelineProject.endDate),
        originalLeftPercent,
        originalWidthPercent,
        dragHandler,
        stopHandler,
        bar
    };
    
    document.addEventListener('mousemove', dragHandler);
    document.addEventListener('mouseup', stopHandler);
}

function handleDrag(e) {
    if (!APP.dragState) return;
    
    const { projectId, type, startX, containerWidth, originalStartDate, originalEndDate, originalLeftPercent, originalWidthPercent, bar } = APP.dragState;
    const timelineProject = APP.timelineProjects.find(tp => tp.projectId === projectId);
    if (!timelineProject) return;
    
    const deltaX = e.clientX - startX;
    const deltaPercent = (deltaX / containerWidth) * 100;
    
    const now = new Date();
    const months = [];
    for (let i = 0; i < 12; i++) {
        const monthIndex = (APP.timelineStartMonth + i) % 12;
        const year = now.getFullYear() + Math.floor((APP.timelineStartMonth + i) / 12);
        months.push(new Date(year, monthIndex, 1));
    }
    
    const firstMonthStart = new Date(months[0]);
    firstMonthStart.setDate(1);
    const lastMonthStart = new Date(months[11]);
    const lastMonthEnd = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth() + 1, 0);
    
    const totalDays = Math.floor((lastMonthEnd - firstMonthStart) / (1000 * 60 * 60 * 24)) + 1;
    const deltaDays = Math.round((deltaPercent / 100) * totalDays);
    
    if (type === 'move') {
        const newLeftPercent = originalLeftPercent + deltaPercent;
        bar.style.left = `${newLeftPercent}%`;
        
        const newStartDate = new Date(originalStartDate);
        newStartDate.setDate(newStartDate.getDate() + deltaDays);
        
        const newEndDate = new Date(originalEndDate);
        newEndDate.setDate(newEndDate.getDate() + deltaDays);
        
        timelineProject.startDate = newStartDate.toISOString().split('T')[0];
        timelineProject.endDate = newEndDate.toISOString().split('T')[0];
        
        const project = APP.projects.find(p => p.id === projectId);
        if (project) {
            project.startDate = timelineProject.startDate;
            project.endDate = timelineProject.endDate;
        }
        
    } else if (type === 'left') {
        const newLeftPercent = originalLeftPercent + deltaPercent;
        const newWidthPercent = originalWidthPercent - deltaPercent;
        
        if (newWidthPercent > 2) {
            bar.style.left = `${newLeftPercent}%`;
            bar.style.width = `${newWidthPercent}%`;
            
            const newStartDate = new Date(originalStartDate);
            newStartDate.setDate(newStartDate.getDate() + deltaDays);
            
            const endDate = new Date(timelineProject.endDate);
            if (newStartDate <= endDate) {
                timelineProject.startDate = newStartDate.toISOString().split('T')[0];
                
                const project = APP.projects.find(p => p.id === projectId);
                if (project) {
                    project.startDate = timelineProject.startDate;
                }
            }
        }
        
    } else if (type === 'right') {
        const newWidthPercent = originalWidthPercent + deltaPercent;
        
        if (newWidthPercent > 2) {
            bar.style.width = `${newWidthPercent}%`;
            
            const newEndDate = new Date(originalEndDate);
            newEndDate.setDate(newEndDate.getDate() + deltaDays);
            
            const startDate = new Date(timelineProject.startDate);
            if (newEndDate >= startDate) {
                timelineProject.endDate = newEndDate.toISOString().split('T')[0];
                
                const project = APP.projects.find(p => p.id === projectId);
                if (project) {
                    project.endDate = timelineProject.endDate;
                }
            }
        }
    }
}

function stopDrag() {
    if (APP.dragState) {
        const { dragHandler, stopHandler } = APP.dragState;
        
        document.removeEventListener('mousemove', dragHandler);
        document.removeEventListener('mouseup', stopHandler);
        
        renderTimeline();
        saveToLocalStorage();
        APP.dragState = null;
        
        setTimeout(() => {
            APP.isDragging = false;
        }, 100);
    }
}

function openTimelineProjectModal(e, projectId) {
    e.stopPropagation();
    
    const timelineProject = APP.timelineProjects.find(tp => tp.projectId === projectId);
    const project = APP.projects.find(p => p.id === projectId);
    
    if (!timelineProject || !project) return;
    
    const modal = document.createElement('div');
    modal.id = 'timelineProjectModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${project.title}</h2>
                <button class="close-btn" onclick="closeTimelineProjectModal()">&times;</button>
            </div>
            
            <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="date" class="form-input" id="timelineStartDateInput" value="${timelineProject.startDate}">
            </div>
            
            <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="date" class="form-input" id="timelineEndDateInput" value="${timelineProject.endDate}">
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button class="btn-primary" style="background: var(--pastel-red); border: none;" onclick="removeProjectFromTimeline(${projectId})">Remove from Timeline</button>
                <button class="btn-primary" onclick="closeTimelineProjectModal()">Cancel</button>
                <button class="btn-save" onclick="saveTimelineProjectDates(${projectId})">Save Dates</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeTimelineProjectModal() {
    const modal = document.getElementById('timelineProjectModal');
    if (modal) modal.remove();
}

function saveTimelineProjectDates(projectId) {
    const startDateInput = document.getElementById('timelineStartDateInput');
    const endDateInput = document.getElementById('timelineEndDateInput');
    
    if (!startDateInput || !endDateInput) return;
    
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    if (!startDate || !endDate) {
        showNotification('Please enter both start and end dates', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showNotification('Start date must be before end date', 'error');
        return;
    }
    
    const timelineProject = APP.timelineProjects.find(tp => tp.projectId === projectId);
    if (timelineProject) {
        timelineProject.startDate = startDate;
        timelineProject.endDate = endDate;
        
        const project = APP.projects.find(p => p.id === projectId);
        if (project) {
            project.startDate = startDate;
            project.endDate = endDate;
        }
        
        saveToLocalStorage();
        renderTimeline();
        closeTimelineProjectModal();
        showNotification('Dates updated successfully', 'success');
    }
}

function removeProjectFromTimeline(projectId) {
    showConfirm(`Remove "${APP.projects.find(p => p.id === projectId)?.title}" from timeline?`, function() {
        APP.timelineProjects = APP.timelineProjects.filter(tp => tp.projectId !== projectId);
        saveToLocalStorage();
        renderTimeline();
        closeTimelineProjectModal();
        showNotification('Project removed from timeline', 'success');
    });
}

// ===========================
// PKD EXPORT & IMPORT
// ===========================

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
    content += `<!-- TIMELINE_DATA:${JSON.stringify(APP.timelineProjects)} -->\n\n`;
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
        
        if (proj.startDate && proj.endDate) {
            content += `-   **Timeline**: ${proj.startDate} to ${proj.endDate}\n\n`;
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
    content += `-   [ ] Update project statuses\n`;
    content += `-   [ ] Review blockers and dependencies\n`;
    content += `-   [ ] Check upcoming deadlines\n`;
    content += `-   [ ] Update team member progress\n`;
    content += `-   [ ] Document completed milestones\n`;
    content += `-   [ ] Plan next week's priorities\n`;
    
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
        timelineProjects: []
    };
    
    const timelineMatch = content.match(/<!-- TIMELINE_DATA:(.*?) -->/);
    if (timelineMatch) {
        try {
            result.timelineProjects = JSON.parse(timelineMatch[1]);
        } catch (e) {
            console.error('Error parsing timeline data:', e);
        }
    }
    
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
                priority: 999,
                startDate: null,
                endDate: null
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
        
        if (line.includes('**Timeline**:')) {
            const parts = line.split('**Timeline**:');
            if (parts.length > 1) {
                const timelineStr = parts[1].trim();
                const dateMatch = timelineStr.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/);
                if (dateMatch) {
                    currentProject.startDate = dateMatch[1];
                    currentProject.endDate = dateMatch[2];
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
                APP.timelineProjects = parsed.timelineProjects || [];
                
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
