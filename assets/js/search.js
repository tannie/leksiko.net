(function () {

    var replacementsh = {
        'ch': 'ĉ', 'Ch': 'Ĉ',
        'gh': 'ĝ', 'Gh': 'Ĝ',
        'hh': 'ĥ', 'HH': 'Ĥ',
        'jh': 'ĵ', 'Jh': 'Ĵ',
        'sh': 'ŝ', 'Sh': 'Ŝ',
        'uh': 'ŭ', 'Uh': 'Ŭ'
    };

    var replacementsx = {
        'cx': 'ĉ', 'Cx': 'Ĉ',
        'gx': 'ĝ', 'Gx': 'Ĝ',
        'hx': 'ĥ', 'Hx': 'Ĥ',
        'jx': 'ĵ', 'Jx': 'Ĵ',
        'sx': 'ŝ', 'Sx': 'Ŝ',
        'ux': 'ŭ', 'Ux': 'Ŭ'
    };

    var replacements = {
        'c': 'ĉ', 'C': 'Ĉ',
        'g': 'ĝ', 'G': 'Ĝ',
        'h': 'ĥ', 'H': 'Ĥ',
        'j': 'ĵ', 'J': 'Ĵ',
        's': 'ŝ', 'S': 'Ŝ',
        'u': 'ŭ', 'U': 'Ŭ'
    };

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
        var found = false;

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
            preview = preview.replace(new RegExp("(" + parts.join("|") + ")", "gi"), "<mark><span class=\"hilight2\">$1</span></mark>");
            found = true;

        }
        else {
            // check for version with h, x and c replaced
            var modifiedhQueries = [query];
            for (var key in replacementsh) {
                modifiedhQueries.push(query.replace(new RegExp(key, 'g'), replacementsh[key]));
            }

            var modifiedxQueries = [query];
            for (var key in replacementsx) {
                modifiedxQueries.push(query.replace(new RegExp(key, 'g'), replacementsx[key]));
            }

            var modifiedQueries = [query];
            for (var key in replacements) {
                modifiedQueries.push(query.replace(new RegExp(key, 'g'), replacements[key]));
            }


            modifiedhQueries.concat(modifiedxQueries, modifiedQueries).forEach(function (modifiedQuery) {
                if (found) {
                    return;
                }
                match = content.toLowerCase().indexOf(modifiedQuery.toLowerCase());
                matchLength = modifiedQuery.length;
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
                    preview = preview.replace(new RegExp("(" + modifiedQuery.split(" ").join("|") + ")", "gi"), "<mark><span class=\"hilight-alt\">$1</span></mark>");
                    found = true;
                }
                else {
                    console.log("Not found in alt: " + modifiedQuery);
                    // Use start of content if no match found
                    preview = content.substring(0, previewLength).trim() + (content.length > previewLength ? "..." : "");
                }
            }
            );
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
                    console.log("Found: " + item.metadata.url);
                    let url = item.metadata.url ? item.metadata.url.trim() : '';
                    let precomposed = url.normalize('NFC'); // Precomposed form
                    var contentPreview = getPreview(query, item.content || "", 170),
                        titlePreview = getPreview(query, item.metadata.title),
                        tagsPreview = "",
                        languagesPreview = "";

                    if (item.metadata.tags) {
                            var tags = item.metadata.tags ? item.metadata.tags.join(", ") : "";
                        tagsPreview = "<i class=\"fa fa-tag text-body-secondary\"></i> " + getPreview(query, tags) + "<br />";
                            }
                        else {
                            tagsPreview = "";
                        }
                    if (item.metadata.languages) {
                        var languages = Object.keys(item.metadata.languages).map(lang => `${lang.toUpperCase()}: ${item.metadata.languages[lang].join(", ")}`).join(" - ");
                        languagesPreview = getPreview(query, languages);
                    }
                    else {
                        languagesPreview = "";
                    }



                    resultsHTML += "<li><h6><a href='" + precomposed + "'>" + titlePreview + "</a></h6><p><small>" + tagsPreview  + languagesPreview + "</small ></p><p><small>" + contentPreview + "</small></p></li > ";
                }
            });

            searchResultsEl.innerHTML = resultsHTML;
            searchProcessEl.innerText = "Trovis rezultojn";
        } else {
            searchResultsEl.style.display = "none";
            searchProcessEl.innerText = "Ne trovis rezultojn";
        }
    }

    function performSearch(query) {
        var exactTitleMatches = [];
        var phraseTitleMatches = [];
        var partialTitleMatches = [];
        var languageMatches = [];
        var contentMatches = [];
        var tagsMatches = [];

        var modifiedhQueries = [query];
        for (var key in replacementsh) {
            modifiedhQueries.push(query.replace(new RegExp(key, 'g'), replacementsh[key]));
        }

        var modifiedxQueries = [query];
        for (var key in replacementsx) {
            modifiedxQueries.push(query.replace(new RegExp(key, 'g'), replacementsx[key]));
        }

        var modifiedQueries = [query];
        for (var key in replacements) {
            modifiedQueries.push(query.replace(new RegExp(key, 'g'), replacements[key]));
        }

        for (var key in window.data) {
            var item = window.data[key];
            var tags = item.metadata.tags ? item.metadata.tags.join(" ") : "";
            var page_body = item.content ? item.content : "";
            var languages = item.metadata.languages ? Object.keys(item.metadata.languages).map(lang => `${lang.toUpperCase()}: ${item.metadata.languages[lang].join(", ")}`).join(" ") : "";

            modifiedhQueries.concat(modifiedxQueries, modifiedQueries).forEach(function(modifiedQuery) {
                if (item.metadata.title && (item.metadata.title.toLowerCase() === query.toLowerCase() || item.metadata.title.toLowerCase() === modifiedQuery.toLowerCase())) {
                    exactTitleMatches.push(item);
                } else if (item.metadata.title && (item.metadata.title.toLowerCase().split(" ").includes(query.toLowerCase()) || item.metadata.title.toLowerCase().split(" ").includes(modifiedQuery.toLowerCase()))) {
                    phraseTitleMatches.push(item);
                } else if (item.metadata.title && (item.metadata.title.toLowerCase().includes(query.toLowerCase()) || item.metadata.title.toLowerCase().includes(modifiedQuery.toLowerCase()))) {
                    partialTitleMatches.push(item);
                } else if (languages.toLowerCase().includes(query.toLowerCase()) || languages.toLowerCase().includes(modifiedQuery.toLowerCase())) {
                    languageMatches.push(item);
                } else if (page_body.toLowerCase().includes(query.toLowerCase()) || page_body.toLowerCase().includes(modifiedQuery.toLowerCase())) {
                    contentMatches.push(item);
                }
                else if (tags.toLowerCase().includes(query.toLowerCase()) || tags.toLowerCase().includes(modifiedQuery.toLowerCase())) {
                    tagsMatches.push(item);
                }

            });
        }
        // remove duplicates
        exactTitleMatches = exactTitleMatches.filter((v, i, a) => a.findIndex(t => (t.metadata.title === v.metadata.title)) === i);
        phraseTitleMatches = phraseTitleMatches.filter((v, i, a) => a.findIndex(t => (t.metadata.title === v.metadata.title)) === i);
        partialTitleMatches = partialTitleMatches.filter((v, i, a) => a.findIndex(t => (t.metadata.title === v.metadata.title)) === i);
        languageMatches = languageMatches.filter((v, i, a) => a.findIndex(t => (t.metadata.title === v.metadata.title)) === i);
        contentMatches = contentMatches.filter((v, i, a) => a.findIndex(t => (t.metadata.title === v.metadata.title)) === i);
        tagsMatches = tagsMatches.filter((v, i, a) => a.findIndex(t => (t.metadata.title === v.metadata.title)) === i);



        return exactTitleMatches.concat(phraseTitleMatches, partialTitleMatches, languageMatches, contentMatches, tagsMatches);
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
