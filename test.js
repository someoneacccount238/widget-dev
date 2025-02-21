const prodUrl = "https://smartsearch.spefix.com"
    // development
const devUrl = "http://localhost:3000"

const currentUrl = prodUrl;

const quickSearchUrl = currentUrl + '/api/quick-search';
const additionalSearchUrl = currentUrl + '/api/additional-search';
const suggestionsUrl = currentUrl + '/api/suggestions';
const correctionUrl = currentUrl + '/api/correct';
const languageRoute = currentUrl + '/api/language';
const determineUserLangUrl = currentUrl + '/api/determine-user-lang';


const searchInput = document.querySelector('.widget-search-input');


class ProductSearchWidget {

    async initWidget() {

        const resp = await fetch('https://widget-self-five.vercel.app/widget/widget.html');
        const widgetHtml = await resp.text();


        const tmpDiv = document.createElement('div');
        tmpDiv.innerHTML = widgetHtml.trim();

        //we create a widget container
        this.widgetContainer = tmpDiv.firstElementChild;
        document.body.appendChild(this.widgetContainer);


        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap';
        document.head.appendChild(fontLink);


        const sheets = [
            'widget/widget.css',
            'widget/suggestion.css',
            'widget/history.css',
            'widget/category.css',
            'widget/container.css',
            'widget/media.css'
        ];
        sheets.forEach((stylesheet) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://widget-self-five.vercel.app/${stylesheet}`;

            document.head.appendChild(link);
        });


        const styleTag = document.createElement('style');
        styleTag.textContent = `

.filter-container {
  background: #f9f9f9;
  overflow-y: auto;
  transition: height 0.3s ease;
}

.filter-content {
  padding: 10px;
}
.filter-param-block {
  margin-bottom: 12px;
}
.filter-checkbox-label {
  display: block;
  margin-bottom: 5px;
}



.product-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.more-link {
  margin: 10px 0;
  color: #007bff;
  cursor: pointer;
  font-weight: bold;
}
`;
        document.head.appendChild(styleTag);


        // const triggers = document.querySelectorAll(`#${this.triggerInputId}`);
        // if (!triggers.length) {
        //     console.error('[LOG:initWidget] No triggers found');
        //     return;
        // }
        // triggers.forEach((inp) => this.setupEventHandlers(this.widgetContainer, inp));



        this.adjustDefaultPanels();
    }


    adjustDefaultPanels() {


        const currentWidth = window.innerWidth;


        const filterContainer = this.widgetContainer.querySelector('.filter-container');
        const catAccordion = this.widgetContainer.querySelector('.category-accordion');



        if (!filterContainer || !catAccordion) {
            return;
        }


        if (currentWidth < 1100) {
            filterContainer.classList.add('collapsed');
            catAccordion.classList.add('collapsed');
        } else {
            filterContainer.classList.remove('collapsed');
            catAccordion.classList.remove('collapsed');
        }
    }
}
//dummy request
makeApiCall("test", quickSearchUrl);

document.addEventListener('DOMContentLoaded', () => {


    // searchInput.addEventListener('input', (e) => {
    //     showBlockOfSearchResults(e, quickSearchUrl)
    //     showBlockOfSearchResults(e, additionalSearchUrl)
    // });


    searchInput.addEventListener('focus', async(e) => {
        const widget = new ProductSearchWidget();
        await widget.initWidget();
    });
})

let timeoutId = null;

class HTMLElements {
    // Create or update timing display
    static displayTiming(timeTaken, elementToAppendHTML, label = '') {
        // Create new timing display element
        const timingElement = document.createElement('h1');
        timingElement.className = 'timing-display';
        timingElement.textContent = `${label} ${timeTaken.toFixed(2)}ms`;

        // Append new timing element to container
        const container = document.querySelector(elementToAppendHTML);
        container.appendChild(timingElement);

        console.log("timeTaken", timeTaken);
    }

}

async function showBlockOfSearchResults() {
    // Clear any existing timeout
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    let results1;
    let results2;
    // Add debouncing to avoid too many API calls
    timeoutId = setTimeout(async() => {

        results1 = await makeApiCall(query, quickSearchUrl)
        results2 = await makeApiCall(query, additionalSearchUrl)

    }, 500); // Wait 2 seconds after user stops typing before making API calls

    return { results1, results2 };
}

async function timePerformance(query, apiRoute, func) {
    const startTime = performance.now();
    const data = await func(query, apiRoute);
    const endTime = performance.now();
    const timeTaken = endTime - startTime;
    return { data, timeTaken };
}

async function makeApiCall(query, apiRoute) {
    // Only proceed if query matches current input

    try {
        const response = await fetch(apiRoute, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ word: query, language: "uk", domain: 3 })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        //faster than response.json()
        const text = await response.text();
        const data = JSON.parse(text);

        const currentQuery = searchInput.value.trim();
        // Verify the response matches current input
        if (!data.word || data.word !== currentQuery) {
            return [];
        }
        console.log("data results " + JSON.stringify(data.results));

        console.log("data word " + data.word);


        return data.results;
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error fetching search results:', error);
        }
        return [];
    }
}

function renderResults(data, container) {
    const resultContainer = document.querySelector(container);
    // resultContainer.innerHTML = ''; // do not Clear previous results

    data.forEach(item => {
        const resultElement = document.createElement('div');
        resultElement.textContent = item.name; // Adjust based on your data structure
        resultContainer.appendChild(resultElement);
    });
}