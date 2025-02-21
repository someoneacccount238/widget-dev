class ProductSearchWidget {
    constructor(triggerInputId) {

        this.triggerInputId = triggerInputId;

        this.timeoutId = null;


        // Add CORS headers for requests
        this.requestHeaders = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        };

        // Add error handling wrapper
        this.handleApiRequest = async(url, options) => {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        ...this.requestHeaders,
                        ...options.headers
                    },
                    mode: 'cors' // Explicitly set CORS mode
                });

                if (!response.ok) {
                    console.warn(`API request failed: ${url}`, response.status);
                    return null;
                }

                return await response.json();
            } catch (error) {
                if (error.name === 'AbortError') {
                    // Handle aborted requests silently
                    return null;
                }

                console.error(`API request error: ${url}`, error);
                return null;
            }
        };


        this.timeoutId = null;


        // production
        const prodUrl = "https://smartsearch.spefix.com"
            // development
        const devUrl = "http://localhost:3000"

        const currentUrl = prodUrl;

        this.quickSearchUrl = currentUrl + '/api/quick-search';

        this.quickSearchByIDUrl = currentUrl + '/api/quick-search-by-id';

        this.additionalSearchUrl = currentUrl + '/api/additional-search';
        this.suggestionsUrl = currentUrl + '/api/suggestions';
        this.correctionUrl = currentUrl + '/api/correct';
        this.languageRoute = currentUrl + '/api/language';
        this.addPageViewUrl = currentUrl + '/api/add-page-view';
        this.determineLangUrl = currentUrl + '/api/determine-user-lang';

        this.checkSpellingUrl = currentUrl + '/api/check-spelling-errors';
        this.translatedSearchUrl = currentUrl + '/api/translate';

        this.searchHistory = [];
        this.abortController = null;
        this.currentQuery = null;
        this.siteDomain = this.getDomainIdFromInput();
        this.allProducts = [];
        this.activeFilters = {};
        this.foundProductsLengths = [];

        this.overlayEl = document.createElement('div');
        this.overlayEl.className = 'widget-overlay';
        document.body.appendChild(this.overlayEl);

        this.maxItemsOnAllResults = 4;

        const productCount = this.getProductCountFromInput();

        this.minProductCount = productCount * 0.88;

        // this.minProductCount2 = productCount * 0.15;
        this.minProductCount2 = 1000;

        this.translationsMap = {
            ru: {
                searchPlaceholder: 'Поиск...',
                allResults: 'Все результаты',
                filters: 'Фильтры',
                categories: 'Категории',
                noProductsFound: 'Товаров не найдено.',
                inStock: 'В наличии',
                outOfStock: 'Нет в наличии',
                startSearch: 'Начните поиск...',
                more: 'Еще',
                pay: 'Это бесплатная версия. Для полного доступа, пожалуйста, <a href="https://smartsearch.spefix.com/login" target="_blank">обновите свой план</a>.'
            },
            uk: {
                searchPlaceholder: 'Пошук...',
                allResults: 'Всі результати',
                filters: 'Фільтри',
                categories: 'Категорії',
                noProductsFound: 'Товарів не знайдено',
                inStock: 'В наявності',
                outOfStock: 'Немає в наявності',
                startSearch: 'Почніть пошук...',
                more: 'Ще',
                pay: 'Ваша підписка закінчилась. Для повного доступу, будь ласка, <a href="https://smartsearch.spefix.com/login" target="_blank">оновіть свій план</a>.'
            },
            en: {
                searchPlaceholder: 'Search...',
                allResults: 'All results',
                filters: 'Filters',
                categories: 'Categories',
                noProductsFound: 'No products found.',
                inStock: 'In stock',
                outOfStock: 'Out of stock',
                startSearch: 'Start searching...',
                more: 'More',
                pay: 'Your subscription has expired. For full access, please <a href="https://smartsearch.spefix.com/login" target="_blank">upgrade your plan</a>.'
            },
            pl: {
                searchPlaceholder: 'Szukaj...',
                allResults: 'Wszystkie wyniki',
                filters: 'Filtry',
                categories: 'Kategorie',
                noProductsFound: 'Nie znaleziono produktów.',
                inStock: 'Dostępne',
                outOfStock: 'Niedostępne',
                startSearch: 'Rozpocznij wyszukiwanie...',
                more: 'Więcej',
                pay: 'Twoja subskrypcja wygasła. Aby uzyskać pełny dostęp, <a href="https://smartsearch.spefix.com/login" target="_blank">zaktualizuj swój plan</a>.'
            },
            de: {
                searchPlaceholder: 'Suche...',
                allResults: 'Alle Ergebnisse',
                filters: 'Filter',
                categories: 'Kategorien',
                noProductsFound: 'Keine Produkte gefunden.',
                inStock: 'Auf Lager',
                outOfStock: 'Nicht vorrätig',
                startSearch: 'Beginnen Sie mit der Suche...',
                more: 'Mehr',
                pay: 'Ihre Abonnement läuft in Kürze ab. Für vollen Zugriff, bitte <a href="https://smartsearch.spefix.com/login" target="_blank">aktualisieren Sie Ihren Plan</a>.'
            }
        };

        this.foundProducts = [];
        const lang = this.getLangFromInput();

        this.translations = this.translationsMap[lang]; // Default to English translations

        this.ifSearchIsDone = false;

        this.i = 0;

        this.initWidget();
    }





    async fetchAPI(targetUrl, body) {
        const devUrl = "http://localhost:3000"
        const prod_url = "https://smartsearch.spefix.com"

        try {

            const response = await fetch(`${targetUrl}`, {
                method: 'POST', // Use POST method
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': prod_url, // Add an Origin header (use your own domain) 
                },
                body: JSON.stringify(body), // Add the POST request body
            });
            const data = await response.json();
            return data; // Return the data
        } catch (error) {
            console.error('Error:', error);
        }
    }

    showHistory() {
        const historyList = document.querySelector('.widget-history-list');
        if (historyList) historyList.classList.add('show');
    }
    hideHistory() {
        const historyList = document.querySelector('.widget-history-list');
        if (historyList) historyList.classList.remove('show');
    }

    async initWidget() {

        //TODO вернуть
        // const userLang = await this.fetchInterfaceLanguage(this.siteDomain);
        // if (userLang) {
        //     this.applyTranslations(userLang);
        // }

        const resp = await fetch('https://widget-dev-iota.vercel.app/widget/widget.html');
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
            'widget.css',
            'suggestion.css',
            'history.css',
            'category.css',
            'container.css',
            'media.css'
        ];
        sheets.forEach((stylesheet) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://widget-dev-iota.vercel.app/widget/${stylesheet}`;

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


        const triggers = document.querySelectorAll(`#${this.triggerInputId}`);
        if (!triggers.length) {
            console.error('[LOG:initWidget] No triggers found');
            return;
        }
        triggers.forEach((inp) => this.setupEventHandlers(this.widgetContainer, inp));


        await this.getOrCreateUserId();

        this.createCategoryAccordion();

        this.createFilterAccordion();


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

    createCategoryAccordion() {

        const leftCol = this.widgetContainer.querySelector('.left-column');
        const catsContainer = this.widgetContainer.querySelector('.categories-container');
        if (!leftCol || !catsContainer) {
            return;
        }

        const catAccordion = document.createElement('div');
        catAccordion.className = 'category-accordion collapsed';

        const catHeader = document.createElement('div');
        catHeader.className = 'category-accordion-header';
        catHeader.textContent = `${this.translations.categories} ▼`;

        catHeader.addEventListener('click', () => {
            catAccordion.classList.toggle('collapsed');
            if (catAccordion.classList.contains('collapsed')) {
                catHeader.textContent = `${this.translations.categories} ▼`;
            } else {
                catHeader.textContent = `${this.translations.categories} ▲`;
            }
        });

        const catContent = document.createElement('div');
        catContent.className = 'category-accordion-content';


        catContent.appendChild(catsContainer);
        catAccordion.appendChild(catHeader);
        catAccordion.appendChild(catContent);


        leftCol.appendChild(catAccordion);


    }

    createFilterAccordion() {

        const leftCol = this.widgetContainer.querySelector('.left-column');
        if (!leftCol) {
            return;
        }

        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container collapsed';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'filter-toggle-btn';
        toggleBtn.textContent = `${this.translations.filters} ▼`;

        toggleBtn.addEventListener('click', () => {
            filterContainer.classList.toggle('collapsed');

            const isCollapsedNow = filterContainer.classList.contains('collapsed');

            if (isCollapsedNow) {
                toggleBtn.textContent = `${this.translations.filters} ▼`;
            } else {
                toggleBtn.textContent = `${this.translations.filters} ▲`;
            }
        });

        const filterContent = document.createElement('div');
        filterContent.className = 'filter-content';

        filterContainer.appendChild(toggleBtn);
        filterContainer.appendChild(filterContent);



        leftCol.appendChild(filterContainer);
    }

    buildFilterMenu() {
        const filterContainer = this.widgetContainer.querySelector('.filter-container');
        const filterContent = filterContainer.querySelector('.filter-content');
        if (!filterContainer || !filterContent) {
            return;
        }

        filterContent.innerHTML = '';

        const filterData = {};
        this.allProducts.forEach((prod) => {
            if (!Array.isArray(prod.params)) return;
            prod.params.forEach((p) => {
                if (!filterData[p.name]) {
                    filterData[p.name] = new Set();
                }
                filterData[p.name].add(p.value);
            });
        });

        const paramNames = Object.keys(filterData);

        if (!paramNames.length) {
            filterContainer.style.display = 'none';
            this.hasFilters = false;
            return;
        }

        filterContainer.style.display = 'flex';
        this.hasFilters = true;

        paramNames.forEach((paramName) => {
            const paramBlock = document.createElement('div');
            paramBlock.className = 'filter-param-block';

            const titleEl = document.createElement('h4');
            titleEl.textContent = paramName;
            paramBlock.appendChild(titleEl);

            const valArr = Array.from(filterData[paramName]);
            valArr.forEach((val) => {
                const label = document.createElement('label');
                label.className = 'filter-checkbox-label';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'filter-checkbox';
                checkbox.value = val;

                checkbox.addEventListener('change', async() => {
                    if (!this.activeFilters[paramName]) {
                        this.activeFilters[paramName] = new Set();
                    }
                    if (checkbox.checked) {
                        this.activeFilters[paramName].add(val);
                    } else {
                        this.activeFilters[paramName].delete(val);
                        if (!this.activeFilters[paramName].size) {
                            delete this.activeFilters[paramName];
                        }
                    }


                    try {
                        await fetch('https://smartsearch.spefix.com/api/filter-operation', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                domain: this.siteDomain,
                                filterName: paramName,
                                value: val,
                                isChecked: checkbox.checked
                            })
                        });
                    } catch (error) {
                        console.error('[LOG:filter-operation] Error calling /api/filter-operation:', error);
                    }


                    const filtered = this.applyActiveFilters(this.allProducts);
                    const cats = this.widgetContainer.querySelector('.categories-container');
                    const res = this.widgetContainer.querySelector('.widget-result-container');

                    console.log('====filtered=======');
                    console.log(filtered);
                    console.log('===========');
                    this.displayProductsByCategory(filtered, cats, res, false, false);
                });

                const spanVal = document.createElement('span');
                spanVal.textContent = val;

                label.appendChild(checkbox);
                label.appendChild(spanVal);
                paramBlock.appendChild(label);
            });

            filterContent.appendChild(paramBlock);
        });
    }


    applyActiveFilters(products) {
        const keys = Object.keys(this.activeFilters);
        if (!keys.length) return products;

        return products.filter((prod) => {
            for (const paramName of keys) {
                const neededVals = this.activeFilters[paramName];
                const found = prod.params.find((p) => p.name === paramName);
                if (!found) return false;
                if (!neededVals.has(found.value)) return false;
            }
            return true;
        });
    }

    setupEventHandlers(widgetContainer, triggerInput) {


        const sInput = widgetContainer.querySelector('.widget-search-input');

        const cButton = widgetContainer.querySelector('.widget-close-button');
        const catsCont = widgetContainer.querySelector('.categories-container');
        const resCont = widgetContainer.querySelector('.widget-result-container');
        const suggList = widgetContainer.querySelector('.widget-suggestions-list');

        const searchIcon = widgetContainer.querySelector('.widget-search-icon');

        cButton.addEventListener('click', () => {
            widgetContainer.style.display = 'none';
            this.overlayEl.style.display = 'none';
            document.body.style.overflow = '';


            const sInput = widgetContainer.querySelector('.widget-search-input');
            if (sInput) {
                sInput.value = '';
            }


            const resCont = widgetContainer.querySelector('.widget-result-container');
            if (resCont) {
                resCont.innerHTML = '';
            }


            const suggList = widgetContainer.querySelector('.widget-suggestions-list');
            if (suggList) {
                suggList.style.display = 'none';
                suggList.innerHTML = '';
            }

            const leftCol = this.widgetContainer.querySelector('.left-column');
            if (leftCol) {
                leftCol.style.display = 'none';
            }
        });

        triggerInput.addEventListener('click', () => {
            //здесь открывается виджет
            // console.log('focus event triggered');
            widgetContainer.style.display = 'flex';
            this.overlayEl.style.display = 'block';
            document.body.style.overflow = 'hidden';
            sInput.focus();
            const q = sInput.value.trim();
            if (!q) {
                this.showHistory();
            } else {
                this.hideHistory();
            }
        });



        const handleInput = async(e) => {
            // const value = e.target.value;

            // if (!/^[a-zA-Z0-9а-яА-ЯёЁ\s]*$/.test(value)) {
            //     alert("Only letters, numbers, and spaces are allowed!");
            //     e.target.value = value.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s]/g, ""); // Remove invalid characters
            //     return; // Ignore the event if it's not a letter or number

            // }

            let query = e.target.value;
            if (query === '') {
                this.correctedProducts = [];
                this.exactProducts = [];
                this.allProducts = [];
            }
            const reqToken = Symbol('requestToken');
            this.currentRequestToken = reqToken;

            const last = query.slice(-1);
            if (last === ' ') {
                query = query.trimEnd();

                //TODO: uncomment this
                // await this.correctQuery(query, sInput);
                query = sInput.value;
                this.currentQuery = query;
            }

            if (!query.trim()) {
                this.showHistory();
                suggList.style.display = 'none';
                return;
            } else {
                this.hideHistory();
            }

            if (this.abortController) this.abortController.abort();
            this.abortController = new AbortController();
            const controller = this.abortController;

            if (query.trim().length < 1) {
                suggList.innerHTML = '';
                suggList.style.display = 'none';
                return;
            }

            try {
                let productPromise = null;
                if (query.trim().length >= 3) {
                    resCont.innerHTML = ``;
                    productPromise = this.fetchProducts(query.trim(), catsCont, resCont, reqToken, controller);
                } else {
                    resCont.innerHTML = ``;
                    catsCont.innerHTML = '';
                }
                await Promise.all([productPromise].filter(Boolean));

            } catch (err) {
                if (err.name === 'AbortError') {} else {
                    console.error('[LOG:setupEventHandlers] Error:', err);
                }
            }
        }


        // The code listens for user input and dynamically fetches suggestions 
        //and search results as the user types.
        sInput.addEventListener('input', handleInput);


        sInput.addEventListener('keyup', handleInput);


        // sInput.addEventListener('keydown', async(e) => {
        //     if (e.key === 'Enter') {
        //         e.preventDefault();

        //         const query = sInput.value.trim();
        //         if (!query) {
        //             return;
        //         }



        //         await this.correctQuery(query, sInput);

        //         try {
        //             const reqToken = Symbol('requestToken');
        //             this.currentRequestToken = reqToken;

        //             if (this.abortController) this.abortController.abort();
        //             this.abortController = new AbortController();

        //             if (query.length >= 1) {
        //                 const catsCont = widgetContainer.querySelector('.categories-container');
        //                 const resCont = widgetContainer.querySelector('.widget-result-container');
        //                 await this.fetchProducts(query, catsCont, resCont, reqToken, this.abortController);
        //             }
        //         } catch (err) {
        //             console.error('[LOG:Enter Search] Error:', err);
        //         }
        //     }
        // });


        if (searchIcon) {
            searchIcon.addEventListener('click', async() => {
                const query = sInput.value.trim();
                if (!query) {
                    return;
                }



                await this.correctQuery(query, sInput);

                try {
                    const reqToken = Symbol('requestToken');
                    this.currentRequestToken = reqToken;

                    if (this.abortController) this.abortController.abort();
                    this.abortController = new AbortController();

                    if (query.length >= 1) {
                        await this.fetchProducts(query, catsCont, resCont, reqToken, this.abortController);
                    }
                } catch (err) {
                    console.error('[LOG:searchIcon] Error:', err);
                }
            });
        }


        document.addEventListener('click', (evt) => {
            if (suggList && !suggList.contains(evt.target) && evt.target !== sInput) {
                suggList.style.display = 'none';
            }
        });
    }

    async getOrCreateUserId() {
        if (!window.Cookies) await this.loadJsCookieLibrary();

        const domain = window.location.hostname || 'unknown-domain';

        const cookieName = `userId_${domain}`;

        let userId = Cookies.get(cookieName);
        if (!userId) {
            userId = Math.floor(Math.random() * 1e9).toString();
            Cookies.set(cookieName, userId, { expires: 365 });
        }
        this.userId = userId;
    }

    async loadJsCookieLibrary() {
        if (window.Cookies) return;
        return new Promise((res, rej) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/js-cookie@3.0.5/dist/js.cookie.min.js';
            script.onload = () => res();
            script.onerror = () => rej(new Error('Failed to load js-cookie'));
            document.head.appendChild(script);
        });
    }

    displayTiming(timeTaken, elementToAppendHTML, label = '') {
        // Check if timing display already exists
        const existingTiming = document.querySelector('.timing-display');
        if (existingTiming) {
            return; // Don't show anything if timing display exists
        }

        // Create new timing display element
        const timingElement = document.createElement('h5');
        timingElement.className = 'timing-display';
        timingElement.textContent = `${label} ${timeTaken.toFixed(2)}ms`;

        // Append new timing element to container
        const container = document.querySelector(elementToAppendHTML);
        container.appendChild(timingElement);
    }

    async makePOSTApiRequest(query, apiRoute, lang) {

        // console.log('====makePOSTApiRequest=======');
        // console.log("query: " + query);
        // console.log("apiRoute: " + apiRoute);
        // console.log('===========');

        // console.log(`Функция вызвана ${this.i + 1} раз`)
        // this.i++
        // Only proceed if query matches current input

        // Get domain ID from searchInput element
        const searchInput = document.getElementById('searchInput');


        const searchField2 = document.querySelector('.widget-search-input');
        const currentQuery2 = searchField2.value.trim();
        const domain = this.getDomainIdFromInput()

        try {
            const response = await fetch(apiRoute, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ word: currentQuery2, language: lang, domain })
            });

            if (!response.ok) {
                // alert('Network response was not ok');
                throw new Error('Network response was not ok');
            }

            //faster than response.json()
            const text = await response.text();
            const data = JSON.parse(text);

            const searchField = document.querySelector('.widget-search-input');
            const currentQuery = searchField.value.trim();

            // Verify the response matches current input
            if ((!data.word || data.word !== currentQuery) || data.word === "") {
                return [];
            }

            // console.log('apiRoute ' + apiRoute);
            // console.log("data results " + JSON.stringify(data.results));

            // console.log("data word " + data.word);

            if (data.isPaid) {
                return {
                    result: data.results,
                    isPaid: true
                };
            }
            return data.results
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching search results:', error)
                console.log(apiRoute);
            }
            return [];
        }
    }


    async makePOSTApiRequestAdditional(query, apiRoute, lang) {

        // console.log('====makePOSTApiRequest=======');
        // console.log("query: " + query);
        // console.log("apiRoute: " + apiRoute);
        // console.log('===========');

        // console.log(`Функция вызвана ${this.i + 1} раз`)
        // this.i++
        // Only proceed if query matches current input

        // Get domain ID from searchInput element
        const searchInput = document.getElementById('searchInput');


        const searchField2 = document.querySelector('.widget-search-input');
        const currentQuery2 = searchField2.value.trim();
        const domain = this.getDomainIdFromInput()

        try {
            const response = await fetch(apiRoute, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ word: currentQuery2, lang, domain })
            });

            if (!response.ok) {
                // alert('Network response was not ok');
                throw new Error('Network response was not ok');
            }

            //faster than response.json()
            const text = await response.text();
            const data = JSON.parse(text);

            const searchField = document.querySelector('.widget-search-input');
            const currentQuery = searchField.value.trim();

            // Verify the response matches current input
            if ((!data.word || data.word !== currentQuery) || data.word === "") {
                return [];
            }

            // console.log('apiRoute ' + apiRoute);
            // console.log("data results " + JSON.stringify(data.results));

            // console.log("data word " + data.word);

            if (data.isPaid) {
                return {
                    result: data.results,
                    isPaid: true
                };
            }
            return data.results
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching search results:', error)
                console.log(apiRoute);
            }
            return [];
        }
    }

    async makePOSTApiRequestLang(query, apiRoute) {
        const searchField2 = document.querySelector('.widget-search-input');
        const currentQuery2 = searchField2.value.trim();
        const domain = this.getDomainIdFromInput()

        try {
            const response = await fetch(apiRoute, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': window.location.origin // Add Origin header
                },
                mode: 'cors', // Explicitly set CORS mode
                credentials: 'omit', // Don't send credentials
                body: JSON.stringify({ word: currentQuery2, domain })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            return data.lang;
        } catch (error) {
            console.error('Error fetching language:', error);
            return 'en'; // Default to English on error
        }
    }

    async makeQuickSearchApiRequest(query, apiRoute) {

        console.log('====makeQuickSearchApiRequest=======');
        console.log("query: " + query);
        console.log("apiRoute: " + apiRoute);
        // console.log('===========');

        // console.log(`Функция вызвана ${this.i + 1} раз`)
        // this.i++
        // Only proceed if query matches current input

        // Get domain ID from searchInput element
        const searchInput = document.getElementById('searchInput');


        const searchField2 = document.querySelector('.widget-search-input');
        const currentQuery2 = searchField2.value.trim();
        const domain = this.getDomainIdFromInput()
        const lang = this.getLangFromInput()
        console.log('currentQuery2 ' + currentQuery2);
        const body = { word: currentQuery2, domain }
        console.log('body ' + JSON.stringify(body));
        try {
            const response = await fetch(apiRoute, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error('Network response was not ok');

            //faster than response.json()
            const text = await response.text();
            const data = JSON.parse(text);

            console.log('apiRoute ' + apiRoute);

            const searchField = document.querySelector('.widget-search-input');
            const currentQuery = searchField.value.trim();

            // Verify the response matches current input
            if ((!data.word || data.word !== currentQuery) || data.word === "") {
                return [];
            }
            // console.log("data results " + JSON.stringify(data.results));

            // console.log("data word " + data.word);

            if (data.isPaid) {
                return {
                    result: data.results,
                    isPaid: true,
                    lang: data.lang
                };
            }
            return {
                result: data.results,
                isPaid: false,
                lang: data.lang
            };
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching search results:', error)
                console.log(apiRoute);
            }
            return [];
        }
    }


    async makeQuickSearchApiRequestByID(query, apiRoute) {

        console.log('====makeQuickSearchApiRequest=======');
        console.log("query: " + query);
        console.log("apiRoute: " + apiRoute);



        const searchField2 = document.querySelector('.widget-search-input');
        const currentQuery2 = searchField2.value.trim();

        const paddedQuery = currentQuery2.length < 11 ? currentQuery2.padStart(11, '0') : currentQuery2;

        console.log('paddedQuery1 ' + paddedQuery);

        const domain = this.getDomainIdFromInput()

        const body = { id: String(paddedQuery), domain }
        console.log('body ' + JSON.stringify(body));
        try {
            const response = await fetch(apiRoute, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error('Network response was not ok');

            //faster than response.json()
            const text = await response.text();
            const data = JSON.parse(text);

            console.log('apiRoute ' + apiRoute);

            // Verify the response matches current input
            if ((!data.id || data.id !== String(paddedQuery)) || data.id === "") {
                return [];
            }
            // console.log("data results " + JSON.stringify(data.results));

            // console.log("data word " + data.word);

            if (data.isPaid) {
                return {
                    result: data.results,
                    isPaid: true,
                    id: data.id
                };
            }
            return {
                result: data.results,
                isPaid: false,
                id: data.id
            };
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching search results:', error)
                console.log(apiRoute);
            }
            return [];
        }
    }
    async fetchProducts(query, categoriesContainer, resultContainer, requestToken, controller) {



        // Clear any existing timeout
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        // Debouncing to prevent excessive API calls
        this.timeoutId = setTimeout(async() => {
            if (!query) return;

            console.log('===query===== ' + query);

            const searchInput = document.querySelector('.widget-search-input');
            const inputValue = searchInput ? searchInput.value.trim() : '';

            let exactProducts = [];
            let additionalProducts = [];
            let translatedProducts = [];
            let correctedProducts = [];

            let lang;
            // Check if query contains only numbers
            const isNumericQuery = /^\d+$/.test(query);

            // Pad query with leading zeros if less than 11 digits
            const paddedQuery = query.length < 11 ? query.padStart(11, '0') : query;

            if (isNumericQuery) {
                const quickSearchPromiseByID = this.makeQuickSearchApiRequestByID(paddedQuery, this.quickSearchByIDUrl)
                    .then(quickSearchResponse => {
                        const { result: result2, isPaid } = quickSearchResponse;

                        if (!isPaid) {
                            const overlayDiv = document.createElement('div');
                            overlayDiv.style.cssText = ``;
                            overlayDiv.innerHTML = ``;
                            document.querySelector('.widget-container').appendChild(overlayDiv);
                            return;
                        }

                        if (inputValue === query && result2.length && result2.length < this.minProductCount2) {
                            const exactProducts2 = result2;
                            this.displayProducts(exactProducts2, query, categoriesContainer, resultContainer);
                        }
                    });
                await quickSearchPromiseByID;
            }

            // Start the quick search request immediately
            const quickSearchPromise = await this.makeQuickSearchApiRequest(query, this.quickSearchUrl)
                .then(quickSearchResponse => {
                    const { result: result1, isPaid, lang: lang1 } = quickSearchResponse;
                    lang = lang1;
                    if (!isPaid) {
                        const overlayDiv = document.createElement('div');
                        overlayDiv.style.cssText = ``;
                        overlayDiv.innerHTML = ``;
                        document.querySelector('.widget-container').appendChild(overlayDiv);
                        return;
                    }

                    if (inputValue === query && result1.length && result1.length < this.minProductCount2) {
                        exactProducts = result1;
                        this.displayProducts(exactProducts, query, categoriesContainer, resultContainer);
                    }
                });

            // Wait for the quick search response to complete
            await quickSearchPromise;

            // Run all other fetches concurrently
            const [
                additionalSearchResponse,
                // translatedSearchResponse
            ] = await Promise.allSettled([
                this.makePOSTApiRequestAdditional(query, this.additionalSearchUrl, lang),
                // this.makePOSTApiRequest(query, this.translatedSearchUrl)
            ]);

            // Process additional search results 
            if (additionalSearchResponse.status === "fulfilled") {
                const result2 = additionalSearchResponse.value;

                // console.log('====additionalProducts=======');
                // console.log(result2);
                // console.log('===========');
                if (result2.length && result2.length < this.minProductCount2) {
                    additionalProducts = result2;

                    console.log('===========');
                    console.log('additionalProducts ');
                    console.log(additionalProducts);
                    console.log('===========');
                    this.displayProducts(additionalProducts, query, categoriesContainer, resultContainer, true);
                }
            }

            // // Process translated search results
            // if (translatedSearchResponse.status === "fulfilled") {
            //     const result4 = translatedSearchResponse.value;
            //     if (result4.length && result4.length < this.minProductCount2) {
            //         translatedProducts = result4;
            //         this.displayProducts(translatedProducts, query, categoriesContainer, resultContainer);
            //     }
            // }
            const checkSpellingResponse = await this.makeGETApiRequest(query, this.checkSpellingUrl);

            // Only fetch check spelling results if no results were found
            if (!exactProducts.length && !additionalProducts.length) {
                if (checkSpellingResponse.length && checkSpellingResponse.length < this.minProductCount2) {
                    correctedProducts = checkSpellingResponse;
                    console.log('====correctedProducts=======');
                    console.log(correctedProducts);
                    console.log('===========');
                    this.displayProducts(correctedProducts, query, categoriesContainer, resultContainer, false, true);
                    console.log('====закончили отображать 1е результаты=======');
                }
            }

            // If no results were found, display "no products found" message
            if (!exactProducts.length && !additionalProducts.length && !translatedProducts.length && !correctedProducts.length) {

                console.log('====нет результатов=======');


                // resultContainer.innerHTML = this.translations.noProductsFound;
                // categoriesContainer.innerHTML = '';
                // const leftCol = this.widgetContainer.querySelector('.left-column');
                // if (leftCol) leftCol.style.display = 'none';
            }
        }, 300); // 300ms debounce delay
    }




    //TODO чтобы был обьект "слово":[все результаты] и если слово не равно searchInput
    // this.allProducts = []; // Reset all products

    async displayProducts(products, query, categoriesContainer, resultContainer, isAdditional = false, isCorrected = false) {
        // Clear previous results at the start
        // this.allProducts = []; // Reset all products
        categoriesContainer.innerHTML = ''; // Clear categories
        // resultContainer.innerHTML = ''; // Clear results

        console.log('====products=======');
        console.log(products);
        console.log('===========');

        // Store products based on which query this is
        if (isAdditional) {
            // Append to existing products

            console.log('====this.exactProducts=======');
            console.log(this.exactProducts);
            console.log('===========');

            if (this.exactProducts)
                this.allProducts = [...this.allProducts, ...products];

            else {
                this.allProducts = products;
            }
        }
        if (isCorrected) {


            if (this.exactProducts)
                this.allProducts = [...products];
            else {
                this.allProducts = products;
            }

            this.correctedProducts = products;

            // this.allProducts = products;

            console.log('==IN ISCORRECTED=======');

            console.log('====this.allProducts=======');
            console.log(this.allProducts);
            console.log('===========');


            console.log('====this.exactProducts=======');
            console.log(this.exactProducts);
            console.log('===========');
        }
        if (!isCorrected && !isAdditional) {
            //only exact products
            this.allProducts = products;
            this.exactProducts = products;
        }
        // console.log('====this.allProducts.length=======');
        // console.log(this.allProducts.length);
        // console.log('===========');

        const leftCol = this.widgetContainer.querySelector('.left-column');

        if (leftCol) leftCol.style.display = 'flex';

        this.buildFilterMenu();
        const filtered = this.applyActiveFilters(this.allProducts);
        // console.log('Products received:', this.allProducts);
        // if (isAdditional) { console.log('isAdditional') }
        if (filtered.length < this.minProductCount)
            this.displayProductsByCategory(filtered, categoriesContainer, resultContainer, isAdditional);
        else
            this.displayProductsByCategory([], categoriesContainer, resultContainer, isAdditional, isCorrected);

        //TODO вернуть потом
        // await this.saveSearchQuery(query);

        // if (this.noProductsFound) {
        //     resultContainer.innerHTML = ` < p > $ { this.translations.noProductsFound } < /p>`;
        //     categoriesContainer.innerHTML = '';

        //     if (leftCol) leftCol.style.display = 'none';
        // }
    }

    async displayProductsByCategory(products, categoriesContainer, resultContainer, isAdditional = false, isCorrected = false) {
        const filterContainer = this.widgetContainer.querySelector('.filter-container');
        const catAccordion = this.widgetContainer.querySelector('.category-accordion');
        const leftCol = this.widgetContainer.querySelector('.left-column');

        //Initial Setup and Empty State Handling:
        categoriesContainer.innerHTML = '';
        //resultContainer.innerHTML = '';

        console.log('====products=======');
        console.log(products);
        console.log('===========');

        if (!products.length) {
            // resultContainer.innerHTML = `<p>${this.translations.noProductsFound}</p>`;

            if (!this.hasFilters) {
                if (filterContainer) filterContainer.style.display = 'none';
                if (catAccordion) catAccordion.style.display = 'none';
                if (leftCol) leftCol.style.display = 'none';
            } else {

                if (filterContainer) filterContainer.style.display = 'flex';
                if (catAccordion) catAccordion.style.display = 'none';
                if (leftCol) leftCol.style.display = 'flex';
            }
            return;
        }


        if (!this.hasFilters) {
            if (filterContainer) filterContainer.style.display = 'none';
        } else {
            if (filterContainer) filterContainer.style.display = 'flex';
        }

        //Product Deduplication:
        const uniqueProducts = [];
        const usedIdsGlobal = new Set();
        for (let p of products) {

            if (!usedIdsGlobal.has(p.id)) {
                uniqueProducts.push(p);
                usedIdsGlobal.add(p.id);
                // console.log('Added product to uniqueProducts. Current length:', uniqueProducts.length);
            } else {
                // console.log('Skipped duplicate product with id:', p.id);
            }
        }
        // console.log('Final uniqueProducts:', uniqueProducts);

        //Category Organization:
        const catMap = {};
        uniqueProducts.forEach((product) => {
            // console.log('====product=======');
            // console.log(product);
            // console.log('===========');
            if (!product.category)
                return
            const catName = product.category
                //на розетке это находится в categoryUrls
                // const catUrl = catObj.url;
            if (!catMap[catName]) {
                catMap[catName] = {
                    items: [],
                    // url: catUrl
                };
            }
            catMap[catName].items.push(product);
        });

        // console.log('====catMap=======');
        // console.log(catMap);
        // console.log('===========');


        const catMapNoDupes = {};
        for (const catName in catMap) {
            const arr = catMap[catName].items;
            // console.log('====arr=======');
            // console.log(arr);
            // console.log('===========');
            const localSet = new Set();
            const filtered = [];
            for (const prod of arr) {
                if (!localSet.has(prod.id)) {
                    localSet.add(prod.id);
                    filtered.push(prod);
                }
            }

            catMapNoDupes[catName] = {
                items: filtered,
                url: catMap[catName].url
            };
        }
        // console.log('=====catMapNoDupes=========');
        // console.log(catMapNoDupes);
        // console.log('==============');

        //TAG 

        const catNames = Object.keys(catMapNoDupes);

        // console.log('====catNames=======');
        // console.log(catNames);
        // console.log('===========');

        if (!catNames.length) {
            if (catAccordion) catAccordion.style.display = 'none';

            //вернуть
            // resultContainer.innerHTML = `<p>${this.translations.noProductsFound}</p>`;
            return;
        } else {
            if (catAccordion) catAccordion.style.display = 'flex';
        }

        //Tracks products already processed to avoid duplicates.
        const usedSet = new Set();

        //Stores scores for each category.
        const categoryScores = {};

        // Maps each category name to its list of items.
        this.catAllItemsMap = {};

        //Holds a subset of top-scoring products for each category.
        this.catScoringSubsets = {};

        //Этот код используется для:
        // Организации товаров по категориям
        // Предотвращения дублирования товаров
        // Приоритизации товаров в наличии
        // Оценки качества категорий для их последующей сортировки
        // Подготовки данных для отображения в интерфейсе
        catNames.forEach((catName) => {
            const items = catMapNoDupes[catName].items;

            this.catAllItemsMap[catName] = items;

            const inStock = items.filter((x) => x.availability);
            const outStock = items.filter((x) => !x.availability);
            const sortedItems = [...inStock, ...outStock];

            const filteredItems = sortedItems.filter((p) => !usedSet.has(p.id));

            const subsetCount = Math.min(this.maxItemsOnAllResults, filteredItems.length);
            const subset = filteredItems.slice(0, subsetCount);

            let score = 0;
            subset.forEach((prd, idx) => {
                let productScore = 0;
                let reasons = [];


                if (prd.availability) {
                    productScore += 1;
                    reasons.push('+1 (товар в наличии)');
                } else {
                    productScore -= 1;
                    reasons.push('-1 (товар нет в наличии)');
                }


                const PLACEHOLDER_URL = 'https://i.pinimg.com/564x/0c/bb/aa/0cbbaab0deff7f188a7762d9569bf1b3.jpg';
                if (!prd.picture || prd.picture === PLACEHOLDER_URL) {
                    productScore -= 1;
                    reasons.push('-1 (нет реальной картинки)');
                }

                score += productScore;

            });

            categoryScores[catName] = score;


            this.catScoringSubsets[catName] = subset;


            subset.forEach((p) => usedSet.add(p.id));
        });


        catNames.sort((a, b) => (categoryScores[b] || 0) - (categoryScores[a] || 0));

        // console.log('=====catNames=========');
        // console.log(catNames);
        // console.log('==============');

        const allResultsName = this.translations.allResults || 'All results';
        const finalCats = [allResultsName, ...catNames];

        // Renders Category Buttons
        let i = 0;
        finalCats.forEach((catName) => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';


            categoryItem.dataset.catName = catName;

            let displayName = catName;
            if (displayName.length > 22) {
                displayName = displayName.substring(0, 22) + '...';
            }

            const categoryText = document.createElement('span');
            categoryText.className = 'category-name';
            categoryText.textContent = displayName;

            const categoryCount = document.createElement('div');
            categoryCount.className = 'category-count';

            // console.log('====catMapNoDupes=======');
            // console.log(catMapNoDupes);
            // console.log('===========');

            if (catName === allResultsName) {
                categoryCount.textContent = uniqueProducts.length;
            } else {
                // console.log('===== catMapNoDupes.undefined.items=========');
                // console.log(catMapNoDupes.undefined.items);
                // console.log('==============');
                try {
                    categoryCount.textContent = catMapNoDupes.undefined.items.length;
                } catch (e) {

                    categoryCount.textContent = catMapNoDupes[catName].items.length;
                }
            }

            categoryItem.appendChild(categoryText);
            categoryItem.appendChild(categoryCount);

            categoryItem.addEventListener('click', async() => {

                Array.from(categoriesContainer.getElementsByClassName('category-item'))
                    .forEach((el) => el.classList.remove('active'));
                categoryItem.classList.add('active');
                let singleObj;

                //"Все результаты"
                if (catName === allResultsName) {
                    //clicked on "All results"
                    await this.renderAllCategories(finalCats, catMapNoDupes, resultContainer, false, isAdditional, true);
                } else {
                    //clicked on category
                    //render single category results
                    try {
                        singleObj = {
                            [catName]: catMapNoDupes.undefined.items
                        }

                    } catch (e) {
                        singleObj = {
                            [catName]: catMapNoDupes[catName].items
                        }
                    }

                    // console.log('====singleObj=======');
                    // console.log(singleObj);
                    // console.log('===========');
                    //Object { "Спорт і захоплення": (4) […] }

                    await this.renderAllCategories([catName], singleObj, resultContainer, true, isAdditional, false);

                }
            });

            categoriesContainer.appendChild(categoryItem);
            i++;
        });


        const firstItem = categoriesContainer.querySelector('.category-item');
        if (firstItem) firstItem.classList.add('active');

        this.catMapNoDupes = catMapNoDupes;

        // Trigger click on first category item to show initial results
        // if (firstItem) firstItem.click();

        //STOP POINT
        // console.log('====renderAllCategories=======');
        // console.log(catMapNoDupes);
        // console.log('===========');
        await this.renderAllCategories(finalCats, catMapNoDupes, resultContainer, false, isAdditional, false);
    };

    async renderAllCategories(
        categoryNames,
        groupedProducts,
        resultContainer,
        isSingle = false,
        isAdditional = false,
        clicked
    ) {
        // console.log('in renderAllCategories')

        //если выбрали категорию, очищаем контейнер
        if ((isSingle || clicked)) resultContainer.innerHTML = '';

        if (isSingle) {
            resultContainer.classList.add('category');
        } else {
            resultContainer.classList.remove('category');
        }

        const tResp = await fetch('https://widget-dev-iota.vercel.app/widget/product-item.html');
        if (!tResp.ok) {
            throw new Error(`Failed to load product template: ${tResp.status}`);
        }
        const productTemplate = await tResp.text();

        const allResultsName = this.translations.allResults || 'All results';

        // showingAllCats is true when:
        // 1. We are NOT in single category mode (isSingle is false)
        // 2. AND the categoryNames array includes the "All results" category
        // This indicates we are showing the full category listing view rather than a single category
        const showingAllCats = !isSingle && categoryNames.includes(allResultsName);

        if (showingAllCats) {
            const categoryNames2 = categoryNames.filter((cn) => cn !== allResultsName);

            for (const catName of categoryNames2) {

                // console.log('====catName=========');
                // console.log(catName)
                // console.log('===========');
                let top4;
                try {
                    top4 = this.catScoringSubsets[catName];
                    // console.log('====top4=========');
                    // console.log(top4)
                    // console.log('===========');
                } catch (e) {
                    top4 = [];
                }

                let allItems;
                try {
                    allItems = this.catAllItemsMap[catName]
                } catch (e) {
                    allItems = [];
                }

                if (!top4.length) {
                    // console.log('====top4.length=========');
                    // console.log(top4.length)
                    // console.log('===========');
                    continue;
                }

                this.renderCategoryBlock(
                    catName,
                    allItems,
                    top4,
                    productTemplate,
                    false,
                    resultContainer, isAdditional
                );
            }
        } else {
            for (const catName of categoryNames) {
                const arr = groupedProducts[catName] || [];
                if (!arr.length) continue;

                this.renderCategoryBlock(
                    catName,
                    arr,
                    arr,
                    productTemplate,
                    true,
                    resultContainer, isAdditional
                );
            }
        }
    }

    //The renderCategoryBlock function is responsible for
    // rendering a block of products within a category in a product search widget.
    renderCategoryBlock(
        catName,
        allItems,
        top4,
        productTemplate,
        isSingleCat,
        resultContainer, isAdditional
    ) {
        // Check if category block already exists
        const existingCatBlock = resultContainer.querySelector(`.category-block[data-category="${catName}"]`);
        if (existingCatBlock) {
            return; // Skip if category already rendered
        }

        let catBlock = document.createElement('div');
        catBlock.className = `category-block ${isSingleCat ? 'category-single' : 'category-multiple'}`;
        catBlock.setAttribute('data-category', catName); // Add data attribute for tracking

        const allResultsName = this.translations.allResults || 'All results';
        let categoryUrl = '#';

        try {
            if (catName !== allResultsName && this.catMapNoDupes.undefined.url) {
                categoryUrl = this.catMapNoDupes.undefined.url;
            }
        } catch (e) {
            if (catName !== allResultsName && this.catMapNoDupes.url) {
                categoryUrl = this.catMapNoDupes.url;
            }
        }

        const titleHtml = `
          <h3>
            <a href="${categoryUrl}" class="category-link" target="_blank">
              ${catName} →
            </a>
          </h3>
        `;
        catBlock.innerHTML = titleHtml;

        this.productContainer = document.createElement('div');
        this.productContainer.className = 'product-container';

        catBlock.appendChild(this.productContainer);

        if (resultContainer == undefined) {
            resultContainer = '';
            // console.log('====undefined=========');
        } else {
            resultContainer.appendChild(catBlock);
        }

        let itemsToRender;
        if (isSingleCat) {
            itemsToRender = allItems;
            // console.log('====isSingleCat=========');
            // console.log(isSingleCat)
            // console.log('===========');
        } else {
            itemsToRender = top4;
        }

        if (!this.labelColorMap) {
            this.labelColorMap = {};
        }
        const possibleColors = ['#E91E63', '#2196F3', '#4CAF50', '#9C27B0', '#FF5722', '#FF9800', '#009688', '#795548', '#607D8B', '#3F51B5', '#CDDC39', '#FFC107', '#00BCD4', '#8BC34A', '#673AB7'];
        const PLACEHOLDER_URL =
            'https://i.pinimg.com/564x/0c/bb/aa/0cbbaab0deff7f188a7762d9569bf1b3.jpg';

        const inStockWithImg = itemsToRender.filter(
            (p) => p.availability && p.picture && p.picture !== PLACEHOLDER_URL
        );
        const inStockNoImg = itemsToRender.filter(
            (p) => p.availability && (!p.picture || p.picture === PLACEHOLDER_URL)
        );
        const outStockWithImg = itemsToRender.filter(
            (p) => !p.availability && p.picture && p.picture !== PLACEHOLDER_URL
        );
        const outStockNoImg = itemsToRender.filter(
            (p) => !p.availability && (!p.picture || p.picture === PLACEHOLDER_URL)
        );

        const sortedItems = [
            ...inStockWithImg,
            ...inStockNoImg,
            ...outStockWithImg,
            ...outStockNoImg,
        ];

        sortedItems.forEach((prod) => {
            let labelHtml = '';
            if (prod.label) {
                // Split label string into array of words
                const labels = prod.label.split(',').map(label => label.trim());

                // Generate label HTML for each word
                labelHtml = labels.map(label => {
                    if (!this.labelColorMap[label]) {
                        // Use next available color in sequence
                        const colorIndex = Object.keys(this.labelColorMap).length % possibleColors.length;
                        this.labelColorMap[label] = possibleColors[colorIndex];
                    }
                    const labelColor = this.labelColorMap[label];

                    return `
                      <div class="product-label" 
                           style="
                             background-color: ${labelColor};
                             color: #fff;
                             display: inline-block;
                             padding: 3px 6px;
                             border-radius: 4px;
                             font-size: 12px;
                             margin-bottom: 5px;
                             margin-right: 5px;">
                        ${Syntax.escapeHtml(label)}
                      </div>`;
                }).join('');
            }

            let oldPriceValue = '';
            let oldPriceStyle = 'display: none;';
            if (prod.oldPrice && prod.oldPrice > 0 && prod.oldPrice !== prod.newPrice) {
                oldPriceValue = `
              <span style="white-space: nowrap;">
                <span style="color: grey; font-size: 13px; text-decoration: line-through;">
                  ${prod.oldPrice} ${prod.currencyId ?? ''}
                </span>
                <span style="text-decoration: none;">&nbsp;&nbsp;</span>
              </span>
                `.trim();
            }

            const presenceText = prod.availability || prod.presence ?
                this.translations.inStock :
                this.translations.outOfStock;

            const finalpictureUrl =
                prod.picture !== PLACEHOLDER_URL ?
                prod.picture :
                PLACEHOLDER_URL;

            let displayName = prod.name || 'No Name';
            if (displayName.length > 90) {
                displayName = displayName.slice(0, 90) + '...';
            }

            let pHtml = productTemplate;

            pHtml = Syntax.safeReplace(pHtml, 'labelBlock', labelHtml);

            //код может быть числом или строкой, если число, убираем нули в начале
            let prodCode;
            prodCode = Number(prod.code);
            if (isNaN(prodCode))
                prodCode = prod.code;



            pHtml = Syntax.safeReplace(pHtml, 'code', Syntax.escapeHtml(prodCode));
            pHtml = Syntax.safeReplace(pHtml, 'name', Syntax.escapeHtml(displayName));
            pHtml = Syntax.safeReplace(pHtml, 'price', String(prod.newPrice ? prod.newPrice : '???'));
            pHtml = Syntax.safeReplace(pHtml, 'currencyId', Syntax.escapeHtml(prod.currencyId ? prod.currencyId : '???'));
            pHtml = Syntax.safeReplace(pHtml, 'presence', Syntax.escapeHtml(presenceText));
            pHtml = Syntax.safeReplace(pHtml, 'oldPrice', oldPriceValue);
            pHtml = Syntax.safeReplace(pHtml, 'oldPriceStyle', oldPriceStyle);
            pHtml = Syntax.safeReplace(pHtml, 'pictureUrl', Syntax.escapeHtml(finalpictureUrl));

            const wrapperEl = document.createElement('div');
            wrapperEl.innerHTML = pHtml.trim();

            const linkWrap = document.createElement('a');
            linkWrap.href = prod.url || '#';
            linkWrap.target = '_blank';
            linkWrap.className = 'product-link';

            if (!prod.availability) {
                linkWrap.classList.add('out-of-stock');
            }

            //STOP POINT не обновляет новые товары, а добавляет к старым
            linkWrap.appendChild(wrapperEl.firstElementChild);
            this.productContainer.appendChild(linkWrap);
        });

        const shownCount = sortedItems.length;
        const totalCount = allItems.length;
        if (!isSingleCat && totalCount > shownCount) {
            const showMoreProductsDiv = document.createElement('div');
            showMoreProductsDiv.className = 'more-link';
            showMoreProductsDiv.textContent = `${this.translations.more} ${totalCount - shownCount} ...`;

            showMoreProductsDiv.addEventListener('click', () => {
                const singleObj = {
                    [catName]: allItems
                };
                this.renderAllCategories([catName], singleObj, resultContainer, true);
                this.activateCategory(catName);
            });
            this.productContainer.appendChild(showMoreProductsDiv);
        }

        this.ifSearchIsDone = true;
    }

    getLangFromInput() {
        const searchInput = document.getElementById('searchInput');
        const lang = searchInput.getAttribute('lang');
        return lang;
    }

    activateCategory(catName) {
        const categoriesContainer = this.widgetContainer.querySelector('.categories-container');
        if (!categoriesContainer) return;

        const allCatItems = categoriesContainer.querySelectorAll('.category-item');
        allCatItems.forEach((el) => el.classList.remove('active'));

        allCatItems.forEach((catItem) => {

            if (catItem.dataset.catName === catName) {
                catItem.classList.add('active');
            }
        });
    }

    getProductCountFromInput() {
        const searchInput = document.getElementById('searchInput');
        const productCount = searchInput.getAttribute('product-count');
        return productCount;
    }

    async fetchInterfaceLanguage(domainPath) {
        try {

            const resp = await this.fetchAPI(this.languageRoute, { domain: domainPath })

            if (!resp || !resp.success) {
                return null;
            }

            return resp.language || null;
        } catch (err) {
            console.error('[ERROR] fetchInterfaceLanguage:', err);
            return null;
        }
    }

    applyTranslations(langCode) {
        if (this.translationsMap[langCode]) {
            this.translations = this.translationsMap[langCode];
        } else {}
    }

    async saveSearchQuery(query) {
        if (!this.userId || !query) return;
        try {

            const fullPathNoQuery = window.location.origin + window.location.pathname;

            const resp = await fetch('https://smartsearch.spefix.com/api/addSearchQuery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userId,
                    query: query,
                    domain: fullPathNoQuery
                })
            });
        } catch (err) {
            console.error('[LOG:saveSearchQuery] Error:', err);
        }
    }

    async saveWordsToDatabase(query) {
        if (!query) return;
        try {
            const r = await fetch('https://smartsearch.spefix.com/api/save-words', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: query })
            });
        } catch (err) {
            console.error('[LOG:saveWordsToDatabase] Error:', err);
        }
    }


    async makeGETApiRequest(query, apiRoute, lang) {
        // Only proceed if query matches current input

        const searchInput = document.getElementById('searchInput');
        const domain = this.getDomainIdFromInput()

        // console.log('====makeGETApiRequest=======');
        // console.log("query: " + query);
        // console.log("apiRoute: " + apiRoute);
        // console.log('===========');
        try {
            const response = await fetch(`${apiRoute}?word=${encodeURIComponent(query)}&domain=${domain}&lang=${lang}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Network response was not ok');

            //faster than response.json()
            const text = await response.text();
            const data = JSON.parse(text);

            // console.log("data " + data.result);
            if (data.result[0] === query) {
                return ["исправлений не требуется"];
            }

            // console.log('====isCorrected=======');

            // console.log(query);
            // console.log(data.result);
            // console.log('===========');

            return data.result;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching search results:', error);
            }
            return [];
        }
    }



    //динамическое добавление:
    //Если вы хотите, чтобы data-domain-id передавался динамически из HTML,
    //можно использовать другой атрибут(например, data - domain - id) в исходном HTML:
    //
    // Чтобы обрабатывать data-domain-id на другом сервере, вы можете отправлять данные из вашего
    // виджета(включая data-domain-id и другие необходимые данные) на внешний сервер через HTTP -
    // запросы(например, с использованием fetch).

    getDomainIdFromInput() {
        const searchInput = document.getElementById("searchInput");

        if (searchInput) {
            // Получить domainId из атрибута
            const domainId = searchInput.getAttribute("data-domain-id");

            return Number(domainId)
        } else {
            console.error("Элемент с 'data-domain-id' не найден!");
        }
    }

}

class Syntax {
    static escapeHtml(str) {
        try {
            return String(str) // Convert any value to a string
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        } catch (e) {
            console.error('Error escaping HTML:', e);
            return '';
        }
    }

    // Replace all occurrences of searchText with replaceText
    static safeReplace(originalText, searchText, replaceText) {
        const regex = new RegExp(`\\{\\{${searchText}\\}\\}`, 'g'); // 'g' for global replacement
        return originalText.replace(regex, replaceText);
    }
}


document.addEventListener('DOMContentLoaded', () => {



    function firstFunction(callback) {


        // console.log("First function starts...");

        const myInstance = new ProductSearchWidget('searchInput');


        const prodUrl = "https://smartsearch.spefix.com"
            // development
        const devUrl = "http://localhost:3000"

        const currentUrl = prodUrl;

        const quickSearchUrl = currentUrl + '/api/quick-search';

        //dummy request
        // myInstance.makePOSTApiRequest("test", quickSearchUrl);
        const searchInput = document.getElementById('searchInput');

        //if user clicked on searchInput and there is no document.querySelector('.widget-container'),
        // repeat the click
        if (searchInput) {
            searchInput.addEventListener('click', function handleClick() {
                // If widget container doesn't exist, trigger another click
                if (!document.querySelector('.widget-container')) {
                    setTimeout(() => {
                        searchInput.click();
                        searchInput.click();
                        searchInput.click();
                    }, 100);
                }
            });
        }


        // Listen for user typing in the search bar

        const inputElements = document.querySelectorAll('.widget-search-input');

        // Add an event listener to each input element
        inputElements.forEach((input) => {});

    }

    function secondFunction(myInstance) {
        // console.log("Second function runs after the first!");

        const container = document.getElementById('myContainer');

        // console.log('====myInstance.productContainer=======');
        // console.log(myInstance.productContainer);
        // console.log('===========');

        const str = myInstance.productContainer.innerHTML || '';

        // console.log('====str=======');
        // console.log(str);
        // console.log('===========');
    }

    // Initialize the sequence
    firstFunction(secondFunction);


});