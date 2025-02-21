// search-handler.js
export class SearchHandler {
    constructor(options = {}) {
        this.inputElement = options.inputElement;
        this.statusElement = options.statusElement;
        this.resultsElement = options.resultsElement;
        this.searchEndpoint = options.searchEndpoint || '/api/search';
        this.debounceTime = options.debounceTime || 300;

        this.abortController = null;
        this.timeout = null;

        this.bindEvents();
    }

    bindEvents() {
        this.inputElement.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
    }

    handleSearch(searchTerm) {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        if (this.abortController) {
            this.abortController.abort();
        }

        this.timeout = setTimeout(() => {
            this.performSearch(searchTerm);
        }, this.debounceTime);
    }

    async performSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.clearResults();
            return;
        }

        this.abortController = new AbortController();
        this.showLoading();

        try {
            const response = await fetch(this.searchEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: searchTerm }),
                signal: this.abortController.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayResults(data.results);
            this.clearStatus();

        } catch (error) {
            this.handleError(error);
        }
    }

    showLoading() {
        this.statusElement.innerHTML = '<span class="loading">Loading...</span>';
    }

    clearStatus() {
        this.statusElement.innerHTML = '';
    }

    clearResults() {
        this.resultsElement.innerHTML = '';
        this.clearStatus();
    }

    handleError(error) {
        if (error.name === 'AbortError') {
            console.log('Search cancelled');
        } else {
            this.statusElement.innerHTML = '<span class="error">An error occurred</span>';
            console.error('Search error:', error);
        }
    }

    displayResults(results) {
        if (!results.length) {
            this.resultsElement.innerHTML = '<div>No results found</div>';
            return;
        }

        this.resultsElement.innerHTML = results
            .map(result => this.createResultHTML(result))
            .join('');
    }

    createResultHTML(result) {
        return `
            <div class="result-item">
                <h3>${this.escapeHtml(result.name)}</h3>
                <p>${this.escapeHtml(result.description || '')}</p>
            </div>
        `;
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}