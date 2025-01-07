(function () {
    function getQueryVariable(variable) {
        var query = window.location.search.substring(1),
            vars = query.split("&");

        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");

            if (pair[0] === variable) {
                return decodeURIComponent(pair[1].replace(/\+/g, '%20')).trim();
            }
        }
        return null;
    }

    function sanitizeMarkdownLinks(content) {
        // Remove Markdown links
        return content.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    }

    function getPreview(query, content, previewLength) {
        previewLength = previewLength || (content.length * 2);

        // Sanitize content by removing Markdown links
        content = sanitizeMarkdownLinks(content);

        var parts = query.split(" "),
            match = content.toLowerCase().indexOf(query.toLowerCase()),
            matchLength = query.length,
            preview;

        // Find a relevant location in content
        for (var i = 0; i < parts.length; i++) {
            if (match >= 0) {
                break;
            }

            match = content.toLowerCase().indexOf(parts[i].toLowerCase());
            matchLength = parts[i].length;
        }

        // Create preview
        if (match >= 0) {
            var start = match - (previewLength / 2),
                end = start > 0 ? match + matchLength + (previewLength / 2) : previewLength;

            preview = content.substring(start, end).trim();

            if (start > 0) {
                preview = "..." + preview;
            }

            if (end < content.length) {
                preview = preview + "...";
            }

            // Highlight query parts
            preview = preview.replace(new RegExp("(" + parts.join("|") + ")", "gi"), "<strong>$1</strong>");
        } else {
            // Use start of content if no match found
            preview = content.substring(0, previewLength).trim() + (content.length > previewLength ? "..." : "");
        }

        return preview;
    }

    function displaySearchResults(results, query) {
        var searchResultsEl = document.getElementById("search-results"),
            searchProcessEl = document.getElementById("search-process");

        if (results.length) {
            var resultsHTML = "";
            results.forEach(function (item) {
                if (item.metadata && item.metadata.title) {
                    let url = item.metadata.url ? item.metadata.url.trim() : '';
                    let precomposed = url.normalize('NFC'); // Precomposed form
                    var contentPreview = getPreview(query, item.sections.Difino || item.sections.Uzado || item.sections.Ekzemploj || "", 170),
                        titlePreview = getPreview(query, item.metadata.title),
                        languagesPreview = item.metadata.languages ? item.metadata.languages.map(lang => `${Object.keys(lang)[0].toUpperCase()}: ${Object.values(lang)[0].replace(new RegExp("(" + query + ")", "gi"), "<strong>$1</strong>")}`).join("<br>") : "";
                    resultsHTML += "<li><h5><a href='" + precomposed + "'>" + titlePreview + "</a></h5><p><small>" + contentPreview + "</small></p><p><small>" + languagesPreview + "</small></p></li>";
                }
            });

            searchResultsEl.innerHTML = resultsHTML;
            searchProcessEl.innerText = "Rezultoj trovante";
        } else {
            searchResultsEl.style.display = "none";
            searchProcessEl.innerText = "No";
        }
    }

    function performSearch(query) {
        var exactTitleMatches = [];
        var phraseTitleMatches = [];
        var partialTitleMatches = [];
        var languageMatches = [];
        var contentMatches = [];

        for (var key in window.data) {
            var item = window.data[key];
            var tags = item.metadata.tags ? item.metadata.tags.join(" ") : "";
            var languages = item.metadata.languages ? item.metadata.languages.map(lang => Object.values(lang)[0]).join(" ") : "";

            if (item.metadata.title && item.metadata.title.toLowerCase() === query.toLowerCase()) {
                exactTitleMatches.push(item);
            } else if (item.metadata.title && item.metadata.title.toLowerCase().split(" ").includes(query.toLowerCase())) {
                phraseTitleMatches.push(item);
            } else if (item.metadata.title && item.metadata.title.toLowerCase().includes(query.toLowerCase())) {
                partialTitleMatches.push(item);
            } else if (languages.toLowerCase().includes(query.toLowerCase())) {
                languageMatches.push(item);
            } else if ((item.sections.Difino && item.sections.Difino.toLowerCase().includes(query.toLowerCase())) ||
                       (item.sections.Uzado && item.sections.Uzado.toLowerCase().includes(query.toLowerCase())) ||
                       (item.sections.Ekzemploj && item.sections.Ekzemploj.toLowerCase().includes(query.toLowerCase())) ||
                       tags.toLowerCase().includes(query.toLowerCase())) {
                contentMatches.push(item);
            }
        }

        return exactTitleMatches.concat(phraseTitleMatches, partialTitleMatches, languageMatches, contentMatches);
    }

    var query = decodeURIComponent((getQueryVariable("q") || "").replace(/\+/g, "%20")),
        searchQueryContainerEl = document.getElementById("search-query-container"),
        searchQueryEl = document.getElementById("search-query");

    searchQueryEl.innerText = query;
    if (query != "") {
        searchQueryContainerEl.style.display = "inline";
    }

    fetch('/assets/js/search_index.json')
        .then(response => response.json())
        .then(data => {
            window.data = data;
            var results = performSearch(query);
            displaySearchResults(results, query); // Hand the results off to be displayed
        })
        .catch(error => {
            console.error('Error fetching search index:', error);
        });
})();
