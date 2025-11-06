// PKD Dashboard Application

const APP = {
    projects: [],
    categories: ['ABL', 'Healthcare', 'Liquid Inventory', 'IT / Infrastructure', 'Flagged'],
    statuses: ['idea', 'flagged', 'in-progress', 'on-hold', 'moving', 'stable', 'person', 'completed'],
    users: ['Ben', 'Jacob', 'Sam', 'Jonathan', 'Charlie', 'Jen', 'Holly', 'Grant', 'Benat', 'Nymbl'],
    filters: {
        status: [],
        category: [],
        user: [],
        search: ''
    },
    lastUpdated: 'Never',
    notes: {
        nymbl: '',
        ben: '',
        cindy: '',
        general: ''
    },
    currentNoteType: 'nymbl'
};

const PASSWORD_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'; // 'password'

// Password Check
function checkPassword() {
    const input = document.getElementById('passwordInput').value;
    const hash = sha256(input);
    
    if (hash === PASSWORD_HASH) {
        document.getElementById('passwordScreen').style.display = 'none';
        document.getElementById('dashboardWrapper').style.display = 'block';
        renderProjects();
    } else {
        document.getElementById('passwordError').style.display = 'block';
        document.getElementById('passwordInput').value = '';
    }
}

// Simple SHA-256 implementation
function sha256(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length';
    let i, j;
    let result = '';
    
    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;
    
    let hash = sha256.h = sha256.h || [];
    const k = sha256.k = sha256.k || [];
    let primeCounter = k[lengthProperty];
    
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (i = 0; i < 313; i += candidate) {
                isComposite[i] = candidate;
            }
            hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
    }
    
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
        j = ascii.charCodeAt(i);
        if (j >> 8) return;
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength);
    
    for (j = 0; j < words[lengthProperty];) {
        const w = words.slice(j, j += 16);
        const oldHash = hash;
        hash = hash.slice(0, 8);
        
        for (i = 0; i < 64; i++) {
            const w15 = w[i - 15], w2 = w[i - 2];
            
            const a = hash[0], e = hash[4];
            const temp1 = hash[7]
                + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                + ((e & hash[5]) ^ ((~e) & hash[6]))
                + k[i]
                + (w[i] = (i < 16) ? w[i] : (
                    w[i - 16]
                    + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                    + w[i - 7]
                    + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                ) | 0
                );
            const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
            
            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
        }
        
        for (i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }
    
    for (i = 0; i < 8; i++) {
        for (j = 3; j + 1; j--) {
            const b = (hash[i] >> (j * 8)) & 255;
            result += ((b < 16) ? 0 : '') + b.toString(16);
        }
    }
    return result;
}

// Page Navigation
function showPage(page) {
    document.querySelectorAll('.page-container').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    if (page === 'projects') {
        document.getElementById('projectsPage').classList.add('active');
        document.querySelector('.nav-btn:first-child').classList.add('active');
        document.getElementById('projectsOnlyBtn').style.display = 'inline-block';
        document.getElementById('manageBtn').style.display = 'inline-block';
    } else if (page === 'timeline') {
        document.getElementById('timelinePage').classList.add('active');
        document.querySelector('.nav-btn:last-child').classList.add('active');
        document.getElementById('projectsOnlyBtn').style.display = 'none';
        document.getElementById('manageBtn').style.display = 'none';
    }
}

// Notifications
function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Dropdown Filters
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const isOpen = dropdown.classList.contains('open');
    
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('open');
    });
    
    if (!isOpen) {
        dropdown.classList.add('open');
    }
}

function updateFilterDropdowns() {
    const statusDropdown = document.getElementById('statusDropdown');
    const categoryDropdown = document.getElementById('categoryDropdown');
    const userDropdown = document.getElementById('userDropdown');
    
    statusDropdown.innerHTML = '';
    APP.statuses.forEach(status => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.innerHTML = `
            <input type="checkbox" id="status-${status}" value="${status}" 
                ${APP.filters.status.includes(status) ? 'checked' : ''} 
                onchange="updateFilter('status', '${status}', this.checked)">
            <label for="status-${status}">${status}</label>
        `;
        statusDropdown.appendChild(item);
    });
    
    categoryDropdown.innerHTML = '';
    APP.categories.forEach(category => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.innerHTML = `
            <input type="checkbox" id="category-${category}" value="${category}" 
                ${APP.filters.category.includes(category) ? 'checked' : ''} 
                onchange="updateFilter('category', '${category}', this.checked)">
            <label for="category-${category}">${category}</label>
        `;
        categoryDropdown.appendChild(item);
    });
    
    userDropdown.innerHTML = '';
    APP.users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.innerHTML = `
            <input type="checkbox" id="user-${user}" value="${user}" 
                ${APP.filters.user.includes(user) ? 'checked' : ''} 
                onchange="updateFilter('user', '${user}', this.checked)">
            <label for="user-${user}">${user}</label>
        `;
        userDropdown.appendChild(item);
    });
}

function updateFilter(filterType, value, checked) {
    if (checked) {
        if (!APP.filters[filterType].includes(value)) {
            APP.filters[filterType].push(value);
        }
    } else {
        APP.filters[filterType] = APP.filters[filterType].filter(v => v !== value);
    }
    applyFilters();
}

function applyFilters() {
    APP.filters.search = document.getElementById('searchInput').value.toLowerCase();
    renderProjects();
}

// Project Rendering
function renderProjects() {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '';
    
    let filteredProjects = APP.projects.filter(project => {
        if (APP.filters.status.length > 0 && !APP.filters.status.includes(project.status)) {
            return false;
        }
        
        if (APP.filters.category.length > 0) {
            const hasCategory = project.categories && project.categories.some(cat => 
                APP.filters.category.includes(cat)
            );
            if (!hasCategory) return false;
        }
        
        if (APP.filters.user.length > 0) {
            const hasUser = project.users && project.users.some(user => 
                APP.filters.user.includes(user)
            );
            if (!hasUser) return false;
        }
        
        if (APP.filters.search) {
            const searchTerm = APP.filters.search;
            const matchesTitle = project.title.toLowerCase().includes(searchTerm);
            const matchesDetails = project.keyDetails && project.keyDetails.toLowerCase().includes(searchTerm);
            const matchesNextSteps = project.nextSteps && project.nextSteps.toLowerCase().includes(searchTerm);
            
            if (!matchesTitle && !matchesDetails && !matchesNextSteps) {
                return false;
            }
        }
        
        return true;
    });
    
    filteredProjects.sort((a, b) => a.priority - b.priority);
    
    filteredProjects.forEach(project => {
        const card = createProjectCard(project);
        projectsList.appendChild(card);
    });
    
    updateStats();
    updateFilterDropdowns();
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    const categoriesHTML = project.categories && project.categories.length > 0
        ? `<div class="project-categories">${project.categories.map(cat => 
            `<span class="category-badge">${cat}</span>`
        ).join('')}</div>`
        : '';
    
    const usersHTML = project.users && project.users.length > 0
        ? `<div class="project-users">${project.users.map(user => 
            `<span class="user-badge">${user}</span>`
        ).join('')}</div>`
        : '';
    
    const detailsHTML = project.keyDetails
        ? `<div class="project-details">
            <div class="project-details-title">Key Details</div>
            <div class="project-details-content">${escapeHtml(project.keyDetails)}</div>
        </div>`
        : '';
    
    const nextStepsHTML = project.nextSteps
        ? `<div class="project-next-steps">
            <div class="project-next-steps-title">Next Steps</div>
            <div class="project-next-steps-content">${escapeHtml(project.nextSteps)}</div>
        </div>`
        : '';
    
    const linksHTML = project.links && project.links.length > 0
        ? `<div class="project-links">${project.links.map(link => 
            `<a href="${link.url}" target="_blank">${link.title}</a>`
        ).join('')}</div>`
        : '';
    
    card.innerHTML = `
        <div class="project-header">
            <div class="project-title" onclick="openEditModal(${project.id})">${project.id}. ${escapeHtml(project.title)}</div>
            <span class="status-badge ${project.status}">${project.status}</span>
        </div>
        ${categoriesHTML}
        ${usersHTML}
        ${detailsHTML}
        ${nextStepsHTML}
        ${linksHTML}
        <div class="project-footer">
            <div style="font-size: 0.75rem; color: var(--text-secondary);">Priority: ${project.priority}</div>
            <div class="project-actions">
                <button class="edit-btn" onclick="openEditModal(${project.id})">Edit</button>
                <button class="complete-btn" onclick="toggleComplete(${project.id})">${project.status === 'completed' ? 'Reopen' : 'Complete'}</button>
                <button class="delete-btn" onclick="deleteProject(${project.id})">Delete</button>
            </div>
        </div>
    `;
    
    return card;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateStats() {
    const activeCount = APP.projects.filter(p => ['in-progress', 'moving', 'idea'].includes(p.status)).length;
    const stableCount = APP.projects.filter(p => p.status === 'stable').length;
    const flaggedCount = APP.projects.filter(p => p.status === 'flagged').length;
    
    document.getElementById('activeCount').textContent = activeCount;
    document.getElementById('stableCount').textContent = stableCount;
    document.getElementById('flaggedCount').textContent = flaggedCount;
}

// Project CRUD Operations
function openCreateModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    const nextId = APP.projects.length > 0 ? Math.max(...APP.projects.map(p => p.id)) + 1 : 1;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Create New Project</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
            
            <div class="form-group">
                <label class="form-label">Project ID</label>
                <input type="number" class="form-input" id="newProjectId" value="${nextId}" readonly>
            </div>
            
            <div class="form-group">
                <label class="form-label">Title *</label>
                <input type="text" class="form-input" id="newProjectTitle" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Status *</label>
                <select class="form-select" id="newProjectStatus">
                    ${APP.statuses.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Priority</label>
                <input type="number" class="form-input" id="newProjectPriority" value="999">
            </div>
            
            <div class="form-group">
                <label class="form-label">Categories</label>
                <div class="checkbox-group">
                    ${APP.categories.map(cat => `
                        <label class="checkbox-label">
                            <input type="checkbox" value="${cat}" class="category-checkbox">
                            ${cat}
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Users</label>
                <div class="checkbox-group">
                    ${APP.users.map(user => `
                        <label class="checkbox-label">
                            <input type="checkbox" value="${user}" class="user-checkbox">
                            ${user}
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Key Details</label>
                <textarea class="form-textarea" id="newProjectDetails"></textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Next Steps</label>
                <textarea class="form-textarea" id="newProjectNextSteps"></textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Links (one per line, format: Title | URL)</label>
                <textarea class="form-textarea" id="newProjectLinks" placeholder="Example: Documentation | https://example.com"></textarea>
            </div>
            
            <div class="modal-actions">
                <button style="background: var(--bg-secondary); color: var(--text-primary);" onclick="this.closest('.modal').remove()">Cancel</button>
                <button style="background: var(--pastel-blue); color: var(--bg-primary);" onclick="createProject()">Create Project</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function createProject() {
    const title = document.getElementById('newProjectTitle').value.trim();
    if (!title) {
        showNotification('Please enter a project title', 'error');
        return;
    }
    
    const categories = Array.from(document.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
    const users = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.value);
    
    const linksText = document.getElementById('newProjectLinks').value.trim();
    const links = linksText ? linksText.split('\n').map(line => {
        const parts = line.split('|').map(p => p.trim());
        return parts.length === 2 ? { title: parts[0], url: parts[1] } : null;
    }).filter(l => l) : [];
    
    const project = {
        id: parseInt(document.getElementById('newProjectId').value),
        title: title,
        status: document.getElementById('newProjectStatus').value,
        priority: parseInt(document.getElementById('newProjectPriority').value),
        categories: categories,
        users: users,
        keyDetails: document.getElementById('newProjectDetails').value.trim(),
        nextSteps: document.getElementById('newProjectNextSteps').value.trim(),
        links: links
    };
    
    APP.projects.push(project);
    APP.lastUpdated = new Date().toLocaleDateString();
    document.getElementById('lastUpdatedText').textContent = `Last Updated: ${APP.lastUpdated}`;
    
    renderProjects();
    document.querySelector('.modal').remove();
    showNotification('Project created successfully');
}

function openEditModal(projectId) {
    const project = APP.projects.find(p => p.id === projectId);
    if (!project) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    const linksText = project.links ? project.links.map(l => `${l.title} | ${l.url}`).join('\n') : '';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Project #${project.id}</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
            
            <div class="form-group">
                <label class="form-label">Title *</label>
                <input type="text" class="form-input" id="editProjectTitle" value="${escapeHtml(project.title)}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Status *</label>
                <select class="form-select" id="editProjectStatus">
                    ${APP.statuses.map(s => `<option value="${s}" ${s === project.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Priority</label>
                <input type="number" class="form-input" id="editProjectPriority" value="${project.priority}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Categories</label>
                <div class="checkbox-group">
                    ${APP.categories.map(cat => `
                        <label class="checkbox-label">
                            <input type="checkbox" value="${cat}" class="category-checkbox" ${project.categories && project.categories.includes(cat) ? 'checked' : ''}>
                            ${cat}
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Users</label>
                <div class="checkbox-group">
                    ${APP.users.map(user => `
                        <label class="checkbox-label">
                            <input type="checkbox" value="${user}" class="user-checkbox" ${project.users && project.users.includes(user) ? 'checked' : ''}>
                            ${user}
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Key Details</label>
                <textarea class="form-textarea" id="editProjectDetails">${project.keyDetails || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Next Steps</label>
                <textarea class="form-textarea" id="editProjectNextSteps">${project.nextSteps || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Links (one per line, format: Title | URL)</label>
                <textarea class="form-textarea" id="editProjectLinks">${linksText}</textarea>
            </div>
            
            <div class="modal-actions">
                <button style="background: var(--bg-secondary); color: var(--text-primary);" onclick="this.closest('.modal').remove()">Cancel</button>
                <button style="background: var(--pastel-blue); color: var(--bg-primary);" onclick="saveProject(${projectId})">Save Changes</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function saveProject(projectId) {
    const project = APP.projects.find(p => p.id === projectId);
    if (!project) return;
    
    const title = document.getElementById('editProjectTitle').value.trim();
    if (!title) {
        showNotification('Please enter a project title', 'error');
        return;
    }
    
    const categories = Array.from(document.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
    const users = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.value);
    
    const linksText = document.getElementById('editProjectLinks').value.trim();
    const links = linksText ? linksText.split('\n').map(line => {
        const parts = line.split('|').map(p => p.trim());
        return parts.length === 2 ? { title: parts[0], url: parts[1] } : null;
    }).filter(l => l) : [];
    
    project.title = title;
    project.status = document.getElementById('editProjectStatus').value;
    project.priority = parseInt(document.getElementById('editProjectPriority').value);
    project.categories = categories;
    project.users = users;
    project.keyDetails = document.getElementById('editProjectDetails').value.trim();
    project.nextSteps = document.getElementById('editProjectNextSteps').value.trim();
    project.links = links;
    
    APP.lastUpdated = new Date().toLocaleDateString();
    document.getElementById('lastUpdatedText').textContent = `Last Updated: ${APP.lastUpdated}`;
    
    renderProjects();
    document.querySelector('.modal').remove();
    showNotification('Project updated successfully');
}

function toggleComplete(projectId) {
    const project = APP.projects.find(p => p.id === projectId);
    if (!project) return;
    
    project.status = project.status === 'completed' ? 'in-progress' : 'completed';
    
    APP.lastUpdated = new Date().toLocaleDateString();
    document.getElementById('lastUpdatedText').textContent = `Last Updated: ${APP.lastUpdated}`;
    
    renderProjects();
    showNotification(`Project ${project.status === 'completed' ? 'completed' : 'reopened'}`);
}

function deleteProject(projectId) {
    const project = APP.projects.find(p => p.id === projectId);
    if (!project) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete "${project.title}"?`);
    if (!confirmDelete) return;
    
    APP.projects = APP.projects.filter(p => p.id !== projectId);
    
    APP.lastUpdated = new Date().toLocaleDateString();
    document.getElementById('lastUpdatedText').textContent = `Last Updated: ${APP.lastUpdated}`;
    
    renderProjects();
    showNotification('Project deleted successfully');
}

// Manage Settings Modal
function openManageModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Manage Settings</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
            
            <div class="settings-section">
                <h3>Project Categories</h3>
                <div class="settings-list" id="categoriesList"></div>
                <div class="add-item-form">
                    <input type="text" id="newCategory" placeholder="New category name">
                    <button onclick="addCategory()">Add</button>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Project Statuses</h3>
                <div class="settings-list" id="statusesList"></div>
                <div class="add-item-form">
                    <input type="text" id="newStatus" placeholder="New status name">
                    <button onclick="addStatus()">Add</button>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Users</h3>
                <div class="settings-list" id="usersList"></div>
                <div class="add-item-form">
                    <input type="text" id="newUser" placeholder="New user name">
                    <button onclick="addUser()">Add</button>
                </div>
            </div>
            
            <div class="modal-actions">
                <button style="background: var(--pastel-blue); color: var(--bg-primary);" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    renderSettingsLists();
}

function renderSettingsLists() {
    const categoriesList = document.getElementById('categoriesList');
    const statusesList = document.getElementById('statusesList');
    const usersList = document.getElementById('usersList');
    
    categoriesList.innerHTML = APP.categories.map(cat => `
        <div class="settings-item">
            <span class="settings-item-name">${cat}</span>
            <div class="settings-item-actions">
                <button style="background: var(--pastel-red); color: var(--bg-primary);" onclick="removeCategory('${cat}')">Remove</button>
            </div>
        </div>
    `).join('');
    
    statusesList.innerHTML = APP.statuses.map(status => `
        <div class="settings-item">
            <span class="settings-item-name">${status}</span>
            <div class="settings-item-actions">
                <button style="background: var(--pastel-red); color: var(--bg-primary);" onclick="removeStatus('${status}')">Remove</button>
            </div>
        </div>
    `).join('');
    
    usersList.innerHTML = APP.users.map(user => `
        <div class="settings-item">
            <span class="settings-item-name">${user}</span>
            <div class="settings-item-actions">
                <button style="background: var(--pastel-red); color: var(--bg-primary);" onclick="removeUser('${user}')">Remove</button>
            </div>
        </div>
    `).join('');
}

function addCategory() {
    const input = document.getElementById('newCategory');
    const value = input.value.trim();
    if (!value) return;
    
    if (!APP.categories.includes(value)) {
        APP.categories.push(value);
        APP.categories.sort();
        renderSettingsLists();
        input.value = '';
        showNotification('Category added');
    } else {
        showNotification('Category already exists', 'error');
    }
}

function removeCategory(category) {
    APP.categories = APP.categories.filter(c => c !== category);
    renderSettingsLists();
    showNotification('Category removed');
}

function addStatus() {
    const input = document.getElementById('newStatus');
    const value = input.value.trim().toLowerCase().replace(/\s+/g, '-');
    if (!value) return;
    
    if (!APP.statuses.includes(value)) {
        APP.statuses.push(value);
        renderSettingsLists();
        input.value = '';
        showNotification('Status added');
    } else {
        showNotification('Status already exists', 'error');
    }
}

function removeStatus(status) {
    APP.statuses = APP.statuses.filter(s => s !== status);
    renderSettingsLists();
    showNotification('Status removed');
}

function addUser() {
    const input = document.getElementById('newUser');
    const value = input.value.trim();
    if (!value) return;
    
    if (!APP.users.includes(value)) {
        APP.users.push(value);
        APP.users.sort();
        renderSettingsLists();
        input.value = '';
        showNotification('User added');
    } else {
        showNotification('User already exists', 'error');
    }
}

function removeUser(user) {
    APP.users = APP.users.filter(u => u !== user);
    renderSettingsLists();
    showNotification('User removed');
}

// Notes Management
function switchNoteType() {
    saveCurrentNote();
    APP.currentNoteType = document.getElementById('noteTypeSelect').value;
    document.getElementById('notesTextarea').value = APP.notes[APP.currentNoteType] || '';
}

function saveCurrentNote() {
    APP.notes[APP.currentNoteType] = document.getElementById('notesTextarea').value;
    showNotification('Notes saved');
}

function clearCurrentNote() {
    if (confirm('Are you sure you want to clear these notes?')) {
        APP.notes[APP.currentNoteType] = '';
        document.getElementById('notesTextarea').value = '';
        showNotification('Notes cleared');
    }
}

// Export PKD
function exportPKD() {
    let content = `**PKD Dashboard Export**\n\n`;
    content += `**Last Updated**: ${APP.lastUpdated}\n\n`;
    
    content += `**Notes**\n\n`;
    Object.keys(APP.notes).forEach(noteType => {
        if (APP.notes[noteType]) {
            const displayName = noteType.charAt(0).toUpperCase() + noteType.slice(1);
            content += `**${displayName}**\n\n`;
            content += `${APP.notes[noteType]}\n\n`;
        }
    });
    
    if (APP.categories.length > 0) {
        content += `**Project Categories**\n\n`;
        APP.categories.forEach(cat => {
            content += `-   ${cat}\n`;
        });
        content += `\n`;
    }
    
    if (APP.statuses.length > 0) {
        content += `**Project Statuses**\n\n`;
        APP.statuses.forEach(status => {
            content += `-   ${status}\n`;
        });
        content += `\n`;
    }
    
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
                content += `[${link.title}](${link.url})`;
            });
            content += '\n\n';
        }
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PKD_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('PKD exported successfully');
}

// Import PKD
function parsePKDContent(content) {
    const lines = content.split('\n');
    const result = {
        projects: [],
        categories: [],
        statuses: [],
        users: [],
        notes: {
            nymbl: '',
            ben: '',
            cindy: '',
            general: ''
        },
        lastUpdated: 'Never'
    };
    
    const categoriesSet = new Set(APP.categories);
    const statusesSet = new Set(APP.statuses);
    const usersSet = new Set(APP.users);
    
    let lastUpdatedStart = -1;
    let notesStart = -1;
    let categoriesStart = -1;
    let statusesStart = -1;
    let usersStart = -1;
    let projectsStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('**Last Updated**:')) lastUpdatedStart = i;
        if (line === '**Notes**') notesStart = i;
        if (line === '**Project Categories**') categoriesStart = i;
        if (line === '**Project Statuses**') statusesStart = i;
        if (line === '**Users List**') usersStart = i;
        if (line === '**Active Projects**') projectsStart = i;
    }
    
    if (lastUpdatedStart !== -1) {
        const line = lines[lastUpdatedStart];
        const parts = line.split('**Last Updated**:');
        if (parts.length > 1) {
            result.lastUpdated = parts[1].trim();
        }
    }
    
    if (notesStart !== -1) {
        const notesEnd = categoriesStart !== -1 ? categoriesStart : 
                         statusesStart !== -1 ? statusesStart :
                         usersStart !== -1 ? usersStart :
                         projectsStart !== -1 ? projectsStart : lines.length;
        
        let currentNoteType = null;
        let currentNoteLines = [];
        
        for (let i = notesStart + 1; i < notesEnd; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            if (trimmedLine === '**Nymbl**') {
                if (currentNoteType && currentNoteLines.length > 0) {
                    result.notes[currentNoteType] = currentNoteLines.join('\n').trim();
                }
                currentNoteType = 'nymbl';
                currentNoteLines = [];
            } else if (trimmedLine === '**Ben**') {
                if (currentNoteType && currentNoteLines.length > 0) {
                    result.notes[currentNoteType] = currentNoteLines.join('\n').trim();
                }
                currentNoteType = 'ben';
                currentNoteLines = [];
            } else if (trimmedLine === '**Cindy**') {
                if (currentNoteType && currentNoteLines.length > 0) {
                    result.notes[currentNoteType] = currentNoteLines.join('\n').trim();
                }
                currentNoteType = 'cindy';
                currentNoteLines = [];
            } else if (trimmedLine === '**General**') {
                if (currentNoteType && currentNoteLines.length > 0) {
                    result.notes[currentNoteType] = currentNoteLines.join('\n').trim();
                }
                currentNoteType = 'general';
                currentNoteLines = [];
            } else if (currentNoteType && trimmedLine && !trimmedLine.startsWith('**')) {
                currentNoteLines.push(line);
            }
        }
        
        if (currentNoteType && currentNoteLines.length > 0) {
            result.notes[currentNoteType] = currentNoteLines.join('\n').trim();
        }
    }
    
    if (categoriesStart !== -1) {
        const categoriesEnd = statusesStart !== -1 ? statusesStart : 
                             usersStart !== -1 ? usersStart :
                             projectsStart !== -1 ? projectsStart : lines.length;
        for (let i = categoriesStart + 1; i < categoriesEnd; i++) {
            const line = lines[i].trim();
            if (line.startsWith('-')) {
                const category = line.replace(/^-\s*/, '').trim();
                if (category && !line.includes('**')) {
                    categoriesSet.add(category);
                }
            }
        }
    }
    
    if (statusesStart !== -1) {
        const statusesEnd = usersStart !== -1 ? usersStart :
                           projectsStart !== -1 ? projectsStart : lines.length;
        for (let i = statusesStart + 1; i < statusesEnd; i++) {
            const line = lines[i].trim();
            if (line.startsWith('-')) {
                const status = line.replace(/^-\s*/, '').trim();
                if (status && !line.includes('**')) {
                    statusesSet.add(status);
                }
            }
        }
    }
    
    if (usersStart !== -1) {
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
    const projectsEnd = lines.length;
    
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
            const parts = line.includes('**Users**:') ? 
                line.split('**Users**:') : line.split('**User**:');
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
                const linkMatches = linksText.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
                currentProject.links = [];
                for (const match of linkMatches) {
                    currentProject.links.push({
                        title: match[1],
                        url: match[2]
                    });
                }
            }
        }
    }
    
    if (currentProject) {
        result.projects.push(currentProject);
    }
    
    Object.keys(result.notes).forEach(key => {
        if (result.notes[key]) {
            result.notes[key] = result.notes[key].split('\n').map(line => line.trim()).join('\n').trim();
        }
    });
    
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
                
                const selector = document.getElementById('noteTypeSelect');
                if (selector) {
                    const currentType = selector.value;
                    document.getElementById('notesTextarea').value = APP.notes[currentType] || '';
                }
                
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

// Initialize on page load
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
