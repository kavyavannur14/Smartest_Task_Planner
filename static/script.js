document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ELEMENT SELECTORS ---
    // Get all the necessary elements from the page once.
    const goalInput = document.getElementById('goal-input');
    const generateBtn = document.getElementById('generate-btn');
    const loader = document.getElementById('loader');
    const resultsContainer = document.getElementById('results-container');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const congratsPopup = document.getElementById('congrats-popup');
    const newTaskBtn = document.getElementById('new-task-btn');
    const themeButtons = {
        light: document.getElementById('light-theme'),
        dark: document.getElementById('dark-theme'),
        pink: document.getElementById('pink-theme')
    };

    // --- 2. THEME SWITCHER LOGIC ---
    // Function to apply a theme and save it
    const applyTheme = (theme) => {
        // Remove all possible theme classes from the body
        document.body.classList.remove('light-theme', 'dark-theme', 'pink-theme');
        // Add the selected theme class
        document.body.classList.add(theme);

        // Update the active button style
        Object.values(themeButtons).forEach(btn => {
            btn.classList.remove('active');
        });
        themeButtons[theme.replace('-theme', '')].classList.add('active');

        // Save the theme choice to the browser's local storage
        localStorage.setItem('selectedTheme', theme);
    };

    // Add click listeners to each theme button
    themeButtons.light.addEventListener('click', () => applyTheme('light-theme'));
    themeButtons.dark.addEventListener('click', () => applyTheme('dark-theme'));
    themeButtons.pink.addEventListener('click', () => applyTheme('pink-theme'));

    // On page load, check for a saved theme in local storage
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme('light-theme'); // Default to light theme if nothing is saved
    }


    // --- 3. PLAN GENERATION LOGIC ---
    generateBtn.addEventListener('click', async () => {
        const goal = goalInput.value.trim();
        if (!goal) {
            alert('Please enter a goal.');
            return;
        }

        // Show loader and clear any previous results
        loader.style.display = 'block';
        resultsContainer.innerHTML = '';
        progressContainer.style.display = 'none'; // Hide progress from previous plan

        try {
            // Fetch the plan from your backend endpoint
            const response = await fetch('/create-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal: goal }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            
            // Once data is received, hide the loader and display the results
            loader.style.display = 'none';
            displayPlanResults(data);

        } catch (error) {
            loader.style.display = 'none';
            resultsContainer.innerHTML = `<p style="color: red;">An error occurred: ${error.message}</p>`;
            console.error('Error:', error);
        }
    });


    // --- 4. DISPLAY & PROGRESS LOGIC ---
    let completedTasks = 0;
    let totalTasks = 0;

    // This single function now handles displaying the plan AND setting up progress tracking
    function displayPlanResults(data) {
        resultsContainer.innerHTML = ''; // Clear again just in case
        if (data.error) {
            resultsContainer.innerHTML = `<p style="color: red;">Error from server: ${data.error}</p>`;
            return;
        }

        const projectTitle = document.createElement('h2');
        projectTitle.textContent = data.project_name || 'Generated Plan';
        resultsContainer.appendChild(projectTitle);

        // Reset progress for the new plan
        completedTasks = 0;
        totalTasks = data.tasks.length;

        if (totalTasks > 0) {
            progressContainer.style.display = 'block';
            updateProgressBar(); // Initial call to show 0%
        }

        data.tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            
            const title = document.createElement('h3');
            title.textContent = `${task.task_id}. ${task.task_name}`;

            const description = document.createElement('p');
            description.textContent = task.description;

            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.innerHTML = `<strong>Timeline:</strong> ${task.timeline_days} days | <strong>Dependencies:</strong> ${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}`;
            
            // Group checkbox and title for better layout
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.appendChild(checkbox);
            header.appendChild(title);
            
            card.appendChild(header);
            card.appendChild(description);
            card.appendChild(meta);
            
            // Add event listener to the checkbox for this task
            checkbox.addEventListener('change', () => {
                completedTasks += checkbox.checked ? 1 : -1;
                card.style.opacity = checkbox.checked ? '0.6' : '1';
                updateProgressBar();
            });

            resultsContainer.appendChild(card);
        });
    }

    // This function updates the progress bar UI
    function updateProgressBar() {
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}% completed`;

        if (percentage === 100) {
            // Use a short delay to allow the progress bar to animate to 100%
            setTimeout(() => {
                congratsPopup.classList.add('show');
            }, 500);
        }
    }

    // --- 5. RESET BUTTON LOGIC ---
    // Handles the "Add Another Task" button in the popup
    newTaskBtn.addEventListener('click', () => {
        congratsPopup.classList.remove('show');
        resultsContainer.innerHTML = '';
        progressContainer.style.display = 'none';
        goalInput.value = '';
    });

});