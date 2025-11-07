// Timeline functionality for PKD Dashboard

const TIMELINE = {
    projects: [],
    viewStartDate: '',
    viewEndDate: '',
    dragState: null,
    monthWidth: 120,
    weekWidth: 30
};

// Initialize Timeline
function initTimeline() {
    initializeTimelineDateRange();
    loadTimelineData();
    renderTimeline();
}

function initializeTimelineDateRange() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    
    if (!TIMELINE.viewStartDate) {
        TIMELINE.viewStartDate = `${currentYear}-${currentMonth}`;
    }
    if (!TIMELINE.viewEndDate) {
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 11);
        TIMELINE.viewEndDate = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    
    document.getElementById('timelineStartMonth').value = TIMELINE.viewStartDate;
    document.getElementById('timelineEndMonth').value = TIMELINE.viewEndDate;
}

function loadTimelineData() {
    // Load timeline projects from localStorage or initialize
    const stored = localStorage.getItem('pkdTimelineProjects');
    if (stored) {
        try {
            const timelineData = JSON.parse(stored);
            TIMELINE.projects = [];
            
            // Match timeline project IDs with current APP.projects
            timelineData.projectIds.forEach(id => {
                const project = APP.projects.find(p => p.id === id);
                if (project) {
                    TIMELINE.projects.push(project);
                }
            });
            
            if (timelineData.viewStartDate) TIMELINE.viewStartDate = timelineData.viewStartDate;
            if (timelineData.viewEndDate) TIMELINE.viewEndDate = timelineData.viewEndDate;
            
            document.getElementById('timelineStartMonth').value = TIMELINE.viewStartDate;
            document.getElementById('timelineEndMonth').value = TIMELINE.viewEndDate;
        } catch (e) {
            console.error('Error loading timeline data:', e);
        }
    }
}

function saveTimelineData() {
    const timelineData = {
        projectIds: TIMELINE.projects.map(p => p.id),
        viewStartDate: TIMELINE.viewStartDate,
        viewEndDate: TIMELINE.viewEndDate
    };
    localStorage.setItem('pkdTimelineProjects', JSON.stringify(timelineData));
}

function getMonthsBetween(start, end) {
    const months = [];
    const startDate = new Date(start + '-01');
    const endDate = new Date(end + '-01');
    
    let current = new Date(startDate);
    while (current <= endDate) {
        const year = current.getFullYear();
        const month = (current.getMonth() + 1).toString().padStart(2, '0');
        months.push(`${year}-${month}`);
        current.setMonth(current.getMonth() + 1);
    }
    
    return months;
}

function getMonthName(dateString) {
    const date = new Date(dateString + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function isQuarterStart(dateString) {
    const month = parseInt(dateString.split('-')[1]);
    return month === 1 || month === 4 || month === 7 || month === 10;
}

function renderTimeline() {
    const container = document.getElementById('timelineGrid');
    
    if (TIMELINE.projects.length === 0) {
        container.innerHTML = `
            <div class="timeline-empty-state">
                <h3>No Projects in Timeline</h3>
                <p>Click "Add Projects" to add projects to the timeline view</p>
            </div>
        `;
        return;
    }

    const months = getMonthsBetween(TIMELINE.viewStartDate, TIMELINE.viewEndDate);
    const monthCount = months.length;

    // Sort projects by displayOrder
    TIMELINE.projects.sort((a, b) => {
        const orderA = a.timeline?.displayOrder ?? 999;
        const orderB = b.timeline?.displayOrder ?? 999;
        return orderA - orderB;
    });

    let html = `
        <div class="timeline-grid" style="--month-count: ${monthCount}">
            <div class="timeline-header">
                <div class="timeline-header-cell project-label">Project</div>
                ${months.map(month => `
                    <div class="timeline-header-cell timeline-month-header ${isQuarterStart(month) ? 'quarter-start' : ''}">
                        ${getMonthName(month)}
                    </div>
                `).join('')}
            </div>
            <div class="timeline-body">
                ${TIMELINE.projects.map((project, index) => renderTimelineProjectRow(project, months, index)).join('')}
            </div>
        </div>
    `;

    container.innerHTML = html;
    attachTimelineEventListeners();
}

function renderTimelineProjectRow(project, months, rowIndex) {
    const usersHTML = project.users && project.users.length > 0
        ? `<div class="timeline-project-users">
            ${project.users.map(u => `<span class="timeline-user-badge">${u}</span>`).join('')}
           </div>`
        : '';

    const barCellIndex = project.timeline?.startMonth ? months.indexOf(project.timeline.startMonth) : -1;
    
    return `
        <div class="timeline-row">
            <div class="timeline-project-info" data-project-id="${project.id}" data-row-index="${rowIndex}">
                <div class="timeline-project-name">${project.title}</div>
                ${usersHTML}
            </div>
            ${months.map((month, idx) => {
                const barHTML = (idx === barCellIndex) ? renderTimelineBar(project, months) : '';
                return `
                    <div class="timeline-cell ${isQuarterStart(month) ? 'quarter-start' : ''}" 
                         data-month="${month}" 
                         data-project-id="${project.id}">
                        ${barHTML}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderTimelineBar(project, months) {
    if (!project.timeline?.startMonth || !project.timeline?.endMonth) {
        return '';
    }

    const barPosition = calculateBarPosition(project, months);
    if (!barPosition) return '';

    return `
        <div class="timeline-bar status-${project.status}" 
             data-project-id="${project.id}"
             style="left: ${barPosition.left}px; width: ${barPosition.width}px;">
            <div class="timeline-resize-handle timeline-resize-handle-left" data-handle="left"></div>
            ${project.title}
            <div class="timeline-resize-handle timeline-resize-handle-right" data-handle="right"></div>
        </div>
    `;
}

function calculateBarPosition(project, months) {
    if (!project.timeline?.startMonth || !project.timeline?.endMonth) return null;

    const startIndex = months.indexOf(project.timeline.startMonth);
    const endIndex = months.indexOf(project.timeline.endMonth);

    if (startIndex === -1 || endIndex === -1) return null;

    const startWeek = project.timeline.startWeek || 0;
    const endWeek = project.timeline.endWeek !== undefined ? project.timeline.endWeek : 3;

    const left = (startIndex * TIMELINE.monthWidth) + (startWeek * TIMELINE.weekWidth);
    const width = ((endIndex - startIndex) * TIMELINE.monthWidth) + 
                 ((endWeek - startWeek) * TIMELINE.weekWidth) + TIMELINE.weekWidth;

    return { left, width };
}

function attachTimelineEventListeners() {
    // Bar dragging
    document.querySelectorAll('.timeline-bar').forEach(bar => {
        bar.addEventListener('mousedown', handleTimelineBarMouseDown);
    });

    // Resize handles
    document.querySelectorAll('.timeline-resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', handleTimelineResizeMouseDown);
    });
}

function handleTimelineBarMouseDown(e) {
    if (e.target.classList.contains('timeline-resize-handle')) return;
    e.preventDefault();
    
    const bar = e.currentTarget;
    const projectId = parseInt(bar.dataset.projectId);
    const project = TIMELINE.projects.find(p => p.id === projectId);
    
    if (!project?.timeline) return;
    
    TIMELINE.dragState = {
        type: 'move',
        projectId: projectId,
        startX: e.clientX,
        originalStartMonth: project.timeline.startMonth,
        originalEndMonth: project.timeline.endMonth,
        originalStartWeek: project.timeline.startWeek || 0,
        originalEndWeek: project.timeline.endWeek !== undefined ? project.timeline.endWeek : 3
    };

    bar.classList.add('dragging');
    document.addEventListener('mousemove', handleTimelineMouseMove);
    document.addEventListener('mouseup', handleTimelineMouseUp);
}

function handleTimelineResizeMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const handle = e.currentTarget;
    const bar = handle.closest('.timeline-bar');
    const projectId = parseInt(bar.dataset.projectId);
    const project = TIMELINE.projects.find(p => p.id === projectId);
    
    if (!project?.timeline) return;
    
    TIMELINE.dragState = {
        type: 'resize',
        handle: handle.dataset.handle,
        projectId: projectId,
        startX: e.clientX,
        originalStartMonth: project.timeline.startMonth,
        originalEndMonth: project.timeline.endMonth,
        originalStartWeek: project.timeline.startWeek || 0,
        originalEndWeek: project.timeline.endWeek !== undefined ? project.timeline.endWeek : 3
    };

    bar.classList.add('dragging');
    document.addEventListener('mousemove', handleTimelineMouseMove);
    document.addEventListener('mouseup', handleTimelineMouseUp);
}

function handleTimelineMouseMove(e) {
    if (!TIMELINE.dragState) return;
    // Visual feedback could be added here
}

function handleTimelineMouseUp(e) {
    if (!TIMELINE.dragState) return;

    const deltaX = e.clientX - TIMELINE.dragState.startX;
    const quarterMonths = Math.round(deltaX / TIMELINE.weekWidth);

    const project = TIMELINE.projects.find(p => p.id === TIMELINE.dragState.projectId);
    if (!project) return;
    
    if (!project.timeline) {
        project.timeline = {};
    }
    
    if (TIMELINE.dragState.type === 'move') {
        // Move both start and end
        const newStart = addQuarterMonths(
            TIMELINE.dragState.originalStartMonth, 
            TIMELINE.dragState.originalStartWeek, 
            quarterMonths
        );
        const newEnd = addQuarterMonths(
            TIMELINE.dragState.originalEndMonth, 
            TIMELINE.dragState.originalEndWeek, 
            quarterMonths
        );

        project.timeline.startMonth = newStart.month;
        project.timeline.startWeek = newStart.week;
        project.timeline.endMonth = newEnd.month;
        project.timeline.endWeek = newEnd.week;
    } else if (TIMELINE.dragState.type === 'resize') {
        if (TIMELINE.dragState.handle === 'left') {
            const newStart = addQuarterMonths(
                TIMELINE.dragState.originalStartMonth, 
                TIMELINE.dragState.originalStartWeek, 
                quarterMonths
            );
            project.timeline.startMonth = newStart.month;
            project.timeline.startWeek = newStart.week;
        } else {
            const newEnd = addQuarterMonths(
                TIMELINE.dragState.originalEndMonth, 
                TIMELINE.dragState.originalEndWeek, 
                quarterMonths
            );
            project.timeline.endMonth = newEnd.month;
            project.timeline.endWeek = newEnd.week;
        }
    }

    // Update main APP data and save
    const mainProject = APP.projects.find(p => p.id === project.id);
    if (mainProject) {
        mainProject.timeline = project.timeline;
        saveToLocalStorage();
    }
    
    saveTimelineData();

    document.querySelectorAll('.timeline-bar').forEach(bar => {
        bar.classList.remove('dragging');
    });

    TIMELINE.dragState = null;
    document.removeEventListener('mousemove', handleTimelineMouseMove);
    document.removeEventListener('mouseup', handleTimelineMouseUp);

    renderTimeline();
    showNotification('Timeline updated', 'success');
}

function addQuarterMonths(monthString, weekOffset, quarterMonthsToAdd) {
    const date = new Date(monthString + '-01');
    const currentMonthIndex = date.getMonth();
    const currentYear = date.getFullYear();
    
    const totalWeeks = (currentMonthIndex * 4) + weekOffset + quarterMonthsToAdd;
    
    const newMonthIndex = Math.floor(totalWeeks / 4);
    const newWeek = totalWeeks % 4;
    
    const yearOffset = Math.floor(newMonthIndex / 12);
    const finalMonthIndex = newMonthIndex % 12;
    const finalYear = currentYear + yearOffset;
    
    const finalMonth = finalMonthIndex + 1;
    
    return {
        month: `${finalYear}-${finalMonth.toString().padStart(2, '0')}`,
        week: newWeek < 0 ? 0 : newWeek > 3 ? 3 : newWeek
    };
}

function updateTimelineView() {
    TIMELINE.viewStartDate = document.getElementById('timelineStartMonth').value;
    TIMELINE.viewEndDate = document.getElementById('timelineEndMonth').value;
    saveTimelineData();
    renderTimeline();
}

function applyTimelineQuickRange() {
    const select = document.getElementById('timelineQuickRange');
    const range = select.value;
    const today = new Date();
    
    let start, end;
    
    switch(range) {
        case 'this-quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            start = new Date(today.getFullYear(), quarter * 3, 1);
            end = new Date(today.getFullYear(), quarter * 3 + 2, 1);
            break;
        case 'next-quarter':
            const nextQuarter = Math.floor(today.getMonth() / 3) + 1;
            start = new Date(today.getFullYear(), nextQuarter * 3, 1);
            end = new Date(today.getFullYear(), nextQuarter * 3 + 2, 1);
            break;
        case 'this-year':
            start = new Date(today.getFullYear(), 0, 1);
            end = new Date(today.getFullYear(), 11, 1);
            break;
        case 'next-year':
            start = new Date(today.getFullYear() + 1, 0, 1);
            end = new Date(today.getFullYear() + 1, 11, 1);
            break;
        default:
            return;
    }
    
    TIMELINE.viewStartDate = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}`;
    TIMELINE.viewEndDate = `${end.getFullYear()}-${(end.getMonth() + 1).toString().padStart(2, '0')}`;
    
    document.getElementById('timelineStartMonth').value = TIMELINE.viewStartDate;
    document.getElementById('timelineEndMonth').value = TIMELINE.viewEndDate;
    
    select.value = '';
    saveTimelineData();
    renderTimeline();
}

function openTimelineAddProjectsModal() {
    const modal = document.getElementById('timelineAddProjectsModal');
    const list = document.getElementById('timelineProjectList');
    
    const availableProjects = APP.projects.filter(p => 
        p.status !== 'complete' && !TIMELINE.projects.find(tp => tp.id === p.id)
    );

    if (availableProjects.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">No available projects to add</div>';
    } else {
        list.innerHTML = availableProjects.map(p => `
            <label class="timeline-project-list-item">
                <input type="checkbox" value="${p.id}">
                <div class="timeline-project-list-item-content">
                    <div class="timeline-project-list-item-title">${p.title}</div>
                    <div class="timeline-project-list-item-meta">
                        ${p.categories ? p.categories.join(', ') : ''} | Status: ${p.status}
                    </div>
                </div>
            </label>
        `).join('');
    }
    
    modal.style.display = 'block';
}

function closeTimelineAddProjectsModal() {
    document.getElementById('timelineAddProjectsModal').style.display = 'none';
}

function addSelectedTimelineProjects() {
    const checkboxes = document.querySelectorAll('#timelineProjectList input[type="checkbox"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (selectedIds.length === 0) {
        showNotification('Please select at least one project', 'error');
        return;
    }
    
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 2);
    const endMonth = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    selectedIds.forEach(id => {
        const project = APP.projects.find(p => p.id === id);
        if (project) {
            if (!project.timeline) {
                project.timeline = {
                    startMonth: currentMonth,
                    endMonth: endMonth,
                    startWeek: 0,
                    endWeek: 3,
                    displayOrder: TIMELINE.projects.length
                };
            }
            TIMELINE.projects.push(project);
        }
    });
    
    saveToLocalStorage();
    saveTimelineData();
    renderTimeline();
    closeTimelineAddProjectsModal();
    showNotification(`Added ${selectedIds.length} project(s) to timeline`, 'success');
}

function clearTimelineProjects() {
    showConfirm('Remove all projects from timeline? This will not delete the projects.', function() {
        TIMELINE.projects = [];
        saveTimelineData();
        renderTimeline();
        showNotification('Timeline cleared', 'success');
    });
}

function removeProjectFromTimeline(projectId) {
    TIMELINE.projects = TIMELINE.projects.filter(p => p.id !== projectId);
    saveTimelineData();
    renderTimeline();
    showNotification('Project removed from timeline', 'success');
}
