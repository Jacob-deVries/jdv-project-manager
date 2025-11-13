// Timeline functionality for PKD Dashboard - Updated initialization section

const TIMELINE = {
    projects: [],
    viewStartDate: '',
    viewEndDate: '',
    dragState: null,
    monthWidth: 120,
    weekWidth: 30,
    initialized: false  // Add this flag to track initialization
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
    
    const startInput = document.getElementById('timelineStartMonth');
    const endInput = document.getElementById('timelineEndMonth');
    
    if (startInput) startInput.value = TIMELINE.viewStartDate;
    if (endInput) endInput.value = TIMELINE.viewEndDate;
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
            
            const startInput = document.getElementById('timelineStartMonth');
            const endInput = document.getElementById('timelineEndMonth');
            
            if (startInput) startInput.value = TIMELINE.viewStartDate;
            if (endInput) endInput.value = TIMELINE.viewEndDate;
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

// ... rest of timeline.js remains the same
