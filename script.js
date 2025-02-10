'use strict';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application initialized');
    init();
});

// Initialize variables
let questions = [];
let editingQuestionId = null;
const searchInput = document.getElementById('searchInput');
const suggestionsDiv = document.getElementById('suggestions');
const questionsGrid = document.getElementById('questionsGrid');
const modal = document.getElementById('questionModal');
const questionForm = document.getElementById('questionForm');

function init() {
    loadQuestions();
    setupEventListeners();
    
    // Setup back button handler
    document.getElementById('backButton').addEventListener('click', () => {
        displayAllQuestions();
        document.getElementById('backButton').style.display = 'none';
    });
}

function setupEventListeners() {
    // Search input handling
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keydown', handleKeyboardNavigation);
    
    // Modal handling
    document.getElementById('newQuestionBtn').addEventListener('click', openModal);
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    questionForm.addEventListener('submit', handleNewQuestion);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm === '') {
        suggestionsDiv.style.display = 'none';
        displayAllQuestions();
        return;
    }

    const matches = questions.filter(q => 
        q.title.toLowerCase().includes(searchTerm)
    );

    displaySuggestions(matches);
    filterQuestions(searchTerm);
}

function handleKeyboardNavigation(e) {
    const suggestions = suggestionsDiv.children;
    let activeIndex = Array.from(suggestions).findIndex(el => el.classList.contains('active'));

    switch(e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (activeIndex < suggestions.length - 1) {
                if (activeIndex >= 0) suggestions[activeIndex].classList.remove('active');
                suggestions[activeIndex + 1].classList.add('active');
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (activeIndex > 0) {
                suggestions[activeIndex].classList.remove('active');
                suggestions[activeIndex - 1].classList.add('active');
            }
            break;
        case 'Enter':
            e.preventDefault();
            if (activeIndex >= 0) {
                const selectedMatch = suggestions[activeIndex].textContent;
                showQuestionDetail(selectedMatch);
                suggestionsDiv.style.display = 'none';
                searchInput.value = selectedMatch;
            } else if (suggestions.length > 0) {
                const firstMatch = suggestions[0].textContent;
                showQuestionDetail(firstMatch);
                suggestionsDiv.style.display = 'none';
                searchInput.value = firstMatch;
            }
            break;
    }
}

function displaySuggestions(matches) {
    suggestionsDiv.innerHTML = '';
    if (matches.length === 0) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    matches.forEach(match => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = match.title;
        div.addEventListener('click', () => {
            showQuestionDetail(match.title);
            suggestionsDiv.style.display = 'none';
            searchInput.value = match.title;
        });
        suggestionsDiv.appendChild(div);
    });

    suggestionsDiv.style.display = 'block';
}

function filterQuestions(searchTerm) {
    const cards = document.querySelectorAll('.question-card');
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        if (title.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function showQuestionDetail(title) {
    const question = questions.find(q => q.title === title);
    if (!question) return;

    questionsGrid.innerHTML = '';
    const card = createQuestionCard(question, true);
    card.classList.add('detail-view');
    questionsGrid.appendChild(card);
    
    // Show back button
    document.getElementById('backButton').style.display = 'block';
}

function displayAllQuestions() {
    questionsGrid.innerHTML = '';
    questions.forEach(question => {
        questionsGrid.appendChild(createQuestionCard(question, false));
    });
}

function createQuestionCard(question, isDetailView) {
    const card = document.createElement('div');
    card.className = 'question-card';
    
    // Add edit/delete controls
    const controls = document.createElement('div');
    controls.className = 'card-controls';
    const editBtn = document.createElement('button');
    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>`;
    editBtn.className = 'edit-btn';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        openEditModal(question);
    };
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'X';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteQuestion(question.id);
    };
    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);
    card.appendChild(controls);
    
    // Create the title
    const title = document.createElement('h3');
    title.textContent = question.title;
    card.appendChild(title);

    // Create content area container
    const contentArea = document.createElement('div');
    contentArea.className = 'content-area';

    // Add content
    const content = document.createElement('p');
    content.textContent = question.content;
    contentArea.appendChild(content);

    // Add explanation
    if (question.explanation) {
        const explanation = document.createElement('div');
        explanation.className = 'explanation';
        explanation.innerHTML = `
            <h4>Explanation</h4>
            <div>${question.explanation}</div>
        `;
        contentArea.appendChild(explanation);
    }

    // Add code block if exists
    if (question.codeSnippet) {
        const codeBlock = document.createElement('div');
        codeBlock.className = 'code-block';
        codeBlock.innerHTML = `
            <pre><code class="language-java">${Prism.highlight(
                question.codeSnippet,
                Prism.languages.java,
                'java'
            )}</code></pre>
        `;
        contentArea.appendChild(codeBlock);
    }

    // Add content area to card
    card.appendChild(contentArea);

    // Add tags
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'tags';
    tagsContainer.innerHTML = question.tags
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');
    card.appendChild(tagsContainer);

    // Add click handler for grid view
    if (!isDetailView) {
        card.addEventListener('click', (e) => {
            if (!e.target.matches('button')) {
                showQuestionDetail(question.title);
            }
        });
    }

    return card;
}

function handleNewQuestion(e) {
    e.preventDefault();
    try {
        const newQuestion = {
            title: document.getElementById('questionTitle').value.trim(),
            content: document.getElementById('questionContent').value,  // Preserve whitespace
            explanation: document.getElementById('questionExplanation').value,  // Preserve whitespace
            codeSnippet: document.getElementById('codeSnippet').value,  // Preserve whitespace
            tags: document.getElementById('questionTags').value.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag),
            id: Date.now()
        };

        if (!newQuestion.title) {
            alert('Title is required!');
            return;
        }

        questions.push(newQuestion);
        saveQuestions();
        displayAllQuestions();
        closeModal();
        questionForm.reset();
        console.log('New question added successfully:', newQuestion);
    } catch (error) {
        console.error('Error adding new question:', error);
        alert('Error adding question. Please try again.');
    }
}

function openModal() {
    editingQuestionId = null;
    document.getElementById('modalTitle').textContent = 'Add New Question';
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
    questionForm.reset();
}

function openEditModal(question) {
    editingQuestionId = question.id;
    document.getElementById('modalTitle').textContent = 'Edit Question';
    document.getElementById('questionTitle').value = question.title;
    document.getElementById('questionContent').value = question.content;
    document.getElementById('questionExplanation').value = question.explanation;
    document.getElementById('codeSnippet').value = question.codeSnippet || '';
    document.getElementById('questionTags').value = question.tags.join(', ');
    modal.style.display = 'block';
}

function saveQuestions() {
    try {
        localStorage.setItem('questions', JSON.stringify(questions));
        console.log('Questions saved successfully:', questions);
    } catch (error) {
        console.error('Error saving questions:', error);
    }
}

function loadQuestions() {
    try {
        const saved = localStorage.getItem('questions');
        if (saved) {
            questions.length = 0; // Clear existing array
            const loadedQuestions = JSON.parse(saved);
            questions.push(...loadedQuestions);
            console.log('Questions loaded successfully:', questions);
        }
        displayAllQuestions();
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

function deleteQuestion(id) {
    if (confirm('Are you sure you want to delete this question?')) {
        questions = questions.filter(q => q.id !== id);
        saveQuestions();
        displayAllQuestions();
    }
}
